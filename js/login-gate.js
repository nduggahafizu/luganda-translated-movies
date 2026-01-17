/**
 * Login Gate for Video Player
 * Full screen overlay requiring users to login/signup before watching movies
 * Style inspired by KPSounds
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
        this.createOverlay();
        this.addStyles();
        this.blockVideo();
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'login-gate';
        this.overlay.className = 'login-gate-overlay';
        this.overlay.innerHTML = `
            <div class="gate-icon">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <h2 class="gate-title">Members Only</h2>
            <p class="gate-message">This content is only for members. <a href="/login.html" class="gate-link" onclick="loginGate.saveRedirect()">Login</a>, <a href="/register.html" class="gate-link" onclick="loginGate.saveRedirect()">Register</a></p>
        `;
        
        // Insert into the video container area
        const embedContainer = document.querySelector('#playerWrapper, .player-wrapper, .embed-player-container, .video-container');
        if (embedContainer) {
            embedContainer.style.position = 'relative';
            embedContainer.innerHTML = ''; // Clear the player content
            embedContainer.appendChild(this.overlay);
        } else {
            // Fallback: fixed position overlay
            this.overlay.classList.add('fixed-overlay');
            document.body.appendChild(this.overlay);
        }
    }
    
    blockVideo() {
        // Hide video/iframe elements
        const checkMedia = setInterval(() => {
            const video = document.querySelector('video');
            const iframe = document.querySelector('.embed-player-container iframe, .video-container iframe');
            
            if (video) {
                video.style.display = 'none';
                clearInterval(checkMedia);
            }
            if (iframe) {
                iframe.style.display = 'none';
                clearInterval(checkMedia);
            }
        }, 500);
        
        // Stop after 10 seconds
        setTimeout(() => clearInterval(checkMedia), 10000);
        
        // Track
        if (typeof gtag === 'function') {
            gtag('event', 'login_gate_shown');
        }
    }
    
    saveRedirect() {
        localStorage.setItem('redirectAfterLogin', window.location.href);
    }
    
    goToLogin() {
        this.saveRedirect();
        window.location.href = '/login.html';
    }
    
    goToSignup() {
        this.saveRedirect();
        window.location.href = '/register.html';
    }
    
    addStyles() {
        if (document.getElementById('login-gate-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'login-gate-styles';
        style.textContent = `
            .login-gate-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 100;
                min-height: 300px;
                border-radius: 12px;
            }
            .login-gate-overlay.fixed-overlay {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 600px;
                height: auto;
                padding: 60px 40px;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            }
            .gate-icon {
                color: #888;
                margin-bottom: 20px;
            }
            .gate-icon svg {
                width: 60px;
                height: 60px;
            }
            .gate-title {
                color: #fff;
                font-size: 28px;
                font-weight: 700;
                margin: 0 0 15px 0;
                text-align: center;
            }
            .gate-message {
                color: #888;
                font-size: 16px;
                margin: 0;
                text-align: center;
            }
            .gate-link {
                color: #fff;
                font-weight: 700;
                text-decoration: none;
                transition: color 0.2s;
            }
            .gate-link:hover {
                color: #7CFC00;
                text-decoration: underline;
            }
            @media (max-width: 480px) {
                .login-gate-overlay {
                    padding: 40px 20px;
                    min-height: 250px;
                }
                .gate-icon svg {
                    width: 50px;
                    height: 50px;
                }
                .gate-title {
                    font-size: 22px;
                }
                .gate-message {
                    font-size: 14px;
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
