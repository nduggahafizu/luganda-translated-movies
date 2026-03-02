/**
 * Unruly Movies - Payment Manager
 * Handles Airtel Money payments only
 * Modern UI with glassmorphism design
 */

class PaymentManager {
    constructor() {
        this.apiUrl = API_CONFIG.API_URL;
        // 5 Subscription tiers: 1,000 - 50,000 UGX
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

    /**
     * Show payment modal
     */
    showPaymentModal(plan = 'basic') {
        this.selectedPlan = plan;
        
        const modal = document.createElement('div');
        modal.id = 'paymentModal';
        modal.className = 'modal-modern active';
        modal.innerHTML = this.getModalHTML();
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // Initialize event listeners
        this.initModalEvents();
        
        // Animate in
        requestAnimationFrame(() => {
            modal.querySelector('.modal-modern-content').style.transform = 'scale(1) translateY(0)';
        });
    }

    /**
     * Get modal HTML - Airtel Only with 5 tiers
     */
    getModalHTML() {
        const currentPlan = this.plans[this.selectedPlan];
        
        return `
            <div class="modal-modern-content payment-modal" style="max-width: 500px;">
                <!-- Header -->
                <div class="payment-modal-header">
                    <button class="close-modal" onclick="paymentManager.closeModal()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                    <div class="airtel-logo" style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 16px;">
                        <div style="background: #FF0000; padding: 8px 16px; border-radius: 8px;">
                            <span style="font-weight: bold; color: #fff; font-size: 18px;">Airtel</span>
                        </div>
                        <span style="color: rgba(255,255,255,0.6);">Money</span>
                    </div>
                    <h2 class="gradient-text" style="font-size: 24px; margin: 0 0 8px;">Choose Your Plan</h2>
                    <p style="color: rgba(255,255,255,0.6); font-size: 14px;">Unlock unlimited Luganda movies & series</p>
                </div>

                <!-- Plan Selection Grid -->
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

                <!-- Selected Plan Features -->
                <div class="selected-plan-features glass" style="margin: 16px 0; padding: 16px; border-radius: 12px;">
                    <div class="features-header" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <span style="font-size: 20px;">${currentPlan.icon}</span>
                        <span style="font-weight: 600; color: ${currentPlan.color};">${currentPlan.name} Plan</span>
                        <span style="color: rgba(255,255,255,0.5); margin-left: auto;">${currentPlan.duration}</span>
                    </div>
                    <ul class="features-list" style="list-style: none; padding: 0; margin: 0;">
                        ${currentPlan.features.map(f => `
                            <li style="display: flex; align-items: center; gap: 8px; padding: 4px 0; color: rgba(255,255,255,0.8);">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="${currentPlan.color}" stroke="${currentPlan.color}">
                                    <path d="M20 6L9 17l-5-5"/>
                                </svg>
                                ${f}
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- Phone Number Input -->
                <div class="phone-input-section">
                    <label class="section-label">Airtel Money Number</label>
                    <div class="phone-input-wrapper">
                        <span class="country-code">🇺🇬 +256</span>
                        <input type="tel" id="phoneNumber" class="phone-input" 
                            placeholder="70X XXX XXX" maxlength="9"
                            pattern="[0-9]*" inputmode="numeric">
                    </div>
                    <p class="phone-hint">Enter your Airtel number (070, 074, 075)</p>
                </div>

                <!-- Price Summary -->
                <div class="price-summary glass">
                    <div class="price-row">
                        <span>${currentPlan.name} Plan</span>
                        <span>${currentPlan.duration}</span>
                    </div>
                    <div class="price-total">
                        <span>Total</span>
                        <span class="total-amount" style="color: ${currentPlan.color};">UGX ${this.formatPrice(currentPlan.price)}</span>
                    </div>
                </div>

                <!-- Pay Button -->
                <button id="payButton" class="btn-modern btn-modern-primary pay-button" onclick="paymentManager.initiatePayment()" 
                    style="background: linear-gradient(135deg, #FF0000, #CC0000);">
                    <span class="btn-text">Pay with Airtel Money</span>
                    <span class="btn-loader" style="display: none;">
                        <div class="spinner-modern" style="width: 20px; height: 20px; border-width: 2px;"></div>
                    </span>
                </button>

                <!-- Security Badge -->
                <div class="security-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>Secured by Airtel Money</span>
                </div>

                <!-- Payment Status (hidden initially) -->
                <div id="paymentStatus" class="payment-status" style="display: none;"></div>
            </div>
        `;
    }

    /**
     * Initialize modal event listeners
     */
    initModalEvents() {
        // Plan card selection
        document.querySelectorAll('.plan-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.plan-card').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedPlan = btn.dataset.plan;
                this.updateModalContent();
            });
        });

        // Phone input formatting
        const phoneInput = document.getElementById('phoneNumber');
        phoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
        });

        // Close on backdrop click
        document.getElementById('paymentModal').addEventListener('click', (e) => {
            if (e.target.id === 'paymentModal') {
                this.closeModal();
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    /**
     * Update modal content when plan changes
     */
    updateModalContent() {
        const plan = this.plans[this.selectedPlan];
        
        // Update features
        const featuresContainer = document.querySelector('.selected-plan-features');
        featuresContainer.innerHTML = `
            <div class="features-header" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="font-size: 20px;">${plan.icon}</span>
                <span style="font-weight: 600; color: ${plan.color};">${plan.name} Plan</span>
                <span style="color: rgba(255,255,255,0.5); margin-left: auto;">${plan.duration}</span>
            </div>
            <ul class="features-list" style="list-style: none; padding: 0; margin: 0;">
                ${plan.features.map(f => `
                    <li style="display: flex; align-items: center; gap: 8px; padding: 4px 0; color: rgba(255,255,255,0.8);">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="${plan.color}" stroke="${plan.color}">
                            <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        ${f}
                    </li>
                `).join('')}
            </ul>
        `;
        
        // Update price summary
        document.querySelector('.price-row span:first-child').textContent = `${plan.name} Plan`;
        document.querySelector('.price-row span:last-child').textContent = plan.duration;
        document.querySelector('.total-amount').textContent = `UGX ${this.formatPrice(plan.price)}`;
        document.querySelector('.total-amount').style.color = plan.color;
    }

    /**
     * Initiate Airtel Money payment
     */
    async initiatePayment() {
        const phoneNumber = document.getElementById('phoneNumber').value;
        
        if (!phoneNumber || phoneNumber.length < 9) {
            this.showToast('Please enter a valid phone number', 'error');
            return;
        }

        // Validate Airtel number prefix
        if (!['70', '74', '75'].some(p => phoneNumber.startsWith(p))) {
            this.showToast('Please enter a valid Airtel number (070, 074, 075)', 'error');
            return;
        }

        const token = getAuthToken();
        if (!token) {
            this.showToast('Please login to continue', 'error');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        // Show loading
        const payBtn = document.getElementById('payButton');
        payBtn.querySelector('.btn-text').style.display = 'none';
        payBtn.querySelector('.btn-loader').style.display = 'flex';
        payBtn.disabled = true;

        try {
            const response = await fetch(`${this.apiUrl}/api/payments/airtel/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    phoneNumber: phoneNumber,
                    subscriptionPlan: this.selectedPlan
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                this.showPaymentPending(data.data);
                this.startStatusPolling(data.data.transactionRef);
            } else {
                throw new Error(data.message || 'Payment failed');
            }

        } catch (error) {
            console.error('Payment error:', error);
            this.showToast(error.message || 'Payment failed. Please try again.', 'error');
            
            // Reset button
            payBtn.querySelector('.btn-text').style.display = 'inline';
            payBtn.querySelector('.btn-loader').style.display = 'none';
            payBtn.disabled = false;
        }
    }

    /**
     * Show payment pending status
     */
    showPaymentPending(data) {
        const statusDiv = document.getElementById('paymentStatus');
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `
            <div class="status-pending animate-fade-in-up">
                <div class="status-icon pending">
                    <div class="spinner-modern"></div>
                </div>
                <h3>Check Your Phone</h3>
                <p>A payment request has been sent to <strong>${data.phoneNumber}</strong></p>
                <p class="status-hint">Enter your Airtel Money PIN to complete the payment</p>
                <div class="status-timer">
                    <span>Waiting for confirmation...</span>
                </div>
            </div>
        `;

        // Hide the form elements
        document.querySelector('.plan-selector').style.display = 'none';
        document.querySelector('.selected-plan-features').style.display = 'none';
        document.querySelector('.phone-input-section').style.display = 'none';
        document.querySelector('.price-summary').style.display = 'none';
        document.getElementById('payButton').style.display = 'none';
    }

    /**
     * Poll for payment status
     */
    async startStatusPolling(transactionId) {
        const token = getAuthToken();
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes (5 second intervals)

        const pollStatus = async () => {
            if (attempts >= maxAttempts) {
                this.showPaymentTimeout();
                return;
            }

            attempts++;

            try {
                const response = await fetch(`${this.apiUrl}/api/payments/airtel/status/${transactionId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (data.status === 'success') {
                    const paymentStatus = data.data.paymentStatus;

                    if (paymentStatus === 'SUCCESSFUL' || paymentStatus === 'completed') {
                        this.showPaymentSuccess();
                        return;
                    } else if (paymentStatus === 'FAILED' || paymentStatus === 'REJECTED' || paymentStatus === 'failed') {
                        this.showPaymentFailed(data.data.reason || data.data.message);
                        return;
                    }
                }

                // Continue polling
                setTimeout(pollStatus, 5000);

            } catch (error) {
                console.error('Status poll error:', error);
                setTimeout(pollStatus, 5000);
            }
        };

        // Start polling after 3 seconds
        setTimeout(pollStatus, 3000);
    }

    /**
     * Show payment success
     */
    showPaymentSuccess() {
        const statusDiv = document.getElementById('paymentStatus');
        statusDiv.innerHTML = `
            <div class="status-success animate-bounce-in">
                <div class="status-icon success">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7CFC00" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                </div>
                <h3 class="gradient-text">Payment Successful!</h3>
                <p>Your ${this.plans[this.selectedPlan].name} subscription is now active</p>
                <button class="btn-modern btn-modern-primary" onclick="window.location.reload()" style="margin-top: 20px;">
                    Start Watching
                </button>
            </div>
        `;

        // Confetti effect
        this.showConfetti();

        this.showToast('Subscription activated! Enjoy unlimited movies! 🎉', 'success');
    }

    /**
     * Show payment failed
     */
    showPaymentFailed(reason) {
        const statusDiv = document.getElementById('paymentStatus');
        statusDiv.innerHTML = `
            <div class="status-failed animate-fade-in-up">
                <div class="status-icon failed">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff4444" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M15 9l-6 6M9 9l6 6"/>
                    </svg>
                </div>
                <h3 style="color: #ff4444;">Payment Failed</h3>
                <p>${reason || 'The payment could not be completed'}</p>
                <button class="btn-modern btn-modern-secondary" onclick="paymentManager.resetModal()" style="margin-top: 20px;">
                    Try Again
                </button>
            </div>
        `;
    }

    /**
     * Show payment timeout
     */
    showPaymentTimeout() {
        const statusDiv = document.getElementById('paymentStatus');
        statusDiv.innerHTML = `
            <div class="status-timeout animate-fade-in-up">
                <div class="status-icon timeout">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                </div>
                <h3 style="color: #FFD700;">Payment Timeout</h3>
                <p>We didn't receive a response. If you completed the payment, it will be activated shortly.</p>
                <button class="btn-modern btn-modern-secondary" onclick="paymentManager.resetModal()" style="margin-top: 20px;">
                    Try Again
                </button>
            </div>
        `;
    }

    /**
     * Reset modal to initial state
     */
    resetModal() {
        document.querySelector('.duration-selector').style.display = 'flex';
        document.querySelector('.provider-section').style.display = 'block';
        document.querySelector('.phone-input-section').style.display = 'block';
        document.querySelector('.price-summary').style.display = 'block';
        
        const payBtn = document.getElementById('payButton');
        payBtn.style.display = 'flex';
        payBtn.querySelector('.btn-text').style.display = 'inline';
        payBtn.querySelector('.btn-loader').style.display = 'none';
        payBtn.disabled = false;

        document.getElementById('paymentStatus').style.display = 'none';
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => modal.remove(), 300);
        }
    }

    /**
     * Format price with commas
     */
    formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-modern ${type} show`;
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    /**
     * Simple confetti effect
     */
    showConfetti() {
        const colors = ['#7CFC00', '#00D9FF', '#FFD700', '#FF6B9D', '#9D4EDD'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -10px;
                left: ${Math.random() * 100}vw;
                opacity: 1;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
                z-index: 10002;
            `;
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 4000);
        }
    }
}

// Add confetti animation
const style = document.createElement('style');
style.textContent = `
    @keyframes confettiFall {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize
const paymentManager = new PaymentManager();

// Export for global access
window.paymentManager = paymentManager;
window.showPaymentModal = (plan) => paymentManager.showPaymentModal(plan);
