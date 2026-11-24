/* ===================================
   Unruly Movies — site theme behaviour
   - Desktop: top menu bar (replaces the left sidebar), with Genre / VJ
     dropdowns and a search button that opens the existing search box.
   - Phones: the menu button opens a drop-down list of the same links.
   - Header turns solid once the page scrolls.
   - Poster rows get left/right arrow buttons.
   - Hero titles get the VJ name after them, in green.
   Works on every page that has the shared .app-header; pairs with
   css/site-theme.css.
   =================================== */
(function () {
    'use strict';

    // Phones and tablets (no mouse) get the big centre buttons on the video players
    try {
        if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
            document.documentElement.classList.add('st-touch');
        }
    } catch (e) { /* very old browser: keep the mouse layout */ }

    // Main pages use .app-header; the movie and series players have their own
    // simpler headers, which get the same menu.
    var header = document.querySelector('.app-header');
    var isPlayerHeader = false;
    if (!header) {
        header = document.querySelector('header#header.header, header.series-header');
        isPlayerHeader = !!header;
    }
    if (!header) return;

    document.documentElement.classList.add('st-theme');
    if (isPlayerHeader) header.classList.add('st-player-header');

    var path = window.location.pathname;
    var GENRES = [
        ['Action', 'action'], ['Comedy', 'comedy'], ['Drama', 'drama'], ['Horror', 'horror'],
        ['Romance', 'romance'], ['Thriller', 'thriller'], ['Sci-Fi', 'science fiction'],
        ['Animation', 'animation'], ['Crime', 'crime'], ['War', 'war']
    ];
    var VJS = ['VJ Junior', 'VJ Ice P', 'VJ Emmy', 'VJ Jingo', 'VJ Soul', 'VJ Mark', 'VJ Ulio', 'VJ Tom'];

    var NAV = [
        { label: 'Movies', href: 'movies.html', match: ['/movies.html'] },
        { label: 'Series', href: 'series.html', match: ['/series.html', '/series-player.html'] },
        { label: 'Trending', href: 'trending.html', match: ['/trending.html'] },
        { label: 'Genre', match: ['/genres.html'], children: GENRES.map(function (g) {
            return [g[0], 'genres.html?genre=' + encodeURIComponent(g[1])];
        }).concat([['All genres', 'genres.html']]) },
        { label: 'VJ', match: ['/vjs.html', '/vj.html'], children: VJS.map(function (v) {
            return [v, 'movies.html?vj=' + encodeURIComponent(v)];
        }).concat([['All VJs', 'vjs.html']]) },
        { label: 'TV Channels', href: 'uganda-tv.html', match: ['/uganda-tv.html'] },
        { label: 'Free movies', href: 'free-movies.html', match: ['/free-movies.html', '/free-movies'], cls: 'st-link-free' }
    ];

    var CHEVRON = '<svg class="st-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
    var SEARCH = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';

    function isActive(item) {
        return (item.match || []).some(function (m) { return path === m || path.endsWith(m); });
    }

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }

    function loggedIn() {
        try {
            return !!(localStorage.getItem('token') || localStorage.getItem('authToken') ||
                      sessionStorage.getItem('token') || sessionStorage.getItem('authToken'));
        } catch (e) { return false; }
    }

    // ---------- Desktop top menu ----------
    function buildTopNav() {
        var navbar = header.querySelector('.navbar') || (isPlayerHeader ? header : null);
        if (!navbar || navbar.querySelector('.st-topnav')) return;

        var ul = document.createElement('ul');
        ul.className = 'st-topnav';
        ul.setAttribute('aria-label', 'Main');
        ul.innerHTML = NAV.map(function (item, i) {
            var active = isActive(item) ? ' st-active' : '';
            if (!item.children) {
                return '<li><a class="st-link' + active + (item.cls ? ' ' + item.cls : '') + '" href="' + item.href + '"' +
                    (active ? ' aria-current="page"' : '') + '>' + esc(item.label) + '</a></li>';
            }
            var menuId = 'stMenu' + i;
            return '<li class="st-has-menu">' +
                '<button type="button" class="st-link' + active + '" aria-expanded="false" aria-controls="' + menuId + '">' +
                    esc(item.label) + CHEVRON + '</button>' +
                '<div class="st-menu" id="' + menuId + '">' +
                    item.children.map(function (c) {
                        return '<a href="' + c[1] + '">' + esc(c[0]) + '</a>';
                    }).join('') +
                '</div></li>';
        }).join('');

        // Player headers have no account buttons of their own
        if (isPlayerHeader) {
            ul.insertAdjacentHTML('beforeend', loggedIn()
                ? '<li><a class="st-link" href="profile.html">My account</a></li>'
                : '<li><a class="st-link st-signin" href="login.html">Sign in</a></li>');
        }

        var userNav = navbar.querySelector('.navbar-user') || navbar.querySelector('.header-actions');
        if (userNav) navbar.insertBefore(ul, userNav);
        else navbar.appendChild(ul);

        // Player headers: a search button that goes to the search page
        if (isPlayerHeader && !header.querySelector('.st-search-btn')) {
            var s = document.createElement('a');
            s.className = 'st-search-btn';
            s.href = 'search.html';
            s.setAttribute('aria-label', 'Search');
            s.innerHTML = SEARCH;
            // keep the order: search, (share), menu button last
            var before = userNav || header.querySelector('#menuToggle');
            if (before) navbar.insertBefore(s, before);
            else navbar.appendChild(s);
        }

        // Search button that opens the existing (typeahead) search box
        var form = navbar.querySelector('form.header-search');
        if (form && userNav && !navbar.querySelector('.st-search-btn')) {
            var li = document.createElement('li');
            li.className = 'nav-item st-search-item';
            li.innerHTML = '<button type="button" class="st-search-btn" aria-label="Search" aria-expanded="false">' + SEARCH + '</button>';
            userNav.appendChild(li);
            var btn = li.querySelector('button');
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var open = header.classList.toggle('st-search-open');
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
                if (open) {
                    var input = form.querySelector('input');
                    if (input) setTimeout(function () { input.focus(); }, 30);
                }
            });
            document.addEventListener('click', function (e) {
                if (header.classList.contains('st-search-open') && !form.contains(e.target) && !btn.contains(e.target)) {
                    header.classList.remove('st-search-open');
                    btn.setAttribute('aria-expanded', 'false');
                }
            });
        }

        // Dropdowns: open on hover (mouse) and on click/tap (keyboard, touch)
        ul.querySelectorAll('.st-has-menu').forEach(function (li) {
            var btn = li.querySelector('button');
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var open = !li.classList.contains('st-open');
                closeMenus();
                li.classList.toggle('st-open', open);
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        });
        document.addEventListener('click', closeMenus);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeMenus();
                closeMobileMenu();
                header.classList.remove('st-search-open');
            }
        });
    }

    function closeMenus() {
        header.querySelectorAll('.st-has-menu.st-open').forEach(function (li) {
            li.classList.remove('st-open');
            var b = li.querySelector('button');
            if (b) b.setAttribute('aria-expanded', 'false');
        });
    }

    // ---------- Phone drop-down menu ----------
    var mobilePanel = null;

    function buildMobileMenu() {
        if (mobilePanel) return;
        mobilePanel = document.createElement('nav');
        mobilePanel.className = 'st-mobile-menu';
        mobilePanel.id = 'stMobileMenu';
        mobilePanel.setAttribute('aria-label', 'Menu');

        var items = NAV.map(function (item, i) {
            if (!item.children) {
                return '<li><a href="' + item.href + '"' + (isActive(item) ? ' class="st-active"' : '') + '>' + esc(item.label) + '</a></li>';
            }
            return '<li class="st-has-sub"><button type="button" aria-expanded="false">' + esc(item.label) + CHEVRON + '</button>' +
                '<div class="st-sub">' + item.children.map(function (c) {
                    return '<a href="' + c[1] + '">' + esc(c[0]) + '</a>';
                }).join('') + '</div></li>';
        });
        items.push(loggedIn()
            ? '<li><a href="profile.html">My account</a></li><li><button type="button" class="st-logout">Log out</button></li>'
            : '<li><a href="login.html">Sign in</a></li>');
        items.push('<li><a href="https://play.google.com/store/apps/details?id=com.unruly.pix" target="_blank" rel="noopener" class="st-green">Get the App</a></li>');
        items.push('<li><a href="contact.html">Contact</a></li>');
        mobilePanel.innerHTML = '<ul>' + items.join('') + '</ul>';
        header.appendChild(mobilePanel);

        mobilePanel.querySelectorAll('.st-has-sub > button').forEach(function (b) {
            b.addEventListener('click', function () {
                var li = b.parentElement;
                var open = li.classList.toggle('st-open');
                b.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        });
        var lo = mobilePanel.querySelector('.st-logout');
        if (lo) lo.addEventListener('click', function () {
            if (typeof window.logout === 'function') window.logout();
            else { try { localStorage.removeItem('token'); localStorage.removeItem('authToken'); } catch (e) {} window.location.href = 'index.html'; }
        });
    }

    function openMobileMenu() {
        buildMobileMenu();
        header.classList.add('st-menu-open');
        var t = document.getElementById('menuToggle');
        if (t) t.setAttribute('aria-expanded', 'true');
    }

    function closeMobileMenu() {
        header.classList.remove('st-menu-open');
        var t = document.getElementById('menuToggle');
        if (t) t.setAttribute('aria-expanded', 'false');
    }

    // The old hamburger (and the bottom bar's "Menu" item, which clicks it)
    // opened the side drawer. Route them to the new drop-down menu instead.
    document.addEventListener('click', function (e) {
        var t = e.target.closest && e.target.closest('#menuToggle');
        if (!t) {
            if (header.classList.contains('st-menu-open') && mobilePanel && !mobilePanel.contains(e.target)) closeMobileMenu();
            return;
        }
        e.preventDefault();
        e.stopImmediatePropagation();
        if (header.classList.contains('st-menu-open')) closeMobileMenu();
        else openMobileMenu();
    }, true);

    var toggle = document.getElementById('menuToggle');
    if (!toggle && isPlayerHeader) {
        // Player headers have no menu button: add one for phones
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.id = 'menuToggle';
        toggle.className = 'st-menu-btn';
        toggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
        header.appendChild(toggle);
    }
    if (toggle) {
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('aria-label', 'Menu');
        toggle.setAttribute('aria-controls', 'stMobileMenu');
        toggle.setAttribute('aria-expanded', 'false');
        if (!toggle.hasAttribute('tabindex')) toggle.setAttribute('tabindex', '0');
        toggle.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.click(); }
        });
    }

    // ---------- Header: see-through over the hero, solid after scrolling ----------
    if (document.querySelector('.app-slider')) document.documentElement.classList.add('st-has-hero');
    function onScroll() {
        header.classList.toggle('st-scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ---------- Poster rows: arrow buttons ----------
    var ARROW_L = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';
    var ARROW_R = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';

    function updateArrows(wrap, row) {
        var max = row.scrollWidth - row.clientWidth - 4;
        wrap.classList.toggle('st-can-left', row.scrollLeft > 4);
        wrap.classList.toggle('st-can-right', row.scrollLeft < max);
    }

    function enhanceRows() {
        document.querySelectorAll('.h-scroll').forEach(function (row) {
            if (row.parentElement && row.parentElement.classList.contains('st-row')) {
                updateArrows(row.parentElement, row);
                return;
            }
            var wrap = document.createElement('div');
            wrap.className = 'st-row';
            row.parentNode.insertBefore(wrap, row);
            wrap.appendChild(row);
            ['left', 'right'].forEach(function (side) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'st-arrow st-arrow-' + side;
                b.setAttribute('aria-label', side === 'left' ? 'Scroll left' : 'Scroll right');
                b.innerHTML = side === 'left' ? ARROW_L : ARROW_R;
                b.addEventListener('click', function () {
                    var step = Math.max(row.clientWidth * 0.85, 200);
                    row.scrollBy({ left: side === 'left' ? -step : step, behavior: 'smooth' });
                });
                wrap.appendChild(b);
            });
            row.addEventListener('scroll', function () { updateArrows(wrap, row); }, { passive: true });
            updateArrows(wrap, row);
        });
    }

    // ---------- Hero: "Title: VJ Name" ----------
    function enhanceHero() {
        document.querySelectorAll('.carousel-item .hero-title').forEach(function (t) {
            if (t.querySelector('.st-hero-vj')) return;
            var item = t.closest('.carousel-item');
            var vj = item && item.querySelector('.hero-badge-vj');
            if (!vj || !vj.textContent.trim()) return;
            var span = document.createElement('span');
            span.className = 'st-hero-vj';
            span.textContent = vj.textContent.trim();
            t.appendChild(span);
        });
    }

    // ---------- Movie player: "Title: VJ Name" and VJ tags on related posters ----------
    function enhancePlayer() {
        var title = document.getElementById('movieTitle');
        var vjName = document.getElementById('vjName');
        if (title && vjName) {
            var vj = vjName.textContent.trim();
            var current = title.querySelector('.st-hero-vj');
            if (vj && !/^(unknown|loading)/i.test(vj) && title.textContent.trim() && !/^loading/i.test(title.textContent.trim())) {
                if (!current) {
                    current = document.createElement('span');
                    current.className = 'st-hero-vj';
                    title.appendChild(current);
                }
                if (current.textContent !== vj) current.textContent = vj;
                var info = document.getElementById('vjInfo');
                if (info) info.classList.add('st-hidden');
            }
        }
        document.querySelectorAll('.related-card').forEach(function (card) {
            if (card.querySelector('.st-vj-tag')) return;
            var vjEl = card.querySelector('.related-vj');
            var wrap = card.querySelector('.related-poster-wrapper');
            if (!vjEl || !wrap || !vjEl.textContent.trim()) return;
            var tag = document.createElement('span');
            tag.className = 'st-vj-tag';
            tag.textContent = vjEl.textContent.trim();
            wrap.appendChild(tag);
        });
    }

    // Rows and hero slides are filled in after the page loads, so watch for them.
    var pending = null;
    function refresh() {
        pending = null;
        enhanceRows();
        enhanceHero();
        enhancePlayer();
    }
    var observer = new MutationObserver(function () {
        if (!pending) pending = setTimeout(refresh, 120);
    });

    // With the filter bar hidden, say in the page title which VJ is shown
    // when someone arrives from the VJ menu (movies.html?vj=VJ%20Junior).
    function titleForVjLink() {
        if (!/\/movies(\.html)?$/.test(path)) return;
        var vj = new URLSearchParams(window.location.search).get('vj');
        var h1 = document.querySelector('.page-hero-title');
        if (!vj || !h1) return;
        var svgEl = h1.querySelector('svg');
        h1.textContent = vj + ' movies';
        if (svgEl) h1.insertBefore(svgEl, h1.firstChild);
    }

    function start() {
        buildTopNav();
        titleForVjLink();
        refresh();
        // Watch only the content area (on the movie player that leaves out the
        // video, whose controls change the page many times a second)
        var root = document.querySelector('.app-content') || document.querySelector('body > .content') ||
                   document.getElementById('main-content') || document.body;
        observer.observe(root, { childList: true, subtree: true });
        window.addEventListener('resize', function () {
            document.querySelectorAll('.st-row').forEach(function (w) {
                var r = w.querySelector('.h-scroll');
                if (r) updateArrows(w, r);
            });
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
