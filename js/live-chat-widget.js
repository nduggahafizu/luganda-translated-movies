/**
 * Live Chat Support Widget
 * Uses Tawk.to free live chat with custom styling
 */

class LiveChatWidget {
    constructor(options = {}) {
        this.options = {
            // Replace with your Tawk.to property ID
            tawkPropertyId: options.tawkPropertyId || null,
            // Or use custom widget
            useCustomWidget: options.useCustomWidget || true,
            supportEmail: options.supportEmail || 'support@unrulymovies.com',
            whatsappNumber: options.whatsappNumber || null,
            telegramUsername: options.telegramUsername || null,
            ...options
        };
        
        this.isOpen = false;
        this.messages = [];
        
        this.init();
    }
    
    init() {
        if (this.options.tawkPropertyId) {
            this.loadTawkTo();
        } else if (this.options.useCustomWidget) {
            this.createCustomWidget();
        }
    }
    
    // Tawk.to Integration (Free Live Chat)
    loadTawkTo() {
        const Tawk_API = window.Tawk_API || {};
        const Tawk_LoadStart = new Date();
        
        const s1 = document.createElement("script");
        s1.async = true;
        s1.src = `https://embed.tawk.to/${this.options.tawkPropertyId}/1default`;
        s1.charset = 'UTF-8';
        s1.setAttribute('crossorigin', '*');
        
        const s0 = document.getElementsByTagName('script')[0];
        s0.parentNode.insertBefore(s1, s0);
        
        // Custom styling
        window.Tawk_API = Tawk_API;
        window.Tawk_API.customStyle = {
            visibility: {
                desktop: {
                    position: 'br',
                    xOffset: 20,
                    yOffset: 20
                },
                mobile: {
                    position: 'br',
                    xOffset: 10,
                    yOffset: 10
                }
            }
        };
    }
    
    // Custom Support Widget (fallback)
    createCustomWidget() {
        this.createStyles();
        this.createWidgetHTML();
        this.addEventListeners();
    }
    
