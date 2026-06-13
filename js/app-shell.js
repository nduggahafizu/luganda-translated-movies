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
            match: ['/series.html', '/series-detail.html'],
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildNav);
    } else {
        buildNav();
    }
})();
