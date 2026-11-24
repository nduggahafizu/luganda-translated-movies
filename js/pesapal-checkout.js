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

    // opts: { ref, token, apiBase, onSuccess, onFailure(status), onDone,
    //         onWaiting } — onWaiting runs when the PesaPal window is closed
    //         before the payment is confirmed; checking carries on.
    function runCheckout(popup, redirectUrl, opts) {
        opts = opts || {};
        const { ref, token, apiBase, onSuccess, onFailure, onDone, onWaiting } = opts;
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

        // Keep asking our server (which asks PesaPal) until the payment
        // settles. Mobile money is often approved on the phone after the
        // PesaPal window has been closed, so closing it doesn't stop the
        // checking; and a failed attempt can be retried inside the PesaPal
        // window, so "failed" only counts once the window is closed.
        // The server's own background check carries on after this stops.
        const POLL_MS = 5000;
        const MAX_MS_OPEN = 15 * 60 * 1000;    // window still open
        const MAX_MS_CLOSED = 10 * 60 * 1000;  // after the window was closed
        const startedAt = Date.now();
        let closedAt = null;
        let lastStatus = 'pending';

        if (ref && token && apiBase) {
            pollTimer = setInterval(async () => {
                if (settled) return;
                try {
                    const res = await fetch(`${apiBase}/api/payments/pesapal/verify/${encodeURIComponent(ref)}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    lastStatus = data.status || 'pending';
                    if (data.status === 'success') { finish('success', data); return; }
                    if (data.status === 'failed' && closedAt) { finish('failed', data); return; }
                } catch (e) { /* transient — keep trying */ }

                const now = Date.now();
                if (closedAt && now - closedAt > MAX_MS_CLOSED) {
                    // closed and still nothing: stop quietly (the page already
                    // said the plan switches on by itself once PesaPal confirms)
                    finish('cancelled', null);
                } else if (!closedAt && now - startedAt > MAX_MS_OPEN) {
                    finish(lastStatus === 'failed' ? 'failed' : 'timeout', null);
                }
            }, POLL_MS);
        }

        // Window closed before the payment was confirmed: keep checking
        // (if we can), and let the page say so.
        closeWatchTimer = setInterval(() => {
            if (settled || closedAt || !popup.closed) return;
            closedAt = Date.now();
            clearInterval(closeWatchTimer);
            closeWatchTimer = null;
            if (!pollTimer) { finish('cancelled', null); return; }
            if (lastStatus === 'failed') { finish('failed', null); return; }
            if (onWaiting) onWaiting();
        }, 1000);
    }

    window.PesapalCheckout = { openBlankPopup, runCheckout };
})();
