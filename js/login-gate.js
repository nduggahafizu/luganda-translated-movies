/**
 * Login Gate for Video Player
 * Simple banner requiring users to login/signup before watching movies
 */

class LoginGate {
    constructor(options = {}) {
        this.options = {
            allowPreview: false,
            previewDuration: 0,
            ...options
        };
        
        this.isLoggedIn = this.checkLoginStatus();
        
        if (!this.isLoggedIn) {
            this.init();
        }
    }
    
    checkLoginStatus() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        return !!(token && user);
    }
    
    init() {
        this.createBanner();
        this.addStyles();
        this.showBanner();
    }
    
    createBanner() {
        this.banner = document.createElement('div');
        this.banner.id = 'login-gate';
        this.banner.className = 'login-gate-banner';
        this.banner.innerHTML = `
            <div class="gate-content">
                <span class="gate-text">🔒 Sign in to watch this movie</span>
                <div class="gate-buttons">
                    <button class="gate-btn login" onclick="loginGate.goToLogin()">Sign In</button>
                    <button class="gate-btn signup" onclick="loginGate.goToSignup()">Create Account</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.banner);
    }
    
    showBanner() {
        // Block video playback
        const checkVideo = setInterval(() => {
            const video = document.querySelector('video');
            if (video) {
                clearInterval(checkVideo);
                video.pause();
                video.addEventListener('play', (e) => {
                    if (!this.isLoggedIn) {
                        e.preventDefault();
                        video.pause();
                        this.banner.classList.add('shake');
                        setTimeout(() => this.banner.classList.remove('shake'), 500);
                    }
                });
            }
        }, 500);
        
        // Track
        if (typeof gtag === 'function') {
            gtag('event', 'login_gate_shown');
        }
    }
    
    goToLogin() {
        localStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = '/login.html';
    }
    
    goToSignup() {
        localStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = '/signup.html';
    }
    
    addStyles() {
        if (document.getElementById('login-gate-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'login-gate-styles';
        style.textContent = `
            .login-gate-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #1a1a2e 0%, #0d0d14 100%);
                border-top: 2px solid #66BB6A;
                padding: 15px 20px;
                z-index: 10000;
                animation: slideUp 0.3s ease;
            }
            @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }
            .login-gate-banner.shake {
                animation: shake 0.5s ease;
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
            .gate-content {
                max-width: 600px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                flex-wrap: wrap;
            }
            .gate-text {
                color: #fff;
                font-size: 16px;
                font-weight: 500;
            }
            .gate-buttons {
                display: flex;
                gap: 10px;
            }
            .gate-btn {
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                border: none;
                transition: all 0.2s;
            }
            .gate-btn.login {
                background: #66BB6A;
                color: #000;
            }
            .gate-btn.login:hover {
                background: #81C784;
                transform: translateY(-2px);
            }
            .gate-btn.signup {
                background: transparent;
                color: #66BB6A;
                border: 1px solid #66BB6A;
            }
            .gate-btn.signup:hover {
                background: rgba(102, 187, 106, 0.1);
            }
            @media (max-width: 480px) {
                .gate-content {
                    flex-direction: column;
                    text-align: center;
                }
                .gate-text {
                    font-size: 14px;
                }
                .gate-buttons {
                    width: 100%;
                }
                .gate-btn {
                    flex: 1;
                    padding: 12px 15px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Auto-initialize on player pages
let loginGate = null;
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('player')) {
        setTimeout(() => {
            loginGate = new LoginGate();
        }, 500);
    }
});

// Export
window.LoginGate = LoginGate;
