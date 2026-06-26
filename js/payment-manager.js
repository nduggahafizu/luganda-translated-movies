/**
 * Unruly Movies - Payment Manager
 * PesaPal integration — supports Mobile Money (MTN, Airtel) + Card payments
 */

class PaymentManager {
    constructor() {
        this.apiUrl = API_CONFIG.BASE_URL;
        this.plans = {
            starter: {
                name: 'Starter',
                price: 1000,
                duration: '1 day',
                features: ['SD Streaming', '1 Device', 'Ads Supported'],
                color: '#888888',
                icon: '🎬'
            },
            basic: {
                name: 'Basic',
                price: 5000,
                duration: '1 week',
                features: ['HD Streaming', '1 Device', 'Limited Ads'],
                color: '#00D9FF',
                icon: '⭐'
            },
            standard: {
                name: 'Standard',
                price: 15000,
                duration: '1 month',
                features: ['Full HD Streaming', '2 Devices', 'No Ads', 'Downloads'],
                color: '#00FF88',
                icon: '🌟'
            },
            premium: {
                name: 'Premium',
                price: 30000,
                duration: '1 month',
                features: ['4K Streaming', '4 Devices', 'No Ads', 'Downloads', 'Offline Mode'],
                color: '#FFD700',
                icon: '👑'
            },
            vip: {
                name: 'VIP',
                price: 50000,
                duration: '3 months',
                features: ['4K Streaming', 'Unlimited Devices', 'No Ads', 'Downloads', 'Offline Mode', 'Early Access', 'VIP Support'],
                color: '#FF00FF',
                icon: '💎'
            }
        };
        this.selectedPlan = null;
    }

    showPaymentModal(plan = 'basic') {
        this.selectedPlan = plan;

        const modal = document.createElement('div');
        modal.id = 'paymentModal';
        modal.className = 'modal-modern active';
        modal.innerHTML = this.getModalHTML();

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        this.initModalEvents();

        requestAnimationFrame(() => {
            modal.querySelector('.modal-modern-content').style.transform = 'scale(1) translateY(0)';
        });
    }

    getModalHTML() {
        const currentPlan = this.plans[this.selectedPlan];

        return `
            <div class="modal-modern-content payment-modal" style="max-width: 500px;">
                <div class="payment-modal-header">
                    <button class="close-modal" onclick="paymentManager.closeModal()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 16px;">
                        <div style="background: linear-gradient(135deg, #4ade80, #22c55e); padding: 8px 16px; border-radius: 8px;">
                            <span style="font-weight: bold; color: #000; font-size: 16px;">PesaPal</span>
                        </div>
                        <span style="color: rgba(255,255,255,0.6);">Secure Checkout</span>
                    </div>
                    <h2 class="gradient-text" style="font-size: 24px; margin: 0 0 8px;">Choose Your Plan</h2>
                    <p style="color: rgba(255,255,255,0.6); font-size: 14px;">Pay with Mobile Money (MTN, Airtel) or Visa/Mastercard</p>
                </div>

                <div class="plan-selector">
                    ${Object.entries(this.plans).map(([key, plan]) => `
                        <button class="plan-card ${this.selectedPlan === key ? 'active' : ''}" data-plan="${key}"
                            style="--plan-color: ${plan.color};">
                            <div class="plan-icon">${plan.icon}</div>
                            <div class="plan-name">${plan.name}</div>
                            <div class="plan-price">UGX ${this.formatPrice(plan.price)}</div>
                            <div class="plan-duration">${plan.duration}</div>
                            ${key === 'premium' ? '<span class="plan-badge">Popular</span>' : ''}
                            ${key === 'vip' ? '<span class="plan-badge vip">Best Value</span>' : ''}
                        </button>
                    `).join('')}
                </div>

                <!-- Fixed bottom section: price + pay button always visible -->
                <div style="position:sticky;bottom:0;background:#1a1a2e;padding:16px 24px 20px;border-top:1px solid rgba(255,255,255,0.1);z-index:2;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <span class="total-plan-name" style="color:rgba(255,255,255,0.7);font-size:14px;">${currentPlan.name} — ${currentPlan.duration}</span>
                        <span class="total-amount" style="color:${currentPlan.color};font-size:20px;font-weight:800;">UGX ${this.formatPrice(currentPlan.price)}</span>
                    </div>
                    <button id="payButton" class="btn-modern btn-modern-primary" onclick="paymentManager.initiatePayment()"
                        style="background:linear-gradient(135deg,#4ade80,#22c55e);width:100%;padding:14px;font-size:16px;font-weight:700;border:none;border-radius:10px;color:#000;cursor:pointer;display:flex;align-items:center;justify-content:center;">
                        <span class="btn-text">Pay Now</span>
                        <span class="btn-loader" style="display:none;">
                            <div class="spinner-modern" style="width:20px;height:20px;border-width:2px;"></div>
                        </span>
                    </button>
                    <div style="text-align:center;margin-top:10px;font-size:11px;color:rgba(255,255,255,0.4);">
                        🔒 Secured by PesaPal — MTN · Airtel · Visa · Mastercard
                    </div>
                </div>

                <div id="paymentStatus" class="payment-status" style="display:none;"></div>
            </div>
        `;
    }

