/**
 * Airtel Money Uganda Payment Integration
 * For Unruly Movies - Luganda Translated Movies
 */

class AirtelMoneyPayment {
    constructor() {
        this.apiUrl = typeof API_CONFIG !== 'undefined' 
            ? API_CONFIG.BASE_URL 
            : 'https://luganda-translated-movies-production.up.railway.app';
        this.pollInterval = null;
        this.maxPollAttempts = 60; // 5 minutes max (5 second intervals)
        this.pollAttempt = 0;
    }

    /**
     * Get authentication token from localStorage
     */
    getAuthToken() {
        return localStorage.getItem('token');
    }

    /**
     * Validate Airtel Uganda phone number
     * Valid prefixes: 070, 074, 075
     */
    validatePhoneNumber(phone) {
        const cleaned = phone.replace(/[^0-9]/g, '');
        
        // Remove country code if present
        let phoneNumber = cleaned;
        if (cleaned.startsWith('256')) {
            phoneNumber = cleaned.substring(3);
        } else if (cleaned.startsWith('0')) {
            phoneNumber = cleaned.substring(1);
        }

        // Check for valid Airtel Uganda prefixes
        const validPrefixes = ['70', '74', '75'];
        const isValid = validPrefixes.some(prefix => phoneNumber.startsWith(prefix));
        
        return {
            isValid: isValid && phoneNumber.length === 9,
            formattedNumber: isValid ? `0${phoneNumber}` : null,
            error: !isValid ? 'Please enter a valid Airtel Uganda number (070, 074, 075)' : null
        };
    }

    /**
     * Initiate Airtel Money payment
     * @param {string} subscriptionPlan - 'basic' or 'premium'
     * @param {string} subscriptionDuration - 'monthly' or 'yearly'
     * @param {string} phoneNumber - Airtel Uganda phone number
     */
    async initiatePayment(subscriptionPlan, subscriptionDuration, phoneNumber) {
        const token = this.getAuthToken();
        if (!token) {
            throw new Error('Please login to make a payment');
        }

        // Validate phone number
        const validation = this.validatePhoneNumber(phoneNumber);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        try {
            const response = await fetch(`${this.apiUrl}/api/payments/airtel/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subscriptionPlan,
                    subscriptionDuration,
                    phoneNumber
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Payment initiation failed');
            }

            return data;
        } catch (error) {
            console.error('Airtel payment error:', error);
            throw error;
        }
    }

    /**
     * Check payment status
     * @param {string} transactionId - Transaction reference
     */
    async checkStatus(transactionId) {
        const token = this.getAuthToken();
        if (!token) {
            throw new Error('Please login to check payment status');
        }

        try {
            const response = await fetch(`${this.apiUrl}/api/payments/airtel/status/${transactionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to check payment status');
            }

            return data;
        } catch (error) {
            console.error('Status check error:', error);
            throw error;
        }
    }

    /**
     * Poll for payment completion
     * @param {string} transactionId - Transaction reference
     * @param {function} onStatusUpdate - Callback for status updates
     * @param {function} onComplete - Callback when payment completes
     * @param {function} onError - Callback on error
     */
    startPolling(transactionId, onStatusUpdate, onComplete, onError) {
        this.pollAttempt = 0;
        this.stopPolling();

        const poll = async () => {
            this.pollAttempt++;

            if (this.pollAttempt > this.maxPollAttempts) {
                this.stopPolling();
                onError(new Error('Payment timeout. Please check your transaction history.'));
                return;
            }

            try {
                const result = await this.checkStatus(transactionId);
                
                if (result.data?.paymentStatus === 'completed') {
                    this.stopPolling();
                    onComplete(result.data);
                } else if (result.data?.paymentStatus === 'failed') {
                    this.stopPolling();
                    onError(new Error(result.data.reason || 'Payment failed'));
                } else {
                    onStatusUpdate({
                        status: 'pending',
                        message: result.data?.message || 'Waiting for payment confirmation...',
                        attempt: this.pollAttempt
                    });
                }
            } catch (error) {
                // Don't stop on network errors, just report
                onStatusUpdate({
                    status: 'checking',
                    message: 'Checking payment status...',
                    attempt: this.pollAttempt
                });
            }
        };

        // Poll every 5 seconds
        this.pollInterval = setInterval(poll, 5000);
        
        // Initial check
        poll();
    }

    /**
     * Stop polling for payment status
     */
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    /**
     * Get pricing information
     */
    async getPricing() {
        try {
            const response = await fetch(`${this.apiUrl}/api/payments/airtel/config`);
            const data = await response.json();
            return data.data?.prices || null;
        } catch (error) {
            console.error('Failed to get pricing:', error);
            return null;
        }
    }

    /**
     * Format UGX amount
     */
    formatAmount(amount) {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0
        }).format(amount);
    }
}

// Create global instance
window.airtelMoney = new AirtelMoneyPayment();

/**
 * Show Airtel Money Payment Modal
 */
