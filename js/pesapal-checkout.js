/**
 * Shared PesaPal popup checkout helper.
 *
 * PesaPal's hosted checkout blocks iframing, so it can't be embedded
 * directly in the page — but it doesn't need to take over the tab either.
 * This opens it in a popup window instead, so whatever page the user was
 * on (movie player, series player, subscription page) never navigates
 * away. The popup closes itself and reports back via postMessage once
 * PesaPal redirects it to payment-success.html / payment-failed.html,
 * with a polling fallback against the verify endpoint in case the popup
 * is closed early or postMessage doesn't arrive.
 */
(function () {
    function openBlankPopup() {
        // Must be called synchronously inside the click handler (before any
        // `await`) — otherwise most browsers treat it as an unrequested
        // popup and block it.
        try {
            return window.open(
                '',
                'pesapal_checkout',
                'width=460,height=760,menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes'
            );
        } catch (e) {
            return null;
        }
    }

    function runCheckout(popup, redirectUrl, opts) {
        opts = opts || {};
        const { ref, token, apiBase, onSuccess, onFailure, onDone } = opts;
        const origin = window.location.origin;

        if (!popup || popup.closed) {
            // Popup was blocked — fall back to the old same-tab redirect
            // rather than leaving the user stuck.
            window.location.href = redirectUrl;
            return;
        }

        popup.location.href = redirectUrl;

        let settled = false;
        let pollTimer = null;
        let closeWatchTimer = null;

        function finish(status, data) {
            if (settled) return;
            settled = true;
            window.removeEventListener('message', onMessage);
            if (pollTimer) clearInterval(pollTimer);
            if (closeWatchTimer) clearInterval(closeWatchTimer);
            if (popup && !popup.closed) { try { popup.close(); } catch (e) {} }
            if (status === 'success' && onSuccess) onSuccess(data);
            else if (status !== 'success' && onFailure) onFailure(status, data);
            if (onDone) onDone(status, data);
        }

        function onMessage(event) {
            if (event.origin !== origin) return;
            if (!event.data || event.data.type !== 'pesapal-payment-complete') return;
            finish(event.data.status, event.data);
        }
        window.addEventListener('message', onMessage);

        // Polling fallback — covers the case where postMessage never arrives
        // (e.g. the popup gets closed right after PesaPal settles, before
        // its script runs).
        if (ref && token && apiBase) {
            let attempts = 0;
            const maxAttempts = 90; // ~7.5 min at 5s
            pollTimer = setInterval(async () => {
                if (settled) return;
                attempts++;
                try {
                    const res = await fetch(`${apiBase}/api/payments/pesapal/verify/${encodeURIComponent(ref)}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.status === 'success') finish('success', data);
                    else if (data.status === 'failed') finish('failed', data);
                } catch (e) { /* transient — keep trying */ }

                if (!settled && attempts >= maxAttempts) finish('timeout', null);
            }, 5000);
        }

        // If the user just closes the popup themselves without paying,
        // stop waiting instead of polling forever.
        closeWatchTimer = setInterval(() => {
            if (settled) return;
            if (popup.closed) finish('cancelled', null);
        }, 1000);
    }

    window.PesapalCheckout = { openBlankPopup, runCheckout };
})();