    initModalEvents() {
        document.querySelectorAll('#paymentModal .plan-card').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#paymentModal .plan-card').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedPlan = btn.dataset.plan;
                this.updateModalContent();
            });
        });

        document.getElementById('paymentModal').addEventListener('click', (e) => {
            if (e.target.id === 'paymentModal') this.closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    updateModalContent() {
        const plan = this.plans[this.selectedPlan];
        if (!plan) return;
        const nameEl = document.querySelector('.total-plan-name');
        if (nameEl) nameEl.textContent = `${plan.name} — ${plan.duration}`;
        const amountEl = document.querySelector('.total-amount');
        if (amountEl) { amountEl.textContent = `UGX ${this.formatPrice(plan.price)}`; amountEl.style.color = plan.color; }
    }

    async initiatePayment() {
        const token = getAuthToken();
        if (!token) {
            this.showToast('Please login to continue', 'error');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        const payBtn = document.getElementById('payButton');
        payBtn.querySelector('.btn-text').style.display = 'none';
        payBtn.querySelector('.btn-loader').style.display = 'flex';
        payBtn.disabled = true;

        try {
            const plan = this.plans[this.selectedPlan];
            const response = await fetch(`${this.apiUrl}/api/payments/pesapal/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subscriptionPlan: this.selectedPlan,
                    amount: plan.price,
                    currency: 'UGX',
                    description: `Unruly Movies ${plan.name} subscription (${plan.duration})`
                })
            });

            const data = await response.json();

            if (data.status === 'success' && data.data?.redirectUrl) {
                this.showToast('Redirecting to payment...', 'success');
                window.location.href = data.data.redirectUrl;
            } else {
                throw new Error(data.message || 'Payment initiation failed');
            }

        } catch (error) {
            console.error('Payment error:', error);
            this.showToast(error.message || 'Payment failed. Please try again.', 'error');
            payBtn.querySelector('.btn-text').style.display = 'inline';
            payBtn.querySelector('.btn-loader').style.display = 'none';
            payBtn.disabled = false;
        }
    }

    closeModal() {
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => modal.remove(), 300);
        }
    }

    formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    showToast(message, type = 'info') {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.style.cssText = `
            position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
            padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;
            z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            background: ${type === 'success' ? '#4ade80' : type === 'error' ? '#ff4444' : '#333'};
            color: ${type === 'success' ? '#000' : '#fff'};
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    showConfetti() {
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed; width: 10px; height: 10px; border-radius: 50%;
                background: hsl(${Math.random() * 360}, 100%, 60%);
                left: ${Math.random() * 100}vw; top: -10px; z-index: 10001;
                animation: confettiFall ${1.5 + Math.random() * 2}s ease-out forwards;
            `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }
    }
}

const paymentManager = new PaymentManager();
