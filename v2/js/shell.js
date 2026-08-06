/* ============================================
   V2 Preview — Shared App Shell
   Renders the header, sidebar/drawer, and footer
   that are identical across every v2 page. Must
   run BEFORE js/main.js so #menuToggle / #aside /
   #drawerProfile exist when main.js wires them up.
============================================ */

(function () {
    'use strict';

    const MAIN_NAV = [
        { id: 'home', href: '/v2/index.html', label: 'Home', icon: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>' },
        { id: 'movies', href: '/v2/movies.html', label: 'Movies', icon: '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line>' },
        { id: 'series', href: '/v2/series.html', label: 'Series', icon: '<rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M7 7V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3"></path>' },
        { id: 'trending', href: '/v2/trending.html', label: 'Trending', icon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>' },
        { id: 'search', href: '/v2/search.html', label: 'Search', icon: '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>' },
        { id: 'genres', href: '/v2/genres.html', label: 'Genres', icon: '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect>' },
        { id: 'vjs', href: '/v2/vjs.html', label: 'VJ Translators', icon: '<path d="M23 19a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><path d="M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path><path d="M1 19a6 6 0 0 1 12 0"></path>' },
        { id: 'ugandatv', href: '/v2/uganda-tv.html', label: 'Uganda TV', icon: '<rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="7" x2="12" y2="22"></line>' }
    ];

    const ACCOUNT_NAV = [
        { id: 'watchlist', href: '/v2/watchlist.html', label: 'Watchlist', icon: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>' },
        { id: 'history', href: '/v2/history.html', label: 'History', icon: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>' },
        { id: 'settings', href: '/v2/settings.html', label: 'Settings', icon: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' }
    ];

    function navItemHTML(item, activeId) {
        return `
                        <li class="${item.id === activeId ? 'active' : ''}">
                            <a href="${item.href}">
                                <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${item.icon}</svg>
                                ${item.label}
                            </a>
                        </li>`;
    }

    function headerHTML() {
        return `
            <div class="app-header">
                <div class="navbar navbar-expand-lg">
                    <div class="menu" id="menuToggle" role="button" aria-label="Open navigation menu" tabindex="0">
                        <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </div>
                    <div class="app-navbar">
                        <a href="/index.html" class="navbar-brand">
                            <img src="/assets/images/logo-wordmark.png" alt="Unruly Movies">
                        </a>
                    </div>
                    <div class="search-btn d-md-none d-block" id="mobileSearchBtn">
                        <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </div>

                    <!-- Mobile Search Form -->
                    <form class="mobile-search-form" id="mobileSearchForm" method="get" action="/v2/search.html">
                        <input type="text" name="q" placeholder="Search movies, VJs..." class="mobile-search-input" id="mobileSearchInput" required>
                        <button type="submit" class="mobile-search-submit" title="Search">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                        </button>
                        <button type="button" class="mobile-search-close" id="mobileSearchClose" title="Close search">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </form>

                    <form class="header-search input-group d-md-block d-none" method="get" action="/v2/search.html">
                        <div class="typeahead__container app-search">
                            <div class="typeahead__field">
                                <div class="typeahead__query">
                                    <label for="search-input" class="btn px-0 mb-0" aria-label="Search">
                                        <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <path d="m21 21-4.35-4.35"></path>
                                        </svg>
                                    </label>
                                    <input class="video-search form-control" name="q" type="text" id="search-input" placeholder="Search Luganda movies, VJs..." autocomplete="off">
                                </div>
                            </div>
                        </div>
                    </form>

                    <ul class="navbar-nav navbar-user ml-auto align-items-center text-nowrap">
                        <li class="nav-item">
                            <a class="nav-link btn-login" href="/login.html">Login</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link btn-register" href="/register.html">Sign Up</a>
                        </li>
                    </ul>
                </div>
            </div>`;
    }

    function asideHTML(activeId) {
        return `
                <div class="app-aside nav-aside" id="aside">
                    <button class="modal-close" data-dismiss="modal" aria-label="Close menu" title="Close menu">
                        <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    <div class="drawer-logo">
                        <span class="drawer-logo-text">Unruly Movies</span>
                    </div>

                    <!-- Profile Card -->
                    <a href="/login.html" class="drawer-profile" id="drawerProfile">
                        <div class="dp-circle">
                            <img src="" alt="" class="d-none" id="drawerProfileAvatar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="drawerProfileIcon">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div class="dp-info">
                            <h4 id="drawerProfileName">Sign In</h4>
                            <p id="drawerProfileSub">Tap to access your account</p>
                        </div>
                        <svg class="dp-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </a>

                    <ul class="nav">${MAIN_NAV.map(item => navItemHTML(item, activeId)).join('')}
                    </ul>

                    <div class="nav-section-label">My Account</div>
                    <ul class="nav">${ACCOUNT_NAV.map(item => navItemHTML(item, activeId)).join('')}
                    </ul>
                </div>`;
    }

    function footerHTML() {
        return `
                <footer class="site-footer">
                    <div class="footer-main">
                        <div class="footer-grid">
                            <div class="footer-brand">
                                <a href="/index.html" class="footer-logo">
                                    <img src="/assets/images/logo-wordmark.png" alt="Unruly Movies">
                                </a>
                                <p class="footer-tagline">Uganda's premier platform for Luganda VJ translated movies.</p>
                            </div>
                            <div class="footer-links">
                                <h4>Quick Links</h4>
                                <ul>
                                    <li><a href="/v2/index.html">Home</a></li>
                                    <li><a href="/v2/movies.html">Browse Movies</a></li>
                                    <li><a href="/v2/series.html">Series</a></li>
                                    <li><a href="/v2/vjs.html">VJ Translators</a></li>
                                    <li><a href="/v2/genres.html">Genres</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="footer-bottom">
                        <p>Copyright © 2026 Unruly Movies — V2 Preview Build</p>
                    </div>
                </footer>`;
    }

    window.AppShell = {
        mount: function (activeId) {
            const headerEl = document.getElementById('shellHeader');
            const asideEl = document.getElementById('shellAside');
            const footerEl = document.getElementById('shellFooter');
            if (headerEl) headerEl.outerHTML = headerHTML();
            if (asideEl) asideEl.outerHTML = asideHTML(activeId);
            if (footerEl) footerEl.outerHTML = footerHTML();
        }
    };
})();
