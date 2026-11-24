/* ===================================
   Unruly Movies — load more as you scroll
   Used by the listing pages (movies, series, genres, trending, search).
   The page shows its first batch, then this calls loadNext() whenever the
   bottom of the list comes within about two screens. A spinner shows while
   a batch loads, and a "Try again" button if one fails.
   Styles: .st-load-more in css/site-theme.css.

   var feed = InfiniteScroll.attach(document.getElementById('loadMore'), {
       label: 'Loading more movies',
       // Must return a promise for "are there still more?".
       // isCurrent() turns false if the list was reset meanwhile
       // (e.g. new filters), in which case nothing should be added.
       loadNext: function (isCurrent) { ... }
   });
   feed.reset(hasMore);   // after the first batch is shown (or new filters)
   feed.stop();           // e.g. while a different list is on screen
   =================================== */
(function () {
    'use strict';

    function attach(el, opts) {
        // Without this, a visitor scrolled right down to the footer stays
        // pinned to it as each batch is added above it ("scroll anchoring"),
        // so the list would keep loading batch after batch on its own.
        document.documentElement.style.overflowAnchor = 'none';

        var label = opts.label || 'Loading more';
        var hasMore = false;
        var loading = false;
        var failed = false;
        var token = 0;
        var queued = false;

        function show(state) {
            if (state === 'loading') {
                el.innerHTML = '<span class="st-load-more-spinner" aria-hidden="true"></span><span></span>';
                el.lastChild.textContent = label;
            } else if (state === 'error') {
                el.innerHTML = '<span>Couldn’t load more.</span><button type="button" class="st-load-more-retry">Try again</button>';
                el.querySelector('button').addEventListener('click', function () {
                    failed = false;
                    run();
                });
            } else {
                el.innerHTML = '';
            }
        }

        function run() {
            if (loading || failed || !hasMore) return;
            var mine = token;
            var isCurrent = function () { return mine === token; };
            loading = true;
            show('loading');
            Promise.resolve()
                .then(function () { return opts.loadNext(isCurrent); })
                .then(function (more) {
                    if (!isCurrent()) return;
                    loading = false;
                    hasMore = !!more;
                    show('');
                    schedule();
                }, function (err) {
                    if (!isCurrent()) return;
                    loading = false;
                    failed = true;
                    if (window.console) console.error('Could not load more:', err);
                    show('error');
                });
        }

        // Load when the bottom of the list is within two screen heights
        function check() {
            queued = false;
            if (loading || failed || !hasMore || !el.isConnected) return;
            if (!el.offsetParent) return; // list is hidden right now
            if (el.getBoundingClientRect().top < window.innerHeight * 2) run();
        }

        // A short timer (not requestAnimationFrame, which pauses in background
        // tabs) also keeps fast scrolling from checking on every scroll event.
        function schedule() {
            if (queued) return;
            queued = true;
            setTimeout(check, 60);
        }

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                for (var i = 0; i < entries.length; i++) {
                    if (entries[i].isIntersecting) { schedule(); return; }
                }
            }, { rootMargin: '0px 0px 100% 0px' }).observe(el);
        }
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);

        return {
            reset: function (more) {
                token++;
                loading = false;
                failed = false;
                hasMore = !!more;
                show('');
                schedule();
            },
            stop: function () {
                token++;
                loading = false;
                failed = false;
                hasMore = false;
                show('');
            },
            check: schedule
        };
    }

    /* For lists the API can only return from the top (no page numbers):
       the first batch is a small request; the first time more are needed,
       the whole list is fetched once and then handed out a batch at a time.

       var src = InfiniteScroll.fromTop({
           size: 48,
           fetch: function (limit) { return promise for an array of items; },
           id: function (item) { return item._id; }   // optional, skips repeats
       });
       src.first().then(function (items) { ... });   // up to `size` items
       src.next().then(function (items) { ... });    // the next batch
       src.hasMore();                                 // true while more may remain */
    function fromTop(opts) {
        var size = opts.size || 48;
        var idOf = opts.id || function (item) { return item && item._id; };
        var seen = {};
        var rest = null;     // the remaining list once fetched
        var more = false;

        function keepNew(list) {
            return (list || []).filter(function (item) {
                var id = idOf(item);
                if (id == null) return true;
                if (seen[id]) return false;
                seen[id] = true;
                return true;
            });
        }

        return {
            first: function () {
                return Promise.resolve(opts.fetch(size)).then(function (list) {
                    list = list || [];
                    more = list.length >= size;
                    return keepNew(list);
                });
            },
            next: function () {
                var ready = rest
                    ? Promise.resolve()
                    : Promise.resolve(opts.fetch(opts.max || 2000)).then(function (list) {
                        rest = keepNew(list);
                    });
                return ready.then(function () {
                    var batch = rest.splice(0, size);
                    more = rest.length > 0;
                    return batch;
                });
            },
            hasMore: function () { return more; }
        };
    }

    window.InfiniteScroll = { attach: attach, fromTop: fromTop };
})();
