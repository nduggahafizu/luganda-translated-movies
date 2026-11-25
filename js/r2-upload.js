/* ===================================
   Unruly Movies — fast video uploads to Cloudflare R2 (admin pages)

   One connection to R2 only reaches a fraction of a Ugandan line's upload
   speed (measured: about 0.5 Mbps on one connection, about 3 Mbps on eight),
   and a dropped connection used to mean starting the whole movie again.
   So the file is cut into pieces (8 MB or more) and 6 go up at once, straight
   from the browser to R2. A piece that fails or stalls is sent again on its
   own; the rest of the upload carries on.

     const result = await R2Upload.upload(file, {
         endpoint: API + '/api/r2',          // where the server's /multipart routes are
         token,                              // the admin's sign-in
         folder: 'series/my-series',         // optional (default movies/)
         onProgress: info => { ... }         // see R2Upload.describe(info)
     });
     result.publicUrl  // the video's address, for the movie or episode

   Server side: server/routes/r2-upload.js (/multipart/start, sign, complete, abort).
   =================================== */
(function () {
    'use strict';

    var CONCURRENCY = 6;
    var MAX_ATTEMPTS = 8;               // per piece, with growing waits (about 3 minutes in all)
    var STALL_MS = 60 * 1000;           // a piece with no progress for a minute is re-sent
    var URL_MAX_AGE_MS = 45 * 60 * 1000; // signed addresses last an hour; renew well before

    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    function api(opts, path, body) {
        return fetch(opts.endpoint + path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': opts.token ? 'Bearer ' + opts.token : ''
            },
            body: JSON.stringify(body)
        }).then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (data) {
                if (!res.ok || !data.success) {
                    var err = new Error(data.message || ('The server said no (HTTP ' + res.status + ')'));
                    err.status = res.status;
                    err.fromServer = true;
                    throw err;
                }
                return data;
            });
        });
    }

    // PUT one piece; resolves when R2 has it. onBytes(n) reports bytes sent so far.
    function putPiece(url, blob, onBytes, upload) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            var lastProgress = Date.now();
            var stallTimer = setInterval(function () {
                if (Date.now() - lastProgress > (upload.stallMs || STALL_MS)) {
                    clearInterval(stallTimer);
                    xhr.abort();
                    reject(new Error('stalled'));
                }
            }, Math.min(5000, upload.stallMs || 5000));
            upload.xhrs.add(xhr);
            function done() { clearInterval(stallTimer); upload.xhrs.delete(xhr); }

            xhr.open('PUT', url, true);
            xhr.upload.onprogress = function (e) {
                lastProgress = Date.now();
                onBytes(e.loaded);
            };
            xhr.onload = function () {
                done();
                if (xhr.status >= 200 && xhr.status < 300) resolve();
                else {
                    var err = new Error('R2 refused a piece (HTTP ' + xhr.status + ')');
                    err.status = xhr.status;
                    reject(err);
                }
            };
            xhr.onerror = function () { done(); reject(new Error('connection lost')); };
            xhr.onabort = function () { done(); reject(new Error(upload.cancelled ? 'cancelled' : 'stalled')); };
            xhr.send(blob);
        });
    }

    function upload(file, opts) {
        opts = opts || {};
        var concurrency = opts.concurrency || CONCURRENCY;
        var state = {
            cancelled: false,
            xhrs: new Set(),
            session: null,
            stallMs: opts.stallMs    // tests only; normally a minute
        };

        var total = file.size;
        var doneBytes = 0;          // pieces finished
        var inFlight = {};          // piece number -> bytes sent so far
        var samples = [];           // [time, bytes] for the speed over the last 30 s
        var startedAt = Date.now();
        var retrying = 0;
        var partsDone = 0;

        function loaded() {
            var sum = doneBytes;
            for (var n in inFlight) sum += inFlight[n];
            return Math.min(sum, total);
        }

        var lastReport = 0;
        function report(force) {
            var now = Date.now();
            if (!force && now - lastReport < 400) return;
            lastReport = now;
            var bytes = loaded();
            samples.push([now, bytes]);
            while (samples.length > 2 && now - samples[0][0] > 30000) samples.shift();
            var first = samples[0];
            var secs = (now - first[0]) / 1000;
            var speed = secs > 2 ? (bytes - first[1]) / secs
                : (now - startedAt > 2000 ? bytes / ((now - startedAt) / 1000) : 0);
            if (typeof opts.onProgress === 'function') {
                opts.onProgress({
                    loaded: bytes,
                    total: total,
                    fraction: total ? bytes / total : 0,
                    bytesPerSec: speed,
                    secondsLeft: speed > 0 ? (total - bytes) / speed : null,
                    partsDone: partsDone,
                    partsTotal: state.session ? state.session.partCount : 0,
                    retrying: retrying
                });
            }
        }

        // Don't let the admin close the tab by accident mid-upload
        function beforeUnload(e) {
            e.preventDefault();
            e.returnValue = 'A video is still uploading. Leave anyway?';
            return e.returnValue;
        }
        window.addEventListener('beforeunload', beforeUnload);

        var urlCache = {};   // piece number -> { url, at }
        function urlFor(n, fresh) {
            var cached = urlCache[n];
            if (!fresh && cached && Date.now() - cached.at < URL_MAX_AGE_MS) return Promise.resolve(cached.url);
            return api(opts, '/multipart/sign', {
                key: state.session.key, uploadId: state.session.uploadId, partNumbers: [n]
            }).then(function (data) {
                var url = data.urls[n] || data.urls[String(n)];
                urlCache[n] = { url: url, at: Date.now() };
                return url;
            });
        }

        function sendPiece(n) {
            var size = state.session.partSize;
            var start = (n - 1) * size;
            var blob = file.slice(start, Math.min(start + size, total));
            var attempt = 0;

            function tryOnce() {
                attempt++;
                inFlight[n] = 0;
                return urlFor(n, attempt > 1)
                    .then(function (url) {
                        return putPiece(url, blob, function (b) { inFlight[n] = b; report(); }, state);
                    })
                    .then(function () {
                        delete inFlight[n];
                        doneBytes += blob.size;
                        partsDone++;
                        report(true);
                    }, function (err) {
                        delete inFlight[n];
                        if (state.cancelled) throw new Error('Upload cancelled');
                        // Signed out, or not an admin: trying again won't help.
                        // (A 403 from R2 itself usually means the piece's signed
                        // address expired; the next try gets a fresh one.)
                        if (err.fromServer && (err.status === 401 || err.status === 403)) throw err;
                        if (attempt >= MAX_ATTEMPTS) {
                            throw new Error('A piece of the file kept failing (' + err.message + '). Check the connection and try again.');
                        }
                        retrying++;
                        report(true);
                        return wait(Math.min(30000, 2000 * Math.pow(2, attempt - 1))).then(function () {
                            retrying--;
                            return tryOnce();
                        });
                    });
            }
            return tryOnce();
        }

        var run = api(opts, '/multipart/start', {
            filename: file.name,
            contentType: file.type || 'video/mp4',
            folder: opts.folder,
            size: total
        }).then(function (session) {
            state.session = session;
            report(true);

            var next = 1;
            var failed = null;
            function worker() {
                if (failed || state.cancelled || next > session.partCount) return Promise.resolve();
                var n = next++;
                return sendPiece(n).then(worker, function (err) {
                    failed = failed || err;
                    // stop the other pieces
                    state.cancelled = true;
                    state.xhrs.forEach(function (x) { x.abort(); });
                    throw failed;
                });
            }
            var workers = [];
            for (var i = 0; i < Math.min(concurrency, session.partCount); i++) workers.push(worker());
            return Promise.all(workers).then(function () {
                if (failed) throw failed;
                return api(opts, '/multipart/complete', {
                    key: session.key, uploadId: session.uploadId, partCount: session.partCount
                });
            });
        }).then(function (result) {
            report(true);
            return { publicUrl: result.publicUrl, key: result.key };
        }, function (err) {
            // Throw away the pieces already sent, so they don't sit in storage
            if (state.session) {
                api(opts, '/multipart/abort', { key: state.session.key, uploadId: state.session.uploadId })
                    .catch(function () { /* R2 also clears unfinished uploads after a few days */ });
            }
            throw err;
        });

        run.then(function () { window.removeEventListener('beforeunload', beforeUnload); },
                 function () { window.removeEventListener('beforeunload', beforeUnload); });

        run.cancel = function () {
            state.cancelled = true;
            state.xhrs.forEach(function (x) { x.abort(); });
        };
        return run;
    }

    function formatBytes(b) {
        if (b >= 1073741824) return (b / 1073741824).toFixed(2) + ' GB';
        if (b >= 1048576) return Math.round(b / 1048576) + ' MB';
        return Math.max(0, Math.round(b / 1024)) + ' KB';
    }

    function formatTime(secs) {
        if (secs == null || !isFinite(secs)) return '';
        if (secs >= 5400) return 'about ' + (secs / 3600).toFixed(1) + ' hours left';
        if (secs >= 90) return 'about ' + Math.round(secs / 60) + ' min left';
        return 'about ' + Math.max(1, Math.round(secs)) + ' sec left';
    }

    // "Uploading 34% (512 MB of 1.50 GB), 2.9 Mbps, about 25 min left"
    function describe(info) {
        if (info.total && info.loaded >= info.total) return 'Finishing the upload...';
        var text = 'Uploading ' + Math.floor(info.fraction * 100) + '% (' +
            formatBytes(info.loaded) + ' of ' + formatBytes(info.total) + ')';
        if (info.bytesPerSec > 0) {
            text += ', ' + (info.bytesPerSec * 8 / 1e6).toFixed(1) + ' Mbps';
            var left = formatTime(info.secondsLeft);
            if (left) text += ', ' + left;
        }
        if (info.retrying) text += '. Re-sending ' + (info.retrying === 1 ? 'a piece' : info.retrying + ' pieces') + ' after a connection drop';
        return text;
    }

    window.R2Upload = { upload: upload, describe: describe, formatBytes: formatBytes };
})();
