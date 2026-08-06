/* ============================================
   V2 Preview — Settings page
============================================ */

(function () {
    'use strict';

    const accountContent = document.getElementById('accountContent');
    const clearCacheBtn = document.getElementById('clearCacheBtn');

    function renderAccount() {
        const user = getCurrentUser();
        if (user) {
            accountContent.innerHTML = `
                <div class="v2-settings-row">
                    <span class="label">Name</span>
                    <span class="value">${V2.escapeHtml(user.name || user.fullName || 'User')}</span>
                </div>
                <div class="v2-settings-row">
                    <span class="label">Email</span>
                    <span class="value">${V2.escapeHtml(user.email || '')}</span>
                </div>
                <div class="v2-settings-row">
                    <span class="label">Logout</span>
                    <button class="v2-btn v2-btn-outline" id="logoutBtn">Logout</button>
                </div>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => {
                clearAuthData();
                V2.showToast('Logged out successfully', 'success');
                setTimeout(() => { window.location.href = '/v2/index.html'; }, 500);
            });
        } else {
            accountContent.innerHTML = `
                <div class="v2-settings-row">
                    <span class="label">You're not signed in</span>
                    <div style="display:flex; gap:10px;">
                        <a class="v2-btn v2-btn-outline" href="/login.html">Sign In</a>
                        <a class="v2-btn v2-btn-primary" href="/register.html">Create Account</a>
                    </div>
                </div>
            `;
        }
    }

    clearCacheBtn.addEventListener('click', () => {
        Object.keys(localStorage)
            .filter(key => key.startsWith('movies_cache_'))
            .forEach(key => localStorage.removeItem(key));
        V2.showToast('Cache cleared', 'success');
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderAccount);
    } else {
        renderAccount();
    }
})();
