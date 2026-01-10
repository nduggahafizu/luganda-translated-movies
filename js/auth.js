/* ===================================
   Unruly Movies - Authentication System
   Features: Google Sign-In, Remember Me, Persistent Login
   =================================== */

// Configuration - Uses centralized config
const API_URL = API_CONFIG.API_ENDPOINTS.AUTH;
const GOOGLE_CLIENT_ID = API_CONFIG.GOOGLE_CLIENT_ID;

// Initialize Google Sign-In with retry logic
let googleInitRetries = 0;
const MAX_GOOGLE_RETRIES = 5; // Reduced from 10

function initGoogleSignIn() {
    const googleBtnDiv = document.getElementById('google-signin-btn');
    
    // Only try to init Google Sign-In if the button container exists
    if (!googleBtnDiv) {
        return; // No Google button on this page, skip silently
    }
    
    // Check if Google API is loaded
    if (typeof google !== 'undefined' && google.accounts) {
        try {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleSignIn,
                auto_select: false,
                cancel_on_tap_outside: true
            });
            
            // Render Google button
            googleBtnDiv.innerHTML = ''; // Clear any existing content
            google.accounts.id.renderButton(
                googleBtnDiv,
                {
                    theme: 'filled_black',
                    size: 'large',
                    width: googleBtnDiv.offsetWidth || 280,
                    text: 'continue_with',
                    shape: 'rectangular'
                }
            );
            console.log('Google Sign-In initialized successfully');
        } catch (error) {
            console.error('Google Sign-In init error:', error);
            showGoogleFallback(googleBtnDiv);
        }
    } else {
        // Google API not loaded yet, retry
        retryGoogleInit();
    }
}

function retryGoogleInit() {
    const googleBtnDiv = document.getElementById('google-signin-btn');
    if (!googleBtnDiv) return; // No button, skip
    
    googleInitRetries++;
    if (googleInitRetries < MAX_GOOGLE_RETRIES) {
        // Only log every 2nd retry to reduce console noise
        if (googleInitRetries % 2 === 0) {
            console.log(`Google API loading... (${googleInitRetries}/${MAX_GOOGLE_RETRIES})`);
        }
        setTimeout(initGoogleSignIn, 500);
    } else {
        console.warn('Google Sign-In unavailable - using fallback');
        showGoogleFallback(googleBtnDiv);
    }
}

function showGoogleFallback(container) {
    if (!container) return;
    container.innerHTML = `
        <button type="button" class="social-btn google-fallback" onclick="location.reload()" 
            style="width:100%;padding:12px;background:#4285f4;color:#fff;border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
            <svg style="width:20px;height:20px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Retry Google Sign-In
        </button>
    `;
}

