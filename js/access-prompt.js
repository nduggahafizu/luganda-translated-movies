/* ===================================
   Unruly Movies — what someone without a subscription sees after pressing
   Play or Download on the movie and series players:

     AccessPrompt.signIn('watch' | 'download', { onTrailer, onClose })
         signed out: a "Sign in to watch / download" box
     AccessPrompt.plans('watch' | 'download' | 'upgrade', { movieId, seriesId, beforeLeave })
         signed in without the right plan: the plans page (subscription.html),
         which brings them back to the movie after paying. 'upgrade' is for a
         Daily subscriber pressing Download (downloads start at Weekly).
     AccessPrompt.toast(message, 'info' | 'error')
         a clear notice at the bottom of the screen
     AccessPrompt.otherDevice('login' | 'watch' | 'download', { apiBase, token, otherDevice, onYes, onNo })
         the Daily plan (1 device) is signed in on another device:
         "Log out your other device?" Yes signs that device out
         (POST /api/auth/device-switch) and stores the new token; No cancels
         (on sign-in, the caller cancels the new sign-in)
     AccessPrompt.guardPlayback({ apiBase, getToken, getMedia })
         while a video plays on a plan with a device limit, checks every
         2 minutes that this device still holds the plan, and stops if the
         account was moved to another device

   Styles: .ap-* in css/access-prompt.css.
   =================================== */
