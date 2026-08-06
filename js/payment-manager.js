/**
 * Unruly Movies - Payment Manager
 * Shows a branded confirmation modal, then redirects to PesaPal in the same tab.
 * PesaPal blocks iframing — confirmation-then-redirect is the standard pattern.
 */

class PaymentManager {
    constructor() {
        this.apiUrl = API_CONFIG.BASE_URL;
        this.plans = {
            starter:  { name: 'Starter',  price: 500,  duration: '1 day',   features: ['Stream all movies', '1 device'] },
            basic:    { name: 'Weekly',   price: 5000,  duration: '7 days',  features: ['Stream all movies', 'Download access', '3 devices'] },
            standard: { name: 'Monthly',  price: 12000, duration: '30 days', features: ['Stream all movies', 'Download access', 'No ads', '3 devices'] },
            premium:  { name: 'Premium',  price: 30000, duration: '30 days', features: ['Stream all movies', 'Download access', 'No ads', '3 devices', 'Priority support'] },
            vip:      { name: 'VIP',      price: 50000, duration: '90 days', features: ['Everything in Premium', '3 months access', 'Early releases'] }
        };
        this._injectStyles();
    }

    _injectStyles() {
        if (document.getElementById('pm-styles')) return;
        const s = document.createElement('style');
        s.id = 'pm-styles';
        s.textContent = `
            .pm-overlay {
                position: fixed; inset: 0; z-index: 99999;
                background: rgba(0,0,0,0.75);
                backdrop-filter: blur(8px);
                display: flex; align-items: center; justify-content: center;
                padding: 16px;
                animation: pmFadeIn 0.2s ease;
            }
            .pm-modal {
                position: relative;
                width: 100%; max-width: 400px;
                background: #0f0f1a;
                border-radius: 24px;
                border: 1px solid rgba(74,222,128,0.2);
                box-shadow: 0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
                overflow: hidden;
                animation: pmSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
            }
            .pm-top {
                background: linear-gradient(135deg, rgba(74,222,128,0.12), rgba(74,222,128,0.04));
                padding: 28px 28px 20px;
                text-align: center;
                border-bottom: 1px solid rgba(255,255,255,0.06);
            }
            .pm-badge {
                display: inline-flex; align-items: center; gap: 6px;
                background: rgba(74,222,128,0.15);
                border: 1px solid rgba(74,222,128,0.3);
                color: #4ade80; font-size: 11px; font-weight: 700;
                padding: 4px 12px; border-radius: 20px; margin-bottom: 14px;
                text-transform: uppercase; letter-spacing: 0.8px;
            }
            .pm-plan-name {
                font-size: 26px; font-weight: 900; color: #fff;
                margin: 0 0 4px; letter-spacing: -0.5px;
            }
            .pm-price {
                font-size: 38px; font-weight: 900; color: #4ade80;
                margin: 10px 0 2px; line-height: 1;
            }
            .pm-price span { font-size: 18px; font-weight: 600; color: #6b8f74; }
            .pm-duration { font-size: 13px; color: #666; margin: 0; }
            .pm-body { padding: 20px 28px 24px; }
            .pm-features {
                list-style: none; margin: 0 0 20px; padding: 0;
                display: flex; flex-direction: column; gap: 10px;
            }
            .pm-features li {
                display: flex; align-items: center; gap: 10px;
                font-size: 14px; color: #ccc;
            }
            .pm-features li::before {
                content: ''; display: block;
                width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
                background: rgba(74,222,128,0.15);
                background-image: url("data:image/svg+xml,%3Csvg width='10' height='8' viewBox='0 0 10 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 4l2.5 2.5L9 1' stroke='%234ade80' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: center;
            }
            .pm-pay-btn {
                width: 100%; padding: 15px;
                background: #4ade80; color: #000;
                border: none; border-radius: 14px;
                font-size: 16px; font-weight: 800;
                cursor: pointer; letter-spacing: -0.2px;
                transition: transform 0.15s, box-shadow 0.15s;
                display: flex; align-items: center; justify-content: center; gap: 8px;
            }
            .pm-pay-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 28px rgba(74,222,128,0.35);
            }
            .pm-pay-btn:active { transform: translateY(0); }
            .pm-pay-btn.loading { opacity: 0.7; pointer-events: none; }
            .pm-secure {
                display: flex; align-items: center; justify-content: center;
                gap: 6px; margin-top: 12px;
                font-size: 11px; color: #555;
            }
            .pm-close {
                position: absolute; top: 14px; right: 14px;
                width: 30px; height: 30px; border-radius: 50%;
                background: rgba(255,255,255,0.07);
                border: none; cursor: pointer;
                color: #888; font-size: 16px;
                display: flex; align-items: center; justify-content: center;
                transition: background 0.2s;
            }
            .pm-close:hover { background: rgba(255,255,255,0.14); color: #fff; }
            @keyframes pmFadeIn { from { opacity:0 } to { opacity:1 } }
            @keyframes pmSlideUp {
                from { opacity:0; transform: translateY(24px) scale(0.97) }
                to   { opacity:1; transform: translateY(0) scale(1) }
            }
            @keyframes spin { to { transform: rotate(360deg) } }
        `;
        document.head.appendChild(s);
    }

