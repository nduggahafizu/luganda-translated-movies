/**
 * Unruly Movies - Payment Manager
 * One-click PesaPal checkout — no modal, no double selection
 */

class PaymentManager {
    constructor() {
        this.apiUrl = API_CONFIG.BASE_URL;
        this.plans = {
            starter:  { name: 'Starter',  price: 1000,  duration: '1 day' },
            basic:    { name: 'Basic',    price: 5000,  duration: '1 week' },
            standard: { name: 'Standard', price: 12000, duration: '1 month' },
            premium:  { name: 'Premium',  price: 30000, duration: '1 month' },
            vip:      { name: 'VIP',      price: 50000, duration: '3 months' }
        };
    }

    async subscribe(planKey) {
        const plan = this.plans[planKey];
        if (!plan) return this.showToast('Invalid plan', 'error');

        const token = getAuthToken();
        if (!token) {
            window.location.href = 'login.html?redirect=subscription.html';
            return;
        }

        // Show loading on the clicked button
        const btn = document.querySelector(`[data-plan="${planKey}"] .btn-subscribe`);
        const originalText = btn?.textContent;
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<div style="width:18px;height:18px;border:2px solid rgba(0,0,0,0.3);border-top-color:#000;border-radius:50%;animation:spin 0.6s linear infinite;margin:0 auto;"></div>';
        }

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
                this.showToast('Redirecting to payment...', 'success');
                window.location.href = data.data.redirectUrl;
            } else {
                throw new Error(data.message || 'Payment failed');
            }
        } catch (error) {
            this.showToast(error.message || 'Something went wrong', 'error');
            if (btn) {
                btn.disabled = false;
                btn.textContent = originalText || 'Subscribe';
            }
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
            position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
            padding:14px 24px;border-radius:8px;font-weight:600;font-size:14px;
            z-index:10000;box-shadow:0 4px 20px rgba(0,0,0,0.4);
            background:${type === 'success' ? '#4ade80' : type === 'error' ? '#ff4444' : '#333'};
            color:${type === 'success' ? '#000' : '#fff'};
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

const paymentManager = new PaymentManager();