function showAirtelPaymentModal(subscriptionPlan, subscriptionDuration) {
    const prices = {
        basic: { monthly: 17000, yearly: 170000 },
        premium: { monthly: 55000, yearly: 550000 }
    };

    const amount = prices[subscriptionPlan]?.[subscriptionDuration] || 0;
    const formattedAmount = window.airtelMoney.formatAmount(amount);

    const modalHtml = `
        <div class="modal fade" id="airtelPaymentModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="background: #1a1a1a; border: 1px solid #333; border-radius: 16px;">
                    <div class="modal-header" style="border-bottom: 1px solid #333;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <img src="https://www.airtel.co.ug/assets/images/airtel-logo.svg" alt="Airtel Money" style="height: 30px; filter: brightness(0) invert(1);">
                            <h5 class="modal-title" style="color: #fff; margin: 0;">Airtel Money Payment</h5>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" style="padding: 24px;">
                        <div id="airtelPaymentForm">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <div style="background: linear-gradient(135deg, #e60000, #ff4444); padding: 20px; border-radius: 12px; color: #fff;">
                                    <p style="margin: 0; font-size: 14px; opacity: 0.9;">Amount to Pay</p>
                                    <h2 style="margin: 8px 0 0 0; font-size: 32px; font-weight: 700;">${formattedAmount}</h2>
                                    <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.8;">${subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)} Plan - ${subscriptionDuration}</p>
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; color: #aaa; font-size: 14px; margin-bottom: 8px;">Airtel Money Number</label>
                                <div style="position: relative;">
                                    <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #666; font-size: 15px;">+256</span>
                                    <input type="tel" 
                                           id="airtelPhoneNumber" 
                                           placeholder="70XXXXXXX" 
                                           style="width: 100%; padding: 14px 16px 14px 60px; background: #2a2a2a; border: 1px solid #444; border-radius: 10px; color: #fff; font-size: 16px;"
                                           maxlength="10">
                                </div>
                                <p style="color: #888; font-size: 12px; margin-top: 6px;">Enter your Airtel number (070, 074, 075)</p>
                            </div>
                            
                            <button type="button" 
                                    id="airtelPayBtn" 
                                    onclick="processAirtelPayment('${subscriptionPlan}', '${subscriptionDuration}')"
                                    style="width: 100%; padding: 16px; background: linear-gradient(135deg, #e60000, #cc0000); color: #fff; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                                <span id="airtelPayBtnText">Pay with Airtel Money</span>
                            </button>
                            
                            <p style="text-align: center; color: #666; font-size: 12px; margin-top: 16px;">
                                A prompt will be sent to your phone. Enter your PIN to confirm payment.
                            </p>
                        </div>
                        
                        <div id="airtelPaymentStatus" style="display: none; text-align: center; padding: 20px;">
                            <div id="airtelStatusIcon"></div>
                            <h4 id="airtelStatusTitle" style="color: #fff; margin: 16px 0 8px 0;"></h4>
                            <p id="airtelStatusMessage" style="color: #aaa; margin: 0;"></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if present
    const existingModal = document.getElementById('airtelPaymentModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('airtelPaymentModal'));
    modal.show();

    // Clean up on close
    document.getElementById('airtelPaymentModal').addEventListener('hidden.bs.modal', function() {
        window.airtelMoney.stopPolling();
        this.remove();
    });
}

/**
 * Process Airtel Money Payment
 */
async function processAirtelPayment(subscriptionPlan, subscriptionDuration) {
    const phoneInput = document.getElementById('airtelPhoneNumber');
    const payBtn = document.getElementById('airtelPayBtn');
    const payBtnText = document.getElementById('airtelPayBtnText');
    const formDiv = document.getElementById('airtelPaymentForm');
    const statusDiv = document.getElementById('airtelPaymentStatus');
    const statusIcon = document.getElementById('airtelStatusIcon');
    const statusTitle = document.getElementById('airtelStatusTitle');
    const statusMessage = document.getElementById('airtelStatusMessage');

    const phoneNumber = phoneInput.value.trim();

    if (!phoneNumber) {
        alert('Please enter your Airtel Money number');
        return;
    }

    // Disable button and show loading
    payBtn.disabled = true;
    payBtnText.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    try {
        // Initiate payment
        const result = await window.airtelMoney.initiatePayment(subscriptionPlan, subscriptionDuration, phoneNumber);

        if (result.status === 'success') {
            // Show status UI
            formDiv.style.display = 'none';
            statusDiv.style.display = 'block';
            
            statusIcon.innerHTML = `
                <div style="width: 80px; height: 80px; margin: 0 auto; border: 4px solid #333; border-top-color: #e60000; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
            `;
            statusTitle.textContent = 'Check Your Phone';
            statusMessage.innerHTML = `A payment prompt has been sent to <strong>${result.data.phoneNumber}</strong><br><br>Enter your Airtel Money PIN to confirm payment.`;

            // Start polling for status
            window.airtelMoney.startPolling(
                result.data.transactionRef,
                // Status update callback
                (status) => {
                    statusMessage.innerHTML = `${status.message}<br><small style="color: #666;">Checking... (${status.attempt})</small>`;
                },
                // Success callback
                (data) => {
                    statusIcon.innerHTML = `
                        <div style="width: 80px; height: 80px; margin: 0 auto; background: #28a745; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                    `;
                    statusTitle.textContent = 'Payment Successful!';
                    statusMessage.innerHTML = 'Your subscription has been activated.<br><br><button onclick="location.reload()" class="btn btn-success">Continue</button>';
                },
                // Error callback
                (error) => {
                    statusIcon.innerHTML = `
                        <div style="width: 80px; height: 80px; margin: 0 auto; background: #dc3545; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </div>
                    `;
                    statusTitle.textContent = 'Payment Failed';
                    statusMessage.innerHTML = `${error.message}<br><br><button onclick="location.reload()" class="btn btn-outline-light">Try Again</button>`;
                }
            );
        }
    } catch (error) {
        alert(error.message || 'Payment failed. Please try again.');
        payBtn.disabled = false;
        payBtnText.textContent = 'Pay with Airtel Money';
    }
}

// Export for use
window.showAirtelPaymentModal = showAirtelPaymentModal;