    async subscribe(planKey) {
        const plan = this.plans[planKey];
        if (!plan) return this.showToast('Invalid plan', 'error');

        const token = getAuthToken();
        if (!token) {
            window.location.href = 'login.html?redirect=subscription.html';
            return;
        }

        // Show confirmation modal immediately — fetch PesaPal URL in background
        this.openConfirmModal(planKey, plan, token);
    }

    openConfirmModal(planKey, plan, token) {
        this.closeModal();

        const overlay = document.createElement('div');
        overlay.className = 'pm-overlay';
        overlay.id = 'pm-overlay';

        overlay.innerHTML = `
            <div class="pm-modal">
                <button class="pm-close" id="pm-close-btn">✕</button>
                <div class="pm-top">
                    <div class="pm-badge">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        Unruly Movies
                    </div>
                    <p class="pm-plan-name">${plan.name} Plan</p>
                    <div class="pm-price">UGX ${this.fmt(plan.price)}<span> / ${plan.duration}</span></div>
                    <p class="pm-duration">Access expires after ${plan.duration}</p>
                </div>
                <div class="pm-body">
                    <ul class="pm-features">
                        ${plan.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <button class="pm-pay-btn" id="pm-pay-btn">
                        <span id="pm-btn-text">Pay with PesaPal</span>
                    </button>
                    <div class="pm-secure">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        Secured by PesaPal · 256-bit encryption
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        document.getElementById('pm-close-btn').addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', e => { if (e.target === overlay) this.closeModal(); });

        const payBtn = document.getElementById('pm-pay-btn');
        payBtn.addEventListener('click', async () => {
            payBtn.classList.add('loading');
            document.getElementById('pm-btn-text').textContent = 'Preparing payment…';

            try {
                const response = await fetch(`${this.apiUrl}/api/payments/pesapal/initiate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        subscriptionPlan: planKey,
                        amount: plan.price,
                        currency: 'UGX',
                        description: `Unruly Movies ${plan.name} — ${plan.duration}`
                    })
                });

                const data = await response.json();

                if (data.status === 'success' && data.data?.redirectUrl) {
                    document.getElementById('pm-btn-text').textContent = 'Redirecting…';
                    this.closeModal();
                    // Same-tab redirect — PesaPal returns user to payment-success.html
                    window.location.href = data.data.redirectUrl;
                } else {
                    throw new Error(data.message || 'Payment initiation failed');
                }
            } catch (err) {
                this.closeModal();
                this.showToast(err.message || 'Something went wrong. Please try again.', 'error');
            }
        });
    }

    closeModal() {
        const overlay = document.getElementById('pm-overlay');
        if (overlay) overlay.remove();
        document.body.style.overflow = '';
    }

    fmt(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

    showToast(message, type = 'info') {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.style.cssText = `
            position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
            padding:14px 24px;border-radius:8px;font-weight:600;font-size:14px;
            z-index:100000;box-shadow:0 4px 20px rgba(0,0,0,0.4);
            background:${type === 'success' ? '#4ade80' : type === 'error' ? '#ff4444' : '#333'};
            color:${type === 'success' ? '#000' : '#fff'};
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

const paymentManager = new PaymentManager();