// Handle Google Sign-In
async function handleGoogleSignIn(response) {
    try {
        showLoading(true);
        
        // Send Google token to backend
        const res = await fetch(`${API_URL}/google`, {
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
    // Normalize user data to have consistent field names
    const normalizedUser = {
        id: user.id || user._id,
        fullName: user.fullName || user.name || 'User',
        name: user.fullName || user.name || 'User', // Alias for compatibility
        email: user.email,
        picture: user.picture || user.profileImage,
        profileImage: user.picture || user.profileImage, // Alias for compatibility
        subscription: user.subscription,
        verified: user.verified,
        role: user.role || 'user' // Default to 'user' if not provided
    };
    
    // Always save to localStorage for persistence (especially on mobile)
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    
    // Also save to sessionStorage as backup
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(normalizedUser));
    
    // Save remember me preference
    localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');
    
    // No expiry - tokens are permanent
    localStorage.removeItem('tokenExpiry');
}

// Get authentication token
function getAuthToken() {
    // Check localStorage first (remember me)
    let token = localStorage.getItem('token');
    
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
    console.log('Logging out...');
    clearAuthData();
    showNotification('Logged out successfully', 'success');
    
    // Use a more reliable redirect
    setTimeout(() => {
        // Force full page navigation to login
        window.location.replace('login.html');
    }, 500);
}

// Regular email/password login
async function loginWithEmail(email, password, rememberMe) {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_URL}/login`, {
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
        
        const response = await fetch(`${API_URL}/register`, {
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
    
    // Get all login/register buttons (might have multiple across pages)
    const loginBtns = document.querySelectorAll('.btn-login');
    const registerBtns = document.querySelectorAll('.btn-register');
    const sidebarLoginItem = document.getElementById('sidebarLoginItem');
    const userMenu = document.getElementById('userMenu');
    const navbarUser = document.querySelector('.navbar-user');
    
    if (user && token) {
        // User is logged in - hide login/register buttons
        loginBtns.forEach(btn => {
            const parent = btn.closest('.nav-item') || btn.parentElement;
            if (parent) parent.style.display = 'none';
        });
        registerBtns.forEach(btn => {
            const parent = btn.closest('.nav-item') || btn.parentElement;
            if (parent) parent.style.display = 'none';
        });
        if (sidebarLoginItem) sidebarLoginItem.style.display = 'none';
        
        // Show user menu if it exists
        if (userMenu) userMenu.classList.remove('d-none');
        
        // For pages using navbar-user class, replace with user dropdown
        if (navbarUser && !userMenu) {
            navbarUser.innerHTML = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-toggle="dropdown">
                        <div class="avatar avatar-sm" style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7CFC00,#00D9FF);display:flex;align-items:center;justify-content:center;font-weight:bold;color:#000;">${(user.fullName || user.name || 'U').charAt(0).toUpperCase()}</div>
                        <span class="d-none d-md-inline ml-2">${(user.fullName || user.name || 'User').split(' ')[0]}</span>
                    </a>
                    <div class="dropdown-menu dropdown-menu-right" style="background:#1a1a2e;border:1px solid rgba(255,255,255,0.1);">
                        <a class="dropdown-item" href="dashboard.html" style="color:#fff;">Dashboard</a>
                        <a class="dropdown-item" href="profile.html" style="color:#fff;">Profile</a>
                        <a class="dropdown-item" href="subscribe.html" style="color:#fff;">Subscription</a>
                        <div class="dropdown-divider" style="border-color:rgba(255,255,255,0.1);"></div>
                        <a class="dropdown-item" href="#" onclick="logout(); return false;" style="color:#ff6b6b;">Logout</a>
                    </div>
                </li>
            `;
        }
    } else {
        // User is not logged in - show login/register buttons
        loginBtns.forEach(btn => {
            const parent = btn.closest('.nav-item') || btn.parentElement;
            if (parent) parent.style.display = '';
        });
        registerBtns.forEach(btn => {
            const parent = btn.closest('.nav-item') || btn.parentElement;
            if (parent) parent.style.display = '';
        });
        if (sidebarLoginItem) sidebarLoginItem.style.display = '';
        if (userMenu) userMenu.classList.add('d-none');
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
    // Debug auth state
    const token = getAuthToken();
    const user = getCurrentUser();
    console.log('Auth Debug - Token exists:', !!token);
    console.log('Auth Debug - User:', user);
    console.log('Auth Debug - isLoggedIn:', isLoggedIn());
    console.log('Auth Debug - Current page:', window.location.pathname);
    
    // Initialize Google Sign-In
    initGoogleSignIn();
    
    // Update UI based on auth state
    updateAuthUI();
    
    // Only redirect if user has VALID token AND user data
    const isOnLoginPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');
    const hasValidAuth = token && user && user.email;
    
    if (isOnLoginPage && hasValidAuth) {
        console.log('Auth Debug - Redirecting logged-in user from login page');
        window.location.href = 'index.html';
    } else if (isOnLoginPage) {
        console.log('Auth Debug - User NOT logged in, staying on login page');
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
window.clearAuthData = clearAuthData;
window.isLoggedIn = isLoggedIn;
window.getCurrentUser = getCurrentUser;
window.getAuthToken = getAuthToken;
