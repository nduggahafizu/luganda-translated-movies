/**
 * Live Chat Widget for Customer Support
 * Floating chat button with multiple contact options
 */

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        whatsappNumber: '+256743311809',
        supportEmail: 'nduggahafizu@gmail.com',
        position: 'bottom-right', // bottom-right, bottom-left
        greeting: 'Hi! How can we help you today?',
        offlineMessage: 'We typically respond within 24 hours'
    };
    
    // Create chat widget HTML
    function createChatWidget() {
        const widget = document.createElement('div');
        widget.id = 'chat-widget';
        widget.innerHTML = `
            <!-- Chat Button -->
            <button class="chat-toggle-btn" onclick="window.chatWidget.toggle()" aria-label="Open chat">
                <svg class="chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <svg class="chat-close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span class="chat-badge">1</span>
            </button>
            
            <!-- Chat Window -->
            <div class="chat-window">
                <div class="chat-header">
                    <div class="chat-header-info">
                        <img src="assets/images/logo.png" alt="Support" class="chat-avatar">
                        <div>
                            <h4>Unruly Movies Support</h4>
                            <p class="chat-status">
                                <span class="status-dot"></span>
                                Online
                            </p>
                        </div>
                    </div>
                    <button class="chat-close-btn" onclick="window.chatWidget.close()" aria-label="Close chat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <div class="chat-body">
                    <!-- Welcome Message -->
                    <div class="chat-message bot-message">
                        <div class="message-avatar">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                        </div>
                        <div class="message-content">
                            <p>${CONFIG.greeting}</p>
                            <p class="message-subtitle">${CONFIG.offlineMessage}</p>
                        </div>
                    </div>
                    
                    <!-- Contact Options -->
                    <div class="chat-options">
                        <h5>Choose how to reach us:</h5>
                        
                        <button class="chat-option-btn whatsapp-btn" onclick="window.chatWidget.openWhatsApp()">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            <div>
                                <strong>WhatsApp Chat</strong>
                                <span>Instant support via WhatsApp</span>
                            </div>
                        </button>
                        
                        <button class="chat-option-btn email-btn" onclick="window.chatWidget.openEmail()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <div>
                                <strong>Email Us</strong>
                                <span>Send a detailed message</span>
                            </div>
                        </button>
                        
                        <button class="chat-option-btn form-btn" onclick="window.chatWidget.showForm()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <line x1="10" y1="9" x2="8" y2="9"></line>
                            </svg>
                            <div>
                                <strong>Contact Form</strong>
                                <span>Fill out our contact form</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(widget);
    }
    
    // Add styles
    function addStyles() {
        if (document.getElementById('chat-widget-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'chat-widget-styles';
        styles.textContent = `
            #chat-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 999999;
                font-family: 'Inter', sans-serif;
            }
            
            .chat-toggle-btn {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #7CFC00, #00d4aa);
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(124, 252, 0, 0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
                position: relative;
            }
            
            .chat-toggle-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(124, 252, 0, 0.6);
            }
            
            .chat-toggle-btn svg {
                width: 28px;
                height: 28px;
                color: #000;
            }
            
            .chat-icon {
                display: block;
            }
            
            .chat-close-icon {
                display: none;
            }
            
            #chat-widget.open .chat-icon {
                display: none;
            }
            
            #chat-widget.open .chat-close-icon {
                display: block;
            }
            
            .chat-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff4444;
                color: #fff;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 600;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            .chat-window {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 380px;
                max-width: calc(100vw - 40px);
                height: 500px;
                background: #1a1a1a;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                display: none;
                flex-direction: column;
                overflow: hidden;
                animation: slideUp 0.3s ease;
            }
            
            #chat-widget.open .chat-window {
                display: flex;
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .chat-header {
                background: linear-gradient(135deg, #7CFC00, #00d4aa);
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .chat-header-info {
                display: flex;
                gap: 12px;
                align-items: center;
            }
            
            .chat-avatar {
                width: 45px;
                height: 45px;
                border-radius: 50%;
                background: #fff;
                padding: 5px;
            }
            
            .chat-header h4 {
                color: #000;
                font-size: 1rem;
                margin: 0;
                font-weight: 600;
            }
            
            .chat-status {
                display: flex;
                align-items: center;
                gap: 6px;
                color: rgba(0, 0, 0, 0.7);
                font-size: 0.85rem;
                margin: 4px 0 0 0;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #00ff00;
                animation: blink 1.5s infinite;
            }
            
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
            
            .chat-close-btn {
                background: rgba(0, 0, 0, 0.2);
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .chat-close-btn:hover {
                background: rgba(0, 0, 0, 0.3);
                transform: scale(1.1);
            }
            
            .chat-close-btn svg {
                width: 18px;
                height: 18px;
                color: #000;
            }
            
            .chat-body {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                background: #0a0a0a;
            }
            
            .chat-message {
                display: flex;
                gap: 12px;
                margin-bottom: 20px;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .message-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: #7CFC00;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .message-avatar svg {
                width: 20px;
                height: 20px;
                color: #000;
            }
            
            .message-content {
                flex: 1;
                background: #1a1a1a;
                padding: 12px 16px;
                border-radius: 12px;
                border-radius: 12px 12px 12px 4px;
            }
            
            .message-content p {
                color: #fff;
                margin: 0 0 8px 0;
                font-size: 0.95rem;
                line-height: 1.5;
            }
            
            .message-content p:last-child {
                margin-bottom: 0;
            }
            
            .message-subtitle {
                color: #888 !important;
                font-size: 0.85rem !important;
            }
            
            .chat-options {
                margin-top: 10px;
            }
            
            .chat-options h5 {
                color: #aaa;
                font-size: 0.9rem;
                margin-bottom: 15px;
                font-weight: 500;
            }
            
            .chat-option-btn {
                width: 100%;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 10px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 15px;
                transition: all 0.2s;
            }
            
            .chat-option-btn:hover {
                background: #222;
                border-color: #7CFC00;
                transform: translateX(5px);
            }
            
            .chat-option-btn svg {
                width: 32px;
                height: 32px;
                flex-shrink: 0;
            }
            
            .whatsapp-btn svg {
                color: #25D366;
            }
            
            .email-btn svg {
                color: #7CFC00;
            }
            
            .form-btn svg {
                color: #00d4aa;
            }
            
            .chat-option-btn div {
                text-align: left;
            }
            
            .chat-option-btn strong {
                color: #fff;
                font-size: 1rem;
                display: block;
                margin-bottom: 4px;
            }
            
            .chat-option-btn span {
                color: #888;
                font-size: 0.85rem;
            }
            
            @media (max-width: 768px) {
                #chat-widget {
                    bottom: 15px;
                    right: 15px;
                }
                
                .chat-window {
                    width: calc(100vw - 30px);
                    height: 450px;
                    bottom: 75px;
                }
                
                .chat-toggle-btn {
                    width: 55px;
                    height: 55px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    // Toggle chat window
    function toggleChat() {
        const widget = document.getElementById('chat-widget');
        widget.classList.toggle('open');
        
        // Hide badge when opened
        if (widget.classList.contains('open')) {
            const badge = widget.querySelector('.chat-badge');
            if (badge) badge.style.display = 'none';
        }
    }
    
    // Close chat window
    function closeChat() {
        const widget = document.getElementById('chat-widget');
        widget.classList.remove('open');
    }
    
    // Open WhatsApp
    function openWhatsApp() {
        const message = encodeURIComponent('Hi! I need help with Unruly Movies.');
        window.open(`https://wa.me/${CONFIG.whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
        closeChat();
    }
    
    // Open email client
    function openEmail() {
        const subject = encodeURIComponent('Support Request - Unruly Movies');
        const body = encodeURIComponent('Hi Support Team,\n\nI need help with:\n\n');
        window.location.href = `mailto:${CONFIG.supportEmail}?subject=${subject}&body=${body}`;
        closeChat();
    }
    
    // Show contact form
    function showForm() {
        window.location.href = 'contact.html';
        closeChat();
    }
    
    // Public API
    window.chatWidget = {
        toggle: toggleChat,
        close: closeChat,
        openWhatsApp: openWhatsApp,
        openEmail: openEmail,
        showForm: showForm
    };
    
    // Initialize
    function init() {
        addStyles();
        createChatWidget();
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