    createWidgetHTML() {
        const widget = document.createElement('div');
        widget.id = 'support-widget';
        widget.innerHTML = `
            <!-- Chat Button -->
            <button class="support-btn" aria-label="Open support chat">
                <span class="support-btn-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                        <path d="M7 9h10v2H7zM7 12h7v2H7z"/>
                    </svg>
                </span>
                <span class="support-btn-pulse"></span>
                <span class="support-notification hidden">1</span>
            </button>
            
            <!-- Chat Window -->
            <div class="support-window hidden">
                <div class="support-header">
                    <div class="support-header-info">
                        <div class="support-avatar">
                            <span>🎬</span>
                            <span class="online-dot"></span>
                        </div>
                        <div class="support-header-text">
                            <h4>Unruly Movies Support</h4>
                            <span class="support-status">We typically reply within 24 hours</span>
                        </div>
                    </div>
                    <button class="support-close" aria-label="Close chat">&times;</button>
                </div>
                
                <div class="support-tabs">
                    <button class="support-tab active" data-tab="chat">💬 Chat</button>
                    <button class="support-tab" data-tab="faq">❓ FAQ</button>
                    <button class="support-tab" data-tab="contact">📞 Contact</button>
                </div>
                
                <div class="support-content">
                    <!-- Chat Tab -->
                    <div class="support-tab-content active" data-tab="chat">
                        <div class="support-messages">
                            <div class="support-message bot">
                                <div class="message-bubble">
                                    <p>👋 Hello! Welcome to Unruly Movies support!</p>
                                    <p>How can we help you today?</p>
                                </div>
                            </div>
                            <div class="quick-replies">
                                <button class="quick-reply" data-reply="video-issue">🎬 Video not playing</button>
                                <button class="quick-reply" data-reply="subscription">💳 Subscription help</button>
                                <button class="quick-reply" data-reply="account">👤 Account issue</button>
                                <button class="quick-reply" data-reply="request">📝 Request a movie</button>
                            </div>
                        </div>
                        <form class="support-form">
                            <input type="text" placeholder="Type your message..." class="support-input" autocomplete="off">
                            <button type="submit" class="support-send" aria-label="Send message">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </form>
                    </div>
                    
                    <!-- FAQ Tab -->
                    <div class="support-tab-content" data-tab="faq">
                        <div class="faq-list">
                            <details class="faq-item">
                                <summary>Why is the video not playing?</summary>
                                <p>Try refreshing the page, clearing your cache, or switching to a different browser. If using mobile data, switch to WiFi for better streaming.</p>
                            </details>
                            <details class="faq-item">
                                <summary>How do I download movies?</summary>
                                <p>Currently all content is available for free streaming. Downloads may not be available on all devices — try streaming directly on the movie page.</p>
                            </details>
                            <details class="faq-item">
                                <summary>Can I request a specific movie?</summary>
                                <p>Yes! Use the "Request Movie" feature in the menu. We try to add requested movies within 2-4 weeks if available.</p>
                            </details>
                            <details class="faq-item">
                                <summary>Why is there no Luganda translation?</summary>
                                <p>Some movies may not yet have a Luganda translation. You can request a translation by using the report/request feature on that movie's page.</p>
                            </details>
                        </div>
                    </div>
                    
                    <!-- Contact Tab -->
                    <div class="support-tab-content" data-tab="contact">
                        <div class="contact-options">
                            <a href="mailto:support@unrulymovies.com" class="contact-option">
                                <span class="contact-icon">📧</span>
                                <div class="contact-info">
                                    <strong>Email Us</strong>
                                    <span>support@unrulymovies.com</span>
                                </div>
                            </a>
                            <a href="https://wa.me/256743311809" target="_blank" class="contact-option whatsapp">
                                <span class="contact-icon">📱</span>
                                <div class="contact-info">
                                    <strong>WhatsApp</strong>
                                    <span>Chat on WhatsApp</span>
                                </div>
                            </a>
                            <a href="https://t.me/unrulymovies" target="_blank" class="contact-option telegram">
                                <span class="contact-icon">✈️</span>
                                <div class="contact-info">
                                    <strong>Telegram</strong>
                                    <span>@unrulymovies</span>
                                </div>
                            </a>
                            <a href="/faq.html" class="contact-option">
                                <span class="contact-icon">📚</span>
                                <div class="contact-info">
                                    <strong>Help Center</strong>
                                    <span>Browse FAQs & guides</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(widget);
        this.widget = widget;
    }
    
    addEventListeners() {
        // Toggle chat window
        const btn = this.widget.querySelector('.support-btn');
        const window = this.widget.querySelector('.support-window');
        const closeBtn = this.widget.querySelector('.support-close');
        
        btn.addEventListener('click', () => {
            this.isOpen = !this.isOpen;
            window.classList.toggle('hidden', !this.isOpen);
            btn.classList.toggle('active', this.isOpen);
            
            // Track
            if (typeof gtag === 'function') {
                gtag('event', 'support_widget', {
                    'action': this.isOpen ? 'open' : 'close'
                });
            }
        });
        
        closeBtn.addEventListener('click', () => {
            this.isOpen = false;
            window.classList.add('hidden');
            btn.classList.remove('active');
        });
        
        // Tab switching
        const tabs = this.widget.querySelectorAll('.support-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Update tab buttons
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update tab content
                this.widget.querySelectorAll('.support-tab-content').forEach(content => {
                    content.classList.toggle('active', content.dataset.tab === tabName);
                });
            });
        });
        
        // Quick replies
        const quickReplies = this.widget.querySelectorAll('.quick-reply');
        quickReplies.forEach(reply => {
            reply.addEventListener('click', () => {
                const type = reply.dataset.reply;
                this.handleQuickReply(type);
            });
        });
        
        // Message form
        const form = this.widget.querySelector('.support-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = form.querySelector('.support-input');
            const message = input.value.trim();
            if (message) {
                this.sendMessage(message);
                input.value = '';
            }
        });
    }
    
    handleQuickReply(type) {
        const responses = {
            'video-issue': {
                user: 'Video is not playing',
                bot: `I'm sorry to hear that! Here are some quick fixes:\n\n1️⃣ Try refreshing the page\n2️⃣ Clear your browser cache\n3️⃣ Switch to Chrome or Firefox\n4️⃣ Try a different WiFi network\n\nIf it still doesn't work, use the "Report Issue" button on the video page.`
            },
            'subscription': {
                user: 'I need help with subscription',
                bot: `For subscription help:\n\n💳 **To Subscribe:** Click "Subscribe" in the menu\n🔄 **Payment Issues:** Make sure you have funds in your Airtel Money account\n❌ **Cancel:** Go to Account → Subscription → Cancel\n\nNeed more help? Email us at support@unrulymovies.com`
            },
            'account': {
                user: 'I have an account issue',
                bot: `For account issues:\n\n🔑 **Forgot Password:** Click "Forgot Password" on login page\n📧 **Change Email:** Go to Account Settings\n🗑️ **Delete Account:** Email us at support@unrulymovies.com\n\nMake sure to check your spam folder for our emails!`
            },
            'request': {
                user: 'I want to request a movie',
                bot: `We'd love to add more movies! Here's how to request:\n\n1️⃣ Go to the main menu\n2️⃣ Click "Request Movie"\n3️⃣ Enter the movie name and details\n\nWe try to add requested movies within 2-4 weeks if they're available with Luganda translation. Popular requests get priority! 🎬`
            }
        };
        
        const response = responses[type];
        if (response) {
            this.addMessage(response.user, 'user');
            setTimeout(() => {
                this.addMessage(response.bot, 'bot');
            }, 500);
        }
    }
    
    sendMessage(message) {
        this.addMessage(message, 'user');
        
        // Auto-response
        setTimeout(() => {
            this.addMessage(`Thanks for your message! Our team will get back to you within 24 hours. For urgent issues, email us at support@unrulymovies.com`, 'bot');
            
            // Save message for follow-up
            this.saveMessage(message);
        }, 1000);
    }
    
    addMessage(text, type) {
        const messagesContainer = this.widget.querySelector('.support-messages');
        const quickReplies = messagesContainer.querySelector('.quick-replies');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `support-message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <p>${text.replace(/\n/g, '<br>')}</p>
            </div>
        `;
        
        // Remove quick replies after first user message
        if (type === 'user' && quickReplies) {
            quickReplies.remove();
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    saveMessage(message) {
        // Save to localStorage for later
        const messages = JSON.parse(localStorage.getItem('supportMessages') || '[]');
        messages.push({
            message,
            url: window.location.href,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('supportMessages', JSON.stringify(messages));
    }
    
    createStyles() {
        if (document.getElementById('support-widget-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'support-widget-styles';
        style.textContent = `
            #support-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .support-btn {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #66BB6A, #4CAF50);
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                box-shadow: 0 4px 20px rgba(102, 187, 106, 0.4);
                transition: transform 0.3s, box-shadow 0.3s;
                position: relative;
            }
            .support-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 30px rgba(102, 187, 106, 0.6);
            }
            .support-btn.active {
                transform: scale(0.95);
            }
            .support-btn-icon {
                position: relative;
                z-index: 1;
            }
            .support-btn-pulse {
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: inherit;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { transform: scale(1); opacity: 0.6; }
                100% { transform: scale(1.5); opacity: 0; }
            }
            .support-notification {
                position: absolute;
                top: -5px;
                right: -5px;
                width: 22px;
                height: 22px;
                background: #ff4444;
                border-radius: 50%;
                font-size: 12px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #0d0d14;
            }
            
            .support-window {
                position: absolute;
                bottom: 70px;
                right: 0;
                width: 350px;
                max-height: 500px;
                background: #1a1a2e;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                animation: slideUp 0.3s ease;
            }
            .support-window.hidden {
                display: none;
            }
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .support-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px;
                background: linear-gradient(135deg, #66BB6A, #4CAF50);
                color: #fff;
            }
            .support-header-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .support-avatar {
                width: 40px;
                height: 40px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                position: relative;
            }
            .online-dot {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 12px;
                height: 12px;
                background: #00ff00;
                border-radius: 50%;
                border: 2px solid #66BB6A;
            }
            .support-header-text h4 {
                margin: 0;
                font-size: 14px;
            }
            .support-status {
                font-size: 11px;
                opacity: 0.9;
            }
            .support-close {
                background: none;
                border: none;
                color: #fff;
                font-size: 28px;
                cursor: pointer;
                opacity: 0.8;
                transition: opacity 0.2s;
            }
            .support-close:hover {
                opacity: 1;
            }
            
            .support-tabs {
                display: flex;
                background: rgba(0,0,0,0.2);
            }
            .support-tab {
                flex: 1;
                padding: 12px;
                background: none;
                border: none;
                color: #888;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
                border-bottom: 2px solid transparent;
            }
            .support-tab:hover {
                color: #fff;
                background: rgba(255,255,255,0.05);
            }
            .support-tab.active {
                color: #66BB6A;
                border-bottom-color: #66BB6A;
            }
            
            .support-content {
                flex: 1;
                overflow: hidden;
            }
            .support-tab-content {
                display: none;
                height: 100%;
            }
            .support-tab-content.active {
                display: flex;
                flex-direction: column;
            }
            
            .support-messages {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
                max-height: 250px;
            }
            .support-message {
                margin-bottom: 15px;
                display: flex;
            }
            .support-message.bot {
                justify-content: flex-start;
            }
            .support-message.user {
                justify-content: flex-end;
            }
            .message-bubble {
                max-width: 80%;
                padding: 10px 15px;
                border-radius: 15px;
                font-size: 13px;
                line-height: 1.4;
            }
            .support-message.bot .message-bubble {
                background: rgba(255,255,255,0.1);
                color: #fff;
                border-bottom-left-radius: 5px;
            }
            .support-message.user .message-bubble {
                background: linear-gradient(135deg, #66BB6A, #4CAF50);
                color: #fff;
                border-bottom-right-radius: 5px;
            }
            .message-bubble p {
                margin: 0 0 5px;
            }
            .message-bubble p:last-child {
                margin: 0;
            }
            
            .quick-replies {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                padding: 10px 0;
            }
            .quick-reply {
                padding: 8px 12px;
                background: rgba(102, 187, 106, 0.1);
                border: 1px solid rgba(102, 187, 106, 0.3);
                border-radius: 20px;
                color: #66BB6A;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .quick-reply:hover {
                background: rgba(102, 187, 106, 0.2);
            }
            
            .support-form {
                display: flex;
                padding: 10px;
                background: rgba(0,0,0,0.2);
                gap: 10px;
            }
            .support-input {
                flex: 1;
                padding: 10px 15px;
                background: rgba(255,255,255,0.1);
                border: none;
                border-radius: 20px;
                color: #fff;
                font-size: 13px;
            }
            .support-input::placeholder {
                color: #888;
            }
            .support-input:focus {
                outline: none;
                background: rgba(255,255,255,0.15);
            }
            .support-send {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #66BB6A;
                border: none;
                color: #fff;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s;
            }
            .support-send:hover {
                transform: scale(1.1);
            }
            
            /* FAQ Tab */
            .faq-list {
                padding: 15px;
                overflow-y: auto;
                max-height: 300px;
            }
            .faq-item {
                margin-bottom: 10px;
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
            }
            .faq-item summary {
                padding: 12px 15px;
                cursor: pointer;
                color: #fff;
                font-size: 13px;
                font-weight: 500;
                list-style: none;
                position: relative;
            }
            .faq-item summary::after {
                content: '+';
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 18px;
                color: #66BB6A;
            }
            .faq-item[open] summary::after {
                content: '-';
            }
            .faq-item p {
                padding: 0 15px 12px;
                margin: 0;
                color: #aaa;
                font-size: 12px;
                line-height: 1.5;
            }
            
            /* Contact Tab */
            .contact-options {
                padding: 15px;
            }
            .contact-option {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: rgba(255,255,255,0.05);
                border-radius: 10px;
                text-decoration: none;
                color: #fff;
                margin-bottom: 10px;
                transition: all 0.2s;
            }
            .contact-option:hover {
                background: rgba(255,255,255,0.1);
                transform: translateX(5px);
            }
            .contact-icon {
                font-size: 24px;
            }
            .contact-info strong {
                display: block;
                font-size: 13px;
            }
            .contact-info span {
                font-size: 11px;
                color: #888;
            }
            .contact-option.whatsapp:hover {
                background: rgba(37, 211, 102, 0.1);
            }
            .contact-option.telegram:hover {
                background: rgba(0, 136, 204, 0.1);
            }
            
            .hidden {
                display: none !important;
            }
            
            @media (max-width: 480px) {
                #support-widget {
                    bottom: 15px;
                    right: 15px;
                }
                .support-btn {
                    width: 55px;
                    height: 55px;
                }
                .support-window {
                    width: calc(100vw - 30px);
                    right: 0;
                    bottom: 65px;
                    max-height: 400px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    // Don't show on admin pages
    if (!window.location.pathname.includes('admin')) {
        setTimeout(() => {
            window.liveChatWidget = new LiveChatWidget({
                // Add your Tawk.to property ID here for real live chat:
                // tawkPropertyId: 'YOUR_TAWK_PROPERTY_ID'
                useCustomWidget: true
            });
        }, 3000);
    }
});

// Export
window.LiveChatWidget = LiveChatWidget;
