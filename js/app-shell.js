// Injects the floating bottom navigation bar on mobile and wires it up.
(function () {
    const navItems = [
        {
            href: 'index.html',
            label: 'Home',
            match: ['/', '/index.html'],
            icon: '<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H4a1 1 0 0 1-1-1Z"/>'
        },
        {
            href: 'movies.html',
            label: 'Movies',
            match: ['/movies.html'],
            icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 9h4M17 9h4M3 15h4M17 15h4"/>'
        },
        {
            href: 'series.html',
            label: 'Series',
            match: ['/series.html', '/series-player.html'],
            icon: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M7 7V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3"/>'
        },
        {
            href: 'trending.html',
            label: 'Trending',
            match: ['/trending.html'],
            icon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'
        },
        {
            href: 'search.html',
            label: 'Search',
            match: ['/search.html'],
            icon: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
            menuFallback: true
        },
        {
            href: '#',
            label: 'Menu',
            match: [],
            icon: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
            isMenu: true
        }
    ];

    function buildNav() {
        const path = window.location.pathname;
        const hasDrawer = !!document.getElementById('menuToggle');
        const visibleItems = navItems.filter(item => {
            if (item.isMenu) return hasDrawer;
            if (item.menuFallback) return !hasDrawer;
            return true;
        });

        const nav = document.createElement('nav');
        nav.className = 'app-bottom-nav';
        nav.setAttribute('aria-label', 'Primary');

        nav.innerHTML = visibleItems.map(item => {
            const isActive = item.match.some(m => path === m || path.endsWith(m));
            return `
                <a href="${item.href}" class="nav-item${isActive ? ' active' : ''}"${item.isMenu ? ' id="appBottomNavMenu"' : ''}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg>
                    <span>${item.label}</span>
                </a>
            `;
        }).join('');

        document.body.appendChild(nav);
        document.body.classList.add('has-app-bottom-nav');

        const menuLink = document.getElementById('appBottomNavMenu');
        if (menuLink) {
            menuLink.addEventListener('click', function (e) {
                e.preventDefault();
                const menuToggle = document.getElementById('menuToggle');
                if (menuToggle) menuToggle.click();
            });
        }
    }

    // ---------- Shared sidebar ----------
    // Each page used to hand-copy its own sidebar, so they drifted apart
    // (the home page had ~20 links in 5 sections, Movies had 4). This
    // rebuilds every app page's sidebar from one list so they all match.
    // index.html keeps its own hand-written copy of this same list (marked
    // data-canonical-sidebar) because inline scripts there adjust its Get
    // App item for iPhone/installed-app users before this file runs —
    // keep the two in sync when changing either.
    const ICONS = {
        home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
        movies: '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>',
        tv: '<rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>',
        trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
        download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
        grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
        users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
        user: '<circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>',
        login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
        mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
        info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
        doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'
    };

    const SIDEBAR_SECTIONS = [
        { header: 'Menu', items: [
            { href: 'index.html', label: 'Home', icon: 'home', match: ['/', '/index.html'] },
            { href: 'movies.html', label: 'Movies', icon: 'movies', match: ['/movies.html'] },
            { href: 'series.html', label: 'TV Shows', icon: 'tv', match: ['/series.html', '/series-player.html'] },
            { href: 'trending.html', label: 'Trending', icon: 'trending', match: ['/trending.html'] },
            { href: 'uganda-tv.html', label: 'TV Channels', icon: 'tv', match: ['/uganda-tv.html'] }
        ] },
        { header: 'Discovery', items: [
            { href: 'https://play.google.com/store/apps/details?id=com.unruly.movies', label: 'Get the App', icon: 'download', external: true, highlight: true, id: 'getAppItem' },
            { href: 'genres.html', label: 'Categories', icon: 'grid', match: ['/genres.html'] },
            { href: 'vjs.html', label: 'VJ Translators', icon: 'users', match: ['/vjs.html', '/vj.html'] },
            { href: 'search.html', label: 'Search', icon: 'search', match: ['/search.html'] }
        ] },
        { header: 'Popular VJs', items: [
            { href: 'vj.html?name=VJ Junior', label: 'VJ Junior', icon: 'user' },
            { href: 'vj.html?name=VJ Ice P', label: 'VJ Ice P', icon: 'user' },
            { href: 'vj.html?name=VJ Emmy', label: 'VJ Emmy', icon: 'user' },
            { href: 'vj.html?name=VJ Jingo', label: 'VJ Jingo', icon: 'user' }
        ] },
        { header: 'Account', items: [
            { href: 'profile.html', label: 'My Dashboard', icon: 'grid', match: ['/profile.html'] },
            { href: 'login.html', label: 'Login / Register', icon: 'login', id: 'sidebarLoginItem', match: ['/login.html'] }
        ] },
        { header: 'Help', items: [
            { href: 'contact.html', label: 'Contact Us', icon: 'mail', match: ['/contact.html'] },
            { href: 'about.html', label: 'About Us', icon: 'info', match: ['/about.html'] },
            { href: 'terms.html', label: 'Terms & Privacy', icon: 'doc', match: ['/terms.html', '/privacy-policy.html'] }
        ] }
    ];

    function buildSidebar() {
        const aside = document.getElementById('aside');
        if (!aside || aside.hasAttribute('data-canonical-sidebar')) return;

        const path = window.location.pathname;
        const loggedIn = !!(localStorage.getItem('token') || localStorage.getItem('authToken') ||
                            sessionStorage.getItem('token') || sessionStorage.getItem('authToken'));
        const isInstalledApp = window.navigator.standalone === true ||
                               window.matchMedia('(display-mode: standalone)').matches;

        aside.querySelectorAll(':scope > ul.nav').forEach(ul => ul.remove());

        const html = SIDEBAR_SECTIONS.map(section => {
            const items = section.items.map(item => {
                if (item.id === 'sidebarLoginItem' && loggedIn) return '';
                if (item.id === 'getAppItem' && isInstalledApp) return '';
                const active = (item.match || []).some(m => path === m || path.endsWith(m));
                const style = item.highlight ? ' style="background: rgba(124,252,0,0.15); color: #7cfc00; border-radius: 8px;"' : '';
                const ext = item.external ? ' target="_blank" rel="noopener"' : '';
                return `<li${item.id ? ` id="${item.id}"` : ''}${active ? ' class="active"' : ''}>` +
                    `<a href="${item.href}"${ext}${style}>` +
                    `<svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ICONS[item.icon]}</svg>` +
                    `${item.label}</a></li>`;
            }).join('');
            return `<ul class="nav"><li class="nav-header">${section.header}</li>${items}</ul>`;
        }).join('');

        const profile = aside.querySelector('.drawer-profile');
        if (profile) profile.insertAdjacentHTML('afterend', html);
        else aside.insertAdjacentHTML('beforeend', html);
    }

    function init() {
        buildNav();
        buildSidebar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
