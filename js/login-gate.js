/**
 * Smart Login/Subscription Gate for player.html
 *
 * Goals:
 * - Do NOT block free content
 * - For paid content, show a friendly overlay (Login / Register / Subscribe)
 * - For logged-in users without sufficient plan, show Upgrade prompt
 * - UX only: backend playback-token enforcement remains the real security
 */

(function () {
    const PLAN_HIERARCHY = { free: 0, basic: 1, premium: 2 };

    function getStoredToken() {
        return (
            localStorage.getItem('token') ||
            localStorage.getItem('authToken') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('authToken')
        );
    }

    function getStoredUser() {
        const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    }

    function hasAccessToPlan(user, requiredPlan) {
        if (!requiredPlan || requiredPlan === 'free') return true;
        if (!user?.subscription) return false;

        const userPlan = user.subscription.plan || 'free';
        const userStatus = user.subscription.status || 'active';
        const endDate = user.subscription.endDate ? new Date(user.subscription.endDate).getTime() : null;

        const isActive = userPlan === 'free'
            ? true
            : (userStatus === 'active' && (!endDate || endDate > Date.now()));

        const userLevel = PLAN_HIERARCHY[userPlan];
        const requiredLevel = PLAN_HIERARCHY[requiredPlan];

        if (typeof userLevel !== 'number' || typeof requiredLevel !== 'number') {
            // Unknown plan names => rely on backend enforcement and treat as not accessible for UX.
            return false;
        }

        return isActive && userLevel >= requiredLevel;
    }

    class SmartLoginGate {
        constructor() {
            this.requiredPlan = 'free';
            this.lastDeniedMessage = '';
            this.movieId = null;

            this.wrapper = document.getElementById('playerWrapper') || document.querySelector('.player-wrapper');
            this.video = document.getElementById('player') || document.querySelector('video');

            this.addStyles();
            this.ensureOverlay();
            this.bind();

            if (typeof window.currentMovieRequiredPlan === 'string') {
                this.setRequiredPlan(window.currentMovieRequiredPlan);
            }
        }

        isLoggedIn() {
            return !!getStoredToken();
        }

        saveRedirect() {
            localStorage.setItem('redirectAfterLogin', window.location.href);
        }

        goToLogin() {
            this.saveRedirect();
            window.location.href = '/login.html';
        }

        goToRegister() {
            this.saveRedirect();
            window.location.href = '/register.html';
        }

        goToSubscribe() {
            this.saveRedirect();
            window.location.href = '/subscription.html';
        }

        setRequiredPlan(plan, movieId) {
            if (!plan) return;
            this.requiredPlan = String(plan);
            this.movieId = movieId ? String(movieId) : this.movieId;
            this.refresh();
        }

        onPlaybackDenied(detail) {
            const requiredPlan = detail?.requiredPlan || this.requiredPlan || 'free';
            const message = detail?.message || 'Please login/upgrade to watch this content.';
            this.lastDeniedMessage = message;
            this.setRequiredPlan(requiredPlan);
            this.showOverlay({ message });
        }

        refresh() {
            if (window.isNonMoviePlayback || window.isEmbedMode) {
                this.hideOverlay();
                return;
            }

            if (this.requiredPlan === 'free') {
                this.hideOverlay();
                return;
            }

            const loggedIn = this.isLoggedIn();
            const user = getStoredUser();
            const ok = loggedIn && hasAccessToPlan(user, this.requiredPlan);
            if (ok) {
                this.hideOverlay();
                return;
            }

            const message = this.lastDeniedMessage || (loggedIn
                ? `This content requires a ${this.requiredPlan} plan or higher.`
                : 'Please login to watch this content.');

            this.showOverlay({ message });
        }

        ensureOverlay() {
            if (document.getElementById('smartLoginGate')) {
                this.overlay = document.getElementById('smartLoginGate');
                return;
            }

            this.overlay = document.createElement('div');
            this.overlay.id = 'smartLoginGate';
            this.overlay.className = 'smart-gate hidden';
            this.overlay.innerHTML = `
                <div class="smart-gate-card" role="dialog" aria-modal="true" aria-label="Playback access required">
                    <button type="button" class="smart-gate-close" aria-label="Close">×</button>

                    <div class="smart-gate-icon" aria-hidden="true">
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>

                    <div class="smart-gate-title">Access required</div>
                    <div class="smart-gate-badges">
                        <span class="smart-gate-badge" id="smartGatePlanBadge">PLAN</span>
                    </div>
                    <div class="smart-gate-message" id="smartGateMessage"></div>

                    <div class="smart-gate-actions">
                        <button type="button" class="smart-gate-btn primary" id="smartGateLoginBtn">Login</button>
                        <button type="button" class="smart-gate-btn" id="smartGateRegisterBtn">Register</button>
                        <button type="button" class="smart-gate-btn outline" id="smartGateSubscribeBtn">Subscribe</button>
                    </div>

                    <div class="smart-gate-hint">Tip: Login helps you save watch progress & resume.</div>
                </div>
            `;

            const container = this.wrapper || document.body;
            if (container) {
                if (container !== document.body) container.style.position = 'relative';
                container.appendChild(this.overlay);
            } else {
                document.body.appendChild(this.overlay);
            }
        }

        showOverlay({ message }) {
            this.ensureOverlay();

            const planBadge = document.getElementById('smartGatePlanBadge');
            const msg = document.getElementById('smartGateMessage');
            if (planBadge) planBadge.textContent = (this.requiredPlan || 'paid').toUpperCase();
            if (msg) msg.textContent = message || 'Please login/upgrade to continue.';

            this.overlay.classList.remove('hidden');

            if (this.video && !this.video.paused) {
                try { this.video.pause(); } catch (e) {}
            }

            if (typeof gtag === 'function') {
                gtag('event', 'smart_gate_shown', { requiredPlan: this.requiredPlan });
            }
        }

        hideOverlay() {
            if (!this.overlay) return;
            this.overlay.classList.add('hidden');
        }

        bind() {
            window.addEventListener('unruly:requiredPlan', (e) => {
                const plan = e?.detail?.requiredPlan;
                const movieId = e?.detail?.movieId;
                this.setRequiredPlan(plan, movieId);
            });

            window.addEventListener('unruly:playbackDenied', (e) => {
                this.onPlaybackDenied(e?.detail);
            });

            document.addEventListener('click', (e) => {
                const t = e.target;
                if (!t) return;

                if (t.id === 'smartGateLoginBtn') return this.goToLogin();
                if (t.id === 'smartGateRegisterBtn') return this.goToRegister();
                if (t.id === 'smartGateSubscribeBtn') return this.goToSubscribe();

                if (t.classList && t.classList.contains('smart-gate-close')) {
                    this.hideOverlay();
                    return;
                }
            });

            if (this.video) {
                this.video.addEventListener('play', () => {
                    if (this.requiredPlan === 'free') return;
                    if (window.isNonMoviePlayback || window.isEmbedMode) return;

                    const loggedIn = this.isLoggedIn();
                    const user = getStoredUser();
                    const ok = loggedIn && hasAccessToPlan(user, this.requiredPlan);
                    if (ok) return;

                    try { this.video.pause(); } catch (e) {}
                    this.showOverlay({
                        message: loggedIn
                            ? `This content requires a ${this.requiredPlan} plan or higher.`
                            : 'Please login to watch this content.'
                    });
                });
            }
        }

        addStyles() {
            if (document.getElementById('smart-gate-styles')) return;
            const style = document.createElement('style');
            style.id = 'smart-gate-styles';
            style.textContent = `
                .smart-gate {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.78);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 999;
                    padding: 20px;
                    backdrop-filter: blur(6px);
                }
                .smart-gate.hidden { display: none; }
                .smart-gate-card {
                    width: min(560px, 95vw);
                    background: linear-gradient(135deg, rgba(26,26,46,0.98) 0%, rgba(22,33,62,0.98) 100%);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 16px;
                    padding: 26px 22px 22px;
                    box-shadow: 0 22px 70px rgba(0,0,0,0.65);
                    text-align: center;
                    position: relative;
                    color: #fff;
                }
                .smart-gate-close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 34px;
                    height: 34px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.14);
                    background: rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.85);
                    cursor: pointer;
                    font-size: 20px;
                    line-height: 1;
                }
                .smart-gate-icon {
                    width: 72px;
                    height: 72px;
                    margin: 0 auto 12px;
                    border-radius: 50%;
                    background: rgba(255,193,7,0.14);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ffc107;
                }
                .smart-gate-title {
                    font-size: 22px;
                    font-weight: 800;
                    margin: 6px 0 8px;
                }
                .smart-gate-badges {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 10px;
                }
                .smart-gate-badge {
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 0.06em;
                    padding: 6px 10px;
                    border-radius: 999px;
                    background: rgba(124, 252, 0, 0.18);
                    border: 1px solid rgba(124, 252, 0, 0.32);
                    color: #d9ffb8;
                }
                .smart-gate-message {
                    color: rgba(255,255,255,0.72);
                    font-size: 14px;
                    line-height: 1.5;
                    margin: 0 auto 18px;
                    max-width: 460px;
                }
                .smart-gate-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    justify-content: center;
                    margin-bottom: 12px;
                }
                .smart-gate-btn {
                    border: 1px solid rgba(255,255,255,0.18);
                    background: rgba(255,255,255,0.08);
                    color: #fff;
                    padding: 12px 16px;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    min-width: 120px;
                }
                .smart-gate-btn.primary {
                    background: var(--primary-color, #7CFC00);
                    color: #000;
                    border: none;
                }
                .smart-gate-btn.outline {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.28);
                }
                .smart-gate-hint {
                    font-size: 12px;
                    color: rgba(255,255,255,0.55);
                }
            `;
            document.head.appendChild(style);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Only initialize where it matters
        const path = (window.location.pathname || '').toLowerCase();
        if (!path.includes('player')) return;
        window.__unrulyLoginGate = new SmartLoginGate();
    });
})();