(function () {
    'use strict';

    var ICONS = {
        play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.6v12.8c0 .8.9 1.3 1.6.8l10-6.4c.6-.4.6-1.3 0-1.7l-10-6.4C8.9 4.3 8 4.8 8 5.6z"/></svg>',
        download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
        lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
        close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        devices: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="14" height="10" rx="1.5"/><path d="M6 18h6"/><path d="M9 14v4"/><rect x="17" y="8" width="5" height="12" rx="1.2"/><path d="M19.5 17.5h0"/></svg>'
    };

    var COPY = {
        signIn: {
            watch: {
                icon: 'lock',
                title: 'Sign in to watch',
                text: 'Watch the full Luganda translation with a plan from UGX 1,000 a day.'
            },
            download: {
                icon: 'download',
                title: 'Sign in to download',
                text: 'Downloads come with every plan, from UGX 1,000 a day.'
            }
        }
    };

    var open = null; // the box on screen: { overlay, onClose, lastFocus }

    // Come back to this page after signing in or creating an account
    function goTo(page) {
        try { localStorage.setItem('redirectAfterLogin', window.location.href); } catch (e) { /* private mode */ }
        window.location.href = page + '?redirect=' + encodeURIComponent(window.location.href);
    }

    function close() {
        if (!open) return;
        var current = open;
        open = null;
        document.removeEventListener('keydown', onKey);
        current.overlay.remove();
        document.documentElement.classList.remove('ap-open');
        if (current.lastFocus && current.lastFocus.focus) {
            try { current.lastFocus.focus({ preventScroll: true }); } catch (e) { /* element gone */ }
        }
        if (typeof current.onClose === 'function') current.onClose();
    }

    function onKey(e) {
        if (e.key === 'Escape') close();
    }

    // A centred box with an icon, title, text and whatever goes below
    function showBox(copy, bodyHtml, onClose) {
        if (open) { open.onClose = null; close(); }
        var overlay = document.createElement('div');
        overlay.className = 'ap-overlay';
        overlay.innerHTML =
            '<div class="ap-box" role="dialog" aria-modal="true" aria-labelledby="apTitle" aria-describedby="apText">' +
                '<button type="button" class="ap-close" aria-label="Close">' + ICONS.close + '</button>' +
                '<div class="ap-icon">' + ICONS[copy.icon] + '</div>' +
                '<h2 class="ap-title" id="apTitle">' + copy.title + '</h2>' +
                '<p class="ap-text" id="apText">' + copy.text + '</p>' +
                bodyHtml +
            '</div>';
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });
        overlay.querySelector('.ap-close').addEventListener('click', close);
        open = { overlay: overlay, onClose: onClose, lastFocus: document.activeElement };
        document.body.appendChild(overlay);
        document.documentElement.classList.add('ap-open');
        document.addEventListener('keydown', onKey);
        var first = overlay.querySelector('.ap-primary, .ap-plan:not([disabled])');
        if (first) first.focus({ preventScroll: true });
        return overlay;
    }

    function signIn(reason, opts) {
        opts = opts || {};
        var copy = COPY.signIn[reason] || COPY.signIn.watch;
        var overlay = showBox(copy,
            '<div class="ap-actions">' +
                '<button type="button" class="ap-btn ap-primary" data-act="login">Sign in</button>' +
                '<button type="button" class="ap-btn ap-secondary" data-act="register">Create an account</button>' +
            '</div>' +
            (typeof opts.onTrailer === 'function'
                ? '<button type="button" class="ap-link" data-act="trailer">Watch the trailer instead</button>'
                : '') +
            '<button type="button" class="ap-later" data-act="later">Not now</button>',
            opts.onClose);
        overlay.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-act]');
            if (!btn) return;
            var act = btn.getAttribute('data-act');
            if (act === 'login') goTo('login.html');
            else if (act === 'register') goTo('register.html');
            else if (act === 'trailer') { close(); opts.onTrailer(); }
            else close();
        });
    }

    // A viewer without the right plan goes to the plans page, which shows
    // the movie or series they came from and brings them back after paying.
    //   reason: 'watch' | 'download' | 'upgrade' (a Daily subscriber downloading)
    //   opts:   { movieId, seriesId, beforeLeave }
    function plans(reason, opts) {
        opts = opts || {};
        var query = new URLSearchParams();
        query.set('reason', reason || 'watch');
        if (opts.movieId) query.set('movie', opts.movieId);
        if (opts.seriesId) query.set('series', opts.seriesId);
        query.set('return', window.location.pathname + window.location.search);
        if (typeof opts.beforeLeave === 'function') opts.beforeLeave();
        window.location.href = 'subscription.html?' + query.toString();
    }

    // A clear notice at the bottom of the screen
    var toastTimer = null;
    function toast(message, kind) {
        var el = document.querySelector('.ap-toast');
        if (!el) {
            el = document.createElement('div');
            el.className = 'ap-toast';
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');
            document.body.appendChild(el);
        }
        el.textContent = message;
        el.classList.toggle('is-error', kind === 'error');
        el.classList.add('is-shown');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.classList.remove('is-shown'); }, 4500);
    }

    /* ---------- One device at a time (Daily plan) ---------- */

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    // "used just now" / "used 5 minutes ago" / "used 3 hours ago"
    function usedAgo(minutes) {
        var m = Number(minutes);
        if (!isFinite(m) || m < 2) return 'used just now';
        if (m < 60) return 'used ' + Math.round(m) + ' minutes ago';
        var h = Math.round(m / 60);
        return 'used ' + h + (h === 1 ? ' hour ago' : ' hours ago');
    }

    var TOKEN_KEYS = ['token', 'authToken'];

    // Put the new token wherever the site keeps the sign-in
    function storeToken(token) {
        var stored = false;
        [window.localStorage, window.sessionStorage].forEach(function (store) {
            try {
                TOKEN_KEYS.forEach(function (key) {
                    if (store.getItem(key)) { store.setItem(key, token); stored = true; }
                });
            } catch (e) { /* storage blocked */ }
        });
        if (!stored) {
            try { localStorage.setItem('token', token); } catch (e) { /* storage blocked */ }
        }
    }

    function clearStoredSignIn() {
        [window.localStorage, window.sessionStorage].forEach(function (store) {
            try {
                TOKEN_KEYS.concat(['user']).forEach(function (key) { store.removeItem(key); });
            } catch (e) { /* storage blocked */ }
        });
    }

    function leaveFullscreen(media) {
        try {
            if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
            if (media && media.webkitDisplayingFullscreen && media.webkitExitFullscreen) media.webkitExitFullscreen();
        } catch (e) { /* not in full screen */ }
    }

    // "Log out your other device?"
    //   context: 'login' (just signed in) | 'watch' | 'download'
    //   opts: { apiBase, token, otherDevice: { label, minutesAgo }, onYes(newToken), onNo() }
    function otherDevice(context, opts) {
        opts = opts || {};
        var info = opts.otherDevice || {};
        var where = info.label
            ? '<strong>' + escapeHtml(info.label) + '</strong> (' + usedAgo(info.minutesAgo) + ')'
            : 'another device';
        var forLogin = context === 'login';
        var answered = false;

        var overlay = showBox({
            icon: 'devices',
            title: 'Log out your other device?',
            text: 'The Daily plan works on 1 device at a time, and your account is signed in on ' + where + '. ' +
                (forLogin ? 'Log that device out and sign in here?' : 'Log that device out and continue here?')
        },
            '<div class="ap-actions">' +
                '<button type="button" class="ap-btn ap-primary" data-act="yes">Yes, log it out</button>' +
                '<button type="button" class="ap-btn ap-secondary" data-act="no">' +
                    (forLogin ? 'No, cancel this sign-in' : 'No') +
                '</button>' +
            '</div>' +
            (forLogin ? '' : '<p class="ap-note">Weekly, 2 Weeks and Monthly plans have no device limit.</p>'),
            function () {
                // closed without saying Yes (No, Escape, the X or outside the box)
                if (!answered && typeof opts.onNo === 'function') opts.onNo();
            });

        var yesBtn = overlay.querySelector('[data-act="yes"]');
        overlay.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-act]');
            if (!btn) return;
            var act = btn.getAttribute('data-act');
            if (act === 'no') { close(); return; }
            if (act !== 'yes' || yesBtn.disabled) return;

            yesBtn.disabled = true;
            yesBtn.textContent = 'Logging it out…';
            fetch((opts.apiBase || '') + '/api/auth/device-switch', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + opts.token }
            })
                .then(function (res) {
                    return res.json().catch(function () { return {}; }).then(function (data) {
                        if (!res.ok || data.status !== 'success') throw new Error(data.message || 'switch failed');
                        return data;
                    });
                })
                .then(function (data) {
                    var newToken = data.data && data.data.token;
                    if (newToken) storeToken(newToken);
                    answered = true;
                    close();
                    toast('Your other device was logged out.');
                    if (typeof opts.onYes === 'function') opts.onYes(newToken || opts.token);
                })
                .catch(function () {
                    yesBtn.disabled = false;
                    yesBtn.textContent = 'Yes, log it out';
                    toast('Couldn’t log out the other device. Please try again.', 'error');
                });
        });
        return overlay;
    }

    // This device was signed out while a video played
    function signedOutHere(code) {
        clearStoredSignIn();
        var moved = code === 'SECURITY_UPDATE';
        var overlay = showBox({
            icon: 'lock',
            title: 'You’ve been logged out on this device',
            text: moved
                ? 'Your account was logged out here from another device. On the Daily plan, 1 device can watch at a time.'
                : 'Sign in again to keep watching.'
        },
            '<div class="ap-actions">' +
                '<button type="button" class="ap-btn ap-primary" data-act="login">Sign in again</button>' +
            '</div>' +
            '<button type="button" class="ap-later" data-act="later">Not now</button>');
        overlay.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-act]');
            if (!btn) return;
            if (btn.getAttribute('data-act') === 'login') goTo('login.html');
            else close();
        });
    }

    // While a video plays, check every 2 minutes that this device still holds
    // the plan. Plans without a device limit stop checking after the first
    // answer. opts: { apiBase, getToken(), getMedia() }
    var GUARD_EVERY_MS = 2 * 60 * 1000;
    var guard = null;

    function guardPlayback(opts) {
        if (guard) clearInterval(guard.timer);
        guard = { opts: opts || {}, busy: false, timer: setInterval(checkPlayback, GUARD_EVERY_MS) };
    }

    function stopGuard() {
        if (!guard) return;
        clearInterval(guard.timer);
        guard = null;
    }

    function checkPlayback() {
        var g = guard;
        if (!g || g.busy || open) return;
        var media = typeof g.opts.getMedia === 'function' ? g.opts.getMedia() : null;
        if (!media || media.paused || media.ended) return;
        var token = typeof g.opts.getToken === 'function' ? g.opts.getToken() : null;
        if (!token) return;

        g.busy = true;
        fetch((g.opts.apiBase || '') + '/api/auth/check-access', {
            headers: { 'Authorization': 'Bearer ' + token },
            cache: 'no-store'
        })
            .then(function (res) {
                return res.json().catch(function () { return {}; }).then(function (data) {
                    if (res.status === 401) {
                        stopGuard();
                        media.pause();
                        leaveFullscreen(media);
                        signedOutHere(data.code);
                        return;
                    }
                    var access = res.ok && data && data.access;
                    if (!access) return;
                    if (access.maxDevices == null) { stopGuard(); return; } // no device limit
                    if (access.deviceLimitReached) {
                        media.pause();
                        leaveFullscreen(media);
                        otherDevice('watch', {
                            apiBase: g.opts.apiBase,
                            token: token,
                            otherDevice: access.otherDevice,
                            onYes: function () {
                                var p = media.play();
                                if (p && p.catch) p.catch(function () { /* needs a tap */ });
                            }
                        });
                    }
                });
            })
            .catch(function () { /* offline: try again next time */ })
            .then(function () { g.busy = false; });
    }

    window.AccessPrompt = {
        signIn: signIn,
        plans: plans,
        toast: toast,
        close: close,
        otherDevice: otherDevice,
        guardPlayback: guardPlayback
    };
})();
