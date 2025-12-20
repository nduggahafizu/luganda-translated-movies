/* ===================================
   Unruly Movies - Authentication System
   Features: Google Sign-In, Remember Me, Persistent Login
   =================================== */

// Configuration - Uses Config.js for environment-aware URLs
const API_URL = window.Config ? window.Config.authUrl : 'http://localhost:5000/api/auth';
const GOOGLE_CLIENT_ID = window.Config ? window.Config.GOOGLE_CLIENT_ID : '573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com';

// Initialize Google Sign-In
function initGoogleSignIn() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true
        });
        
        // Render Google button
        const googleBtnDiv = document.getElementById('google-signin-btn');
        if (googleBtnDiv) {
            google.accounts.id.renderButton(
                googleBtnDiv,
                {
                    theme: 'filled_black',
                    size: 'large',
                    width: '100%',
                    text: 'continue_with',
                    shape: 'rectangular'
                }
            );
        }
    }
}

// Handle Google Sign-In
async function handleGoogleSignIn(response) {
    try {
        showLoading(true);
        
        // Send Google token to backend
        const authUrl = window.Config ? window.Config.getApiUrl('/auth/google') : `${API_URL}/google`;
        const res = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: response.credential
            })
        });
        
        const data = await res.json();
        
        if (data.status === 'success') {
            // Save auth data
            saveAuthData(data.data.token, data.data.user, true);
            
            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showNotification(data.message || 'Google sign-in failed', 'error');
        }
    } catch (error) {
        console.error('Google sign-in error:', error);
        showNotification('Error signing in with Google', 'error');
    } finally {
        showLoading(false);
    }
}

// Save authentication data
function saveAuthData(token, user, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // Save token
    storage.setItem('token', token);
    
    // Save user data
    storage.setItem('user', JSON.stringify(user));
    
    // Save remember me preference
    if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
    }
    
    // Set expiry (7 days for remember me, session for regular)
    if (rememberMe) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        storage.setItem('tokenExpiry', expiryDate.toISOString());
    }
}

// Get authentication token
function getAuthToken() {
    // Check localStorage first (remember me)
    let token = localStorage.getItem('token');
    
    // Check if token is expired
    const expiry = localStorage.getItem('tokenExpiry');
    if (expiry && new Date(expiry) < new Date()) {
        // Token expired, clear storage
        clearAuthData();
        return null;
    }
    
    // If not in localStorage, check sessionStorage
    if (!token) {
        token = sessionStorage.getItem('token');
    }
    
    return token;
}

// Get current user
function getCurrentUser() {
    let user = localStorage.getItem('user');
    if (!user) {
        user = sessionStorage.getItem('user');
    }
    return user ? JSON.parse(user) : null;
}

// Check if user is logged in
function isLoggedIn() {
    return !!getAuthToken();
}

// Clear authentication data
function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('tokenExpiry');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
}

// Logout
function logout() {
    clearAuthData();
    showNotification('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Regular email/password login
async function loginWithEmail(email, password, rememberMe) {
    try {
        showLoading(true);
        
        const loginUrl = window.Config ? window.Config.getApiUrl('/auth/login') : `${API_URL}/login`;
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Save auth data
            saveAuthData(data.data.token, data.data.user, rememberMe);
            
            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Error logging in. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Register with email/password
async function registerWithEmail(fullName, email, password) {
    try {
        showLoading(true);
        
        const registerUrl = window.Config ? window.Config.getApiUrl('/auth/register') : `${API_URL}/register`;
        const response = await fetch(registerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fullName, email, password })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Save auth data (auto-login after registration)
            saveAuthData(data.data.token, data.data.user, true);
            
            showNotification('Registration successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showNotification(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Error registering. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Update UI based on auth state
function updateAuthUI() {
    const user = getCurrentUser();
    const token = getAuthToken();
    
    if (user && token) {
        // User is logged in
        const loginBtn = document.querySelector('.btn-login');
        const registerBtn = document.querySelector('.btn-register');
        
        if (loginBtn && registerBtn) {
            // Replace login/register buttons with user menu
            const navUser = document.querySelector('.navbar-user');
            if (navUser) {
                navUser.innerHTML = `
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-toggle="dropdown">
                            <div class="avatar avatar-sm">${user.fullName.charAt(0).toUpperCase()}</div>
                            <span class="d-none d-md-inline ml-2">${user.fullName}</span>
                        </a>
                        <div class="dropdown-menu dropdown-menu-right">
                            <a class="dropdown-item" href="profile.html">Profile</a>
                            <a class="dropdown-item" href="subscribe.html">Subscription</a>
                            <div class="dropdown-divider"></div>
                            <a class="dropdown-item" href="#" onclick="logout(); return false;">Logout</a>
                        </div>
                    </div>
                `;
            }
        }
    }
}

// Show loading state
function showLoading(show) {
    const submitBtns = document.querySelectorAll('button[type="submit"]');
    submitBtns.forEach(btn => {
        btn.disabled = show;
        btn.textContent = show ? 'Please wait...' : btn.getAttribute('data-original-text') || 'Submit';
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#7CFC00' : type === 'error' ? '#ff4444' : '#00D9FF'};
        color: ${type === 'success' || type === 'error' ? '#000' : '#fff'};
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Google Sign-In
    initGoogleSignIn();
    
    // Update UI based on auth state
    updateAuthUI();
    
    // Redirect if already logged in (for login/register pages)
    if ((window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) && isLoggedIn()) {
        window.location.href = 'index.html';
    }
    
    // Protect pages that require authentication
    const protectedPages = ['profile.html', 'payment.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !isLoggedIn()) {
        showNotification('Please login to continue', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
});

// Export functions for use in HTML
window.loginWithEmail = loginWithEmail;
window.registerWithEmail = registerWithEmail;
window.logout = logout;
window.isLoggedIn = isLoggedIn;
window.getCurrentUser = getCurrentUser;
window.getAuthToken = getAuthToken;
