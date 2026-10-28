/**
 * Telegram -> Cloudflare R2 auto-uploader.
 *
 * Watches one Telegram chat (your Saved Messages by default) and, whenever a
 * video file shows up there, downloads it with your own account via MTProto
 * (no 20 MB Bot-API cap), streams it straight into R2, and creates a *draft*
 * movie in the catalogue with the R2 link already filled in. You then add the
 * poster + details in the admin panel and publish.
 *
 * Runs on your PC. It only moves bytes between Telegram and R2 — nothing goes
 * through Railway, so no egress bill.
 *
 * ── Setup ────────────────────────────────────────────────────────────────
 * 1. Get an api_id + api_hash from https://my.telegram.org (free), put them in
 *    server/.env as TELEGRAM_API_ID and TELEGRAM_API_HASH.
 * 2. First run:  node telegram/uploader.js
 *    It asks for your phone + the login code Telegram texts you (and your 2FA
 *    password if you set one). It then saves a session string to .env so it
 *    never asks again.
 * 3. Forward any movie into your Saved Messages (or set TELEGRAM_SOURCE to a
 *    channel/username/id) and watch it appear as a draft.
 *
 * ── Optional .env settings ──────────────────────────────────────────────
 *   TELEGRAM_SOURCE          chat to watch: 'me' (Saved Messages, default),
 *                            a @username, or a numeric chat id
 *   TELEGRAM_POLL_SECONDS    how often to check for new files (default 30)
 *   TELEGRAM_SESSION         filled in automatically after first login
 */

const path = require('path');
const fs = require('fs');
const readline = require('readline/promises');
const { stdin, stdout } = require('process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const mongoose = require('mongoose');
const LugandaMovie = require('../models/LugandaMovie');
const tmdb = require('../services/tmdbService');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(require('@ffmpeg-installer/ffmpeg').path);
ffmpeg.setFfprobePath(require('@ffprobe-installer/ffprobe').path);

const ENV_PATH = path.join(__dirname, '..', '.env');
const STATE_PATH = path.join(__dirname, 'state.json');
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

const VIDEO_EXTS = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.flv', '.wmv', '.ts', '.3gp'];
const CONTENT_TYPES = {
    '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm',
    '.mkv': 'video/x-matroska', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
    '.ts': 'video/mp2t', '.3gp': 'video/3gpp', '.flv': 'video/x-flv', '.wmv': 'video/x-ms-wmv'
};

// ── small helpers ──────────────────────────────────────────────────────────

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function ask(question, hidden = false) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    const answer = await rl.question(question);
    rl.close();
    return answer.trim();
}

/** Read or append/replace a single KEY=value line in .env (keeps the rest). */
function setEnvVar(key, value) {
    let text = '';
    try { text = fs.readFileSync(ENV_PATH, 'utf8'); } catch (e) { /* new file */ }
    const line = `${key}=${value}`;
    const re = new RegExp(`^\\s*${key}\\s*=.*$`, 'm');
    if (re.test(text)) {
        text = text.replace(re, line);
    } else {
        text = text.replace(/\s*$/, '') + `\n\n# Telegram session (auto-generated — do not share)\n${line}\n`;
    }
    fs.writeFileSync(ENV_PATH, text);
    process.env[key] = value;
}

function loadState() {
    try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch (e) { return {}; }
}
function saveState(state) {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function humanSize(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
    if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
    return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

function cleanTitleFromName(name) {
    return name
        .replace(/\.[a-z0-9]{2,4}$/i, '')       // drop extension
        .replace(/[._]+/g, ' ')                 // dots/underscores -> spaces
        .replace(/\s+/g, ' ')
        .trim();
}

function safeFileName(name) {
    // No spaces in R2 object keys: a space becomes %20 in the URL, and anything
    // that strips whitespace (e.g. sanitizeUrl) then breaks the link. Use '_'.
    return (name || `video-${Date.now()}.mp4`)
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '_');
}

// ── TMDB enrichment ────────────────────────────────────────────────────────

// LugandaMovie.genres accepts any lowercase string, so keep all TMDB genres.
function mapGenres(tmdbGenres) {
    return (tmdbGenres || []).map(g => g.name.toLowerCase());
}

/**
 * Turn a messy VJ filename/caption into a clean TMDB query + year + VJ credit.
 * e.g. "THAI FIGHTER ____VJ EMMY.2026.mp4" -> { query: "THAI FIGHTER", year: 2026, vj: "VJ Emmy" }
 */
function parseTitleQuery(raw) {
    let s = ' ' + String(raw || '').replace(/\.[a-z0-9]{2,4}$/i, ' ').replace(/[._]+/g, ' ') + ' ';
    const yearMatch = s.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : null;

    const vjMatch = s.match(/\bvj\s*[:\-]?\s*([a-z][a-z0-9]{0,15})/i);
    const vj = vjMatch ? ('VJ ' + vjMatch[1].charAt(0).toUpperCase() + vjMatch[1].slice(1).toLowerCase()) : null;

    s = s.replace(/\bvj\s*[:\-]?\s*[a-z0-9]+/ig, ' ');              // VJ <name>
    s = s.replace(/[\[\(\{][^\]\)\}]*[\]\)\}]/g, ' ');              // [..] (..) {..}
    s = s.replace(/\b(720p|1080p|2160p|480p|4k|hdrip|hdcam|camrip|webrip|web\s?dl|bluray|brrip|dvdrip|x264|x265|h264|h265|hevc|aac|ac3|dual|subbed|dubbed|hdts|hdtc|translated)\b/ig, ' ');
    s = s.replace(/\b(19|20)\d{2}\b/g, ' ');                       // the year
    s = s.replace(/[^a-z0-9 :'&!\-]/ig, ' ');                      // leftover junk
    s = s.replace(/\s+/g, ' ').trim();
    return { query: s, year, vj };
}

/** Search TMDB and return full movie details, or null if nothing matches. */
async function fetchTmdbMeta(query, year) {
    if (!process.env.TMDB_API_KEY || !query) return null;
    try {
        let res = await tmdb.searchMovies(query, 1, year || null);
        if ((!res || !res.results || !res.results.length) && year) {
            res = await tmdb.searchMovies(query, 1, null);          // retry without year
        }
        if (!res || !res.results || !res.results.length) return null;
        return await tmdb.getMovieDetails(res.results[0].id);      // credits + videos + images
    } catch (e) {
        log('    TMDB lookup failed:', e.message);
        return null;
    }
}

/** Search TMDB for a TV series and return full details, or null. */
async function fetchTmdbTv(query) {
    if (!process.env.TMDB_API_KEY || !query) return null;
    try {
        const res = await tmdb.searchTVShows(query, 1, null);
        if (!res || !res.results || !res.results.length) return null;
        return await tmdb.getTVShowDetails(res.results[0].id);
    } catch (e) {
        log('    TMDB TV lookup failed:', e.message);
        return null;
    }
}

function makeSlug(str) {
    return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Detect a series episode in a filename/caption. Returns
 * { seriesTitle, season, episode } or null for a plain movie.
 * Handles S01E02 / S1E2 / S1 E2 / 1x05 / "Season 1 Episode 2" / "Episode 5".
 */
function parseSeriesEpisode(raw) {
    const s = ' ' + String(raw || '').replace(/\.[a-z0-9]{2,4}$/i, ' ').replace(/[._]+/g, ' ') + ' ';
    const patterns = [
        { re: /\bS\s*(\d{1,2})\s*E\s*(\d{1,3})\b/i, sIdx: 1, eIdx: 2 },                    // S01E02 / S1 E2
        { re: /\b(\d{1,2})\s*x\s*(\d{1,3})\b/i, sIdx: 1, eIdx: 2 },                        // 1x05
        { re: /\bseason\s*(\d{1,2})\b.{0,12}?\bepisode\s*(\d{1,3})\b/i, sIdx: 1, eIdx: 2 },// Season 1 Episode 2
        { re: /\b(?:episode|ep)\s*[.#-]?\s*(\d{1,3})\b/i, sIdx: null, eIdx: 1 }            // Episode 5 (season -> 1)
    ];
    for (const p of patterns) {
        const m = s.match(p.re);
        if (!m) continue;
        const season = p.sIdx ? parseInt(m[p.sIdx], 10) : 1;
        const episode = parseInt(m[p.eIdx], 10);
        if (!episode) continue;
        const prefix = s.slice(0, m.index);
        const seriesTitle = parseTitleQuery(prefix).query || parseTitleQuery(raw).query;
        return { seriesTitle, season, episode };
    }
    return null;
}

// ── R2 ───────────────────────────────────────────────────────────────────

function r2Client() {
    return new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
        },
        // Keep the SDK's CRC32 checksums off — R2 rejects them on uploads.
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED'
    });
}

async function uploadToR2(r2, localPath, key, contentType) {
    const total = fs.statSync(localPath).size;
    let lastPct = -10;
    const upload = new Upload({
        client: r2,
        params: {
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: fs.createReadStream(localPath),
            ContentType: contentType
        },
        queueSize: 4,
        partSize: 16 * 1024 * 1024    // 16 MB parts
    });
    upload.on('httpUploadProgress', (p) => {
        if (!p.loaded) return;
        const pct = Math.floor((p.loaded / total) * 100);
        if (pct >= lastPct + 10) { lastPct = pct; log(`    upload  ${pct}%`); }
    });
    await upload.done();
}

// ── movie draft ────────────────────────────────────────────────────────────

function trailerUrl(meta) {
    const vids = meta.videos && meta.videos.results;
    if (!vids || !vids.length) return null;
    const t = vids.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
              vids.find(v => v.site === 'YouTube');
    return t ? `https://www.youtube.com/watch?v=${t.key}` : null;
}

async function createDraftMovie({ originalTitle, lugandaTitle, publicUrl, size, format, meta, vj }) {
    const tags = vj ? [vj] : [];
    // R2 is a direct URL, so it goes in embedUrl (same place the admin web-upload
    // puts it). provider 'other' = a plain direct URL, not a streamtape embed.
    const video = {
        originalVideoPath: publicUrl,
        embedUrl: publicUrl,
        provider: 'other',
        quality: 'hd',
        size: Number(size) || 0,
        format: format || 'mp4'
    };

    let fields;
    if (meta) {
        const crew = (meta.credits && meta.credits.crew) || [];
        const cast = (meta.credits && meta.credits.cast) || [];
        fields = {
            description: meta.overview || 'Added from Telegram — add a description before publishing.',
            year: meta.release_date ? new Date(meta.release_date).getFullYear() : new Date().getFullYear(),
            duration: meta.runtime || 0,
            director: (crew.find(c => c.job === 'Director') || {}).name || 'Unknown',
            poster: tmdb.getPosterUrl(meta.poster_path) || '/assets/images/placeholder.svg',
            backdrop: tmdb.getBackdropUrl(meta.backdrop_path) || null,
            trailer: trailerUrl(meta),
            genres: mapGenres(meta.genres),
            rating: { imdb: meta.vote_average || 0, userRating: 0, totalRatings: meta.vote_count || 0 },
            cast: cast.slice(0, 10).map(a => ({
                name: a.name, character: a.character, image: tmdb.getProfileUrl(a.profile_path)
            })),
            originalLanguage: meta.original_language || 'en',
            country: (meta.production_countries && meta.production_countries[0] && meta.production_countries[0].name) || 'USA',
            metaData: { tmdbId: meta.id ? meta.id.toString() : undefined, imdbId: meta.imdb_id || undefined }
        };
    } else {
        fields = {
            description: 'Draft added automatically from Telegram. Add a description, poster, year and details, then publish.',
            year: new Date().getFullYear(),
            duration: 0,
            director: 'Unknown',
            poster: '/assets/images/placeholder.svg'
        };
    }

    // The model derives a unique slug from the title; on a rare collision, add a
    // numeric suffix to the title so the derived slug differs, and retry.
    for (let attempt = 0; attempt < 4; attempt++) {
        const suffix = attempt === 0 ? '' : ` (${attempt + 1})`;
        try {
            const doc = new LugandaMovie({
                ...fields,
                originalTitle: originalTitle + suffix,
                lugandaTitle: (lugandaTitle || originalTitle) + suffix,
                vjName: vj || 'Unknown VJ',
                availableLanguages: ['English', 'Luganda'],
                status: 'draft',       // never auto-publish — you review first
                tags,
                video
            });
            await doc.save();
            return doc;
        } catch (e) {
            if (e.code === 11000 && attempt < 3) continue;   // duplicate slug
            throw e;
        }
    }
}

/**
 * Attach a series episode to its series document (creating the series, season,
 * or episode slot as needed). Always a draft. Matches an existing series by
 * TMDB id or title so episodes forwarded over time land in the same series.
 */
async function upsertSeriesEpisode({ seriesTitle, season, episode, vj, publicUrl }) {
    const tv = await fetchTmdbTv(seriesTitle);
    const tmdbId = tv ? String(tv.id) : null;
    const canonicalTitle = (tv && tv.name) || seriesTitle || 'Untitled Series';

    const esc = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const titleRe = new RegExp('^' + esc(canonicalTitle) + '$', 'i');
    const or = [];
    if (tmdbId) or.push({ 'metaData.tmdbId': tmdbId });
    or.push({ originalTitle: titleRe }, { lugandaTitle: titleRe }, { slug: makeSlug(canonicalTitle) });

    let series = await LugandaMovie.findOne({ contentType: 'series', $or: or });
    let created = false;

    if (!series) {
        created = true;
        series = new LugandaMovie({
            contentType: 'series',
            originalTitle: canonicalTitle,
            lugandaTitle: canonicalTitle,
            vjName: vj || 'Unknown VJ',
            description: (tv && tv.overview) || 'Series added from Telegram — add details before publishing.',
            year: (tv && tv.first_air_date) ? new Date(tv.first_air_date).getFullYear() : new Date().getFullYear(),
            poster: (tv && tmdb.getPosterUrl(tv.poster_path)) || '/assets/images/placeholder.svg',
            backdrop: (tv && tmdb.getBackdropUrl(tv.backdrop_path)) || null,
            genres: tv ? mapGenres(tv.genres) : [],
            status: 'draft',
            availableLanguages: ['English', 'Luganda'],
            seasons: [],
            metaData: tmdbId ? { tmdbId } : {}
        });
    }

    let seasonObj = series.seasons.find(s => s.seasonNumber === season);
    if (!seasonObj) {
        series.seasons.push({ seasonNumber: season, name: `Season ${season}`, episodes: [] });
        seasonObj = series.seasons[series.seasons.length - 1];
    }

    const video = { embedUrl: publicUrl, archiveUrl: '', streamtapeId: '', provider: 'other' };
    const epObj = seasonObj.episodes.find(e => e.episodeNumber === episode);
    if (epObj) {
        epObj.video = video;
        if (vj) { epObj.vjName = vj; epObj.isTranslated = true; }
    } else {
        seasonObj.episodes.push({
            episodeNumber: episode,
            name: `Episode ${episode}`,
            video,
            vjName: vj || '',
            isTranslated: !!vj
        });
    }

    seasonObj.episodeCount = seasonObj.episodes.length;
    series.totalSeasons = series.seasons.length;
    series.totalEpisodes = series.seasons.reduce((n, s) => n + s.episodes.length, 0);

    await series.save();
    return { series, created, matchedTmdb: !!tv, season, episode };
}

// ── make files browser-streamable ─────────────────────────────────────────

// Browsers can't play .mkv/.avi in <video> — only MP4 (H.264/AAC) and WebM.
// Convert anything else to MP4 before upload: a fast remux when the codecs are
// already browser-friendly, a full transcode only when they aren't.
const BROWSER_SAFE_EXT = new Set(['.mp4', '.m4v', '.webm']);

function probeCodecs(file) {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(file, (err, data) => {
            if (err || !data) return resolve(null);
            const streams = data.streams || [];
            const v = streams.find(s => s.codec_type === 'video');
            const a = streams.find(s => s.codec_type === 'audio');
            resolve({ vcodec: (v && v.codec_name) || '', acodec: (a && a.codec_name) || '' });
        });
    });
}

/**
 * Ensure the file is browser-streamable MP4. Returns null when it already is
 * (no work needed), otherwise { path, name } for the converted MP4.
 */
async function ensureStreamable(localPath, ext, fileName, id) {
    if (BROWSER_SAFE_EXT.has(ext)) return null;     // mp4 / webm: assume playable

    const codecs = await probeCodecs(localPath);
    const vOk = /^(h264|avc)/i.test(codecs ? codecs.vcodec : '');
    const aOk = /^aac/i.test(codecs ? codecs.acodec : '');
    const outPath = path.join(DOWNLOAD_DIR, `${id}-stream.mp4`);
    const outName = fileName.replace(/\.[^.]+$/, '') + '.mp4';

    await new Promise((resolve, reject) => {
        let cmd = ffmpeg(localPath);
        if (vOk && aOk) {
            log('    convert: remux → MP4 (copy, fast, no quality loss)');
            cmd = cmd.videoCodec('copy').audioCodec('copy');
        } else if (vOk) {
            log('    convert: copy video, transcode audio → AAC');
            cmd = cmd.videoCodec('copy').audioCodec('aac').audioBitrate('192k');
        } else {
            log(`    convert: full transcode → H.264/AAC (slow; source video=${codecs ? codecs.vcodec : '?'})`);
            cmd = cmd.videoCodec('libx264').audioCodec('aac').audioBitrate('192k')
                     .outputOptions(['-preset veryfast', '-crf 23']);
        }
        let lastPct = -20;
        cmd.outputOptions(['-movflags +faststart'])
            .on('progress', p => {
                if (p.percent && p.percent >= lastPct + 20) { lastPct = p.percent; log(`    convert ${Math.floor(p.percent)}%`); }
            })
            .on('end', () => resolve())
            .on('error', err => reject(err))
            .save(outPath);
    });

    return { path: outPath, name: outName };
}

// ── message processing ───────────────────────────────────────────────────

function describeVideo(message) {
    const file = message.file;                 // GramJS File wrapper (may be null)
    const mime = (file && file.mimeType) || '';
    let name = file && file.name;
    const extFromName = name ? path.extname(name).toLowerCase() : '';
    const isVideo =
        mime.startsWith('video/') ||
        VIDEO_EXTS.includes(extFromName) ||
        !!message.video;                        // sent as a Telegram "video"
    if (!isVideo) return null;
    if (!name) {
        const ext = (Object.entries(CONTENT_TYPES).find(([, v]) => v === mime) || ['.mp4'])[0];
        name = `video-${message.id}${ext}`;
    }
    return { name, mime, size: (file && file.size) || 0 };
}

async function handleMessage(client, r2, message) {
    const info = describeVideo(message);
    if (!info) return false;                    // not a video — skip

    const caption = (message.message && message.message.split('\n')[0].trim()) || '';
    // Parse both the caption and the filename — the caption is often a clean
    // display title while the filename holds the technical bits (S01E02, VJ, year).
    const nameParse = parseTitleQuery(info.name);
    const capParse = caption ? parseTitleQuery(caption) : { query: '', year: null, vj: null };
    const query = capParse.query || nameParse.query;
    const year = capParse.year || nameParse.year;
    const vj = capParse.vj || nameParse.vj;
    // Season/episode markers usually live in the filename, so check it first.
    const seInfo = parseSeriesEpisode(info.name) || parseSeriesEpisode(caption);
    const provisionalTitle = caption || query || cleanTitleFromName(info.name) || `Untitled ${message.id}`;
    const fileName = safeFileName(info.name);
    const ext = path.extname(fileName).toLowerCase();
    const localPath = path.join(DOWNLOAD_DIR, `${message.id}-${fileName}`);

    log(`▶ new ${seInfo ? `episode (S${seInfo.season}E${seInfo.episode})` : 'video'}: "${provisionalTitle}"  (${humanSize(info.size)})`);

    // 1) download from Telegram to a temp file
    let lastPct = -10;
    await client.downloadMedia(message, {
        outputFile: localPath,
        progressCallback: (received) => {
            const total = Number(info.size) || 0;
            if (!total) return;
            const pct = Math.floor((Number(received) / total) * 100);
            if (pct >= lastPct + 10) { lastPct = pct; log(`    download ${pct}%`); }
        }
    });
    log('    download complete');

    let uploadPath = localPath;
    let uploadName = fileName;
    let contentType = info.mime || CONTENT_TYPES[ext] || 'video/mp4';
    try {
        // 2) make sure it's browser-streamable (convert .mkv/.avi/… → MP4)
        const converted = await ensureStreamable(localPath, ext, fileName, message.id);
        if (converted) {
            uploadPath = converted.path;
            uploadName = converted.name;
            contentType = 'video/mp4';
            log(`    converted -> ${uploadName}`);
        }

        // 3) build the R2 key — series grouped under series/<name>/, movies flat
        const pad = (n) => String(n).padStart(2, '0');
        const key = seInfo
            ? `series/${makeSlug(seInfo.seriesTitle) || 'untitled-series'}/S${pad(seInfo.season)}E${pad(seInfo.episode)}-${uploadName}`
            : `movies/${Date.now()}-${uploadName}`;

        // 4) stream the file into R2
        await uploadToR2(r2, uploadPath, key, contentType);
        const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
        log(`    uploaded -> ${publicUrl}`);

        // 3a) series episode? attach it to the series (Series Management),
        //     not the movies list. (seInfo computed above.)
        if (seInfo) {
            const r = await upsertSeriesEpisode({ ...seInfo, vj, publicUrl });
            log(`    series: "${r.series.originalTitle}" S${r.season}E${r.episode} — ` +
                `${r.created ? 'new series created' : 'added to existing series'} ` +
                `(${r.matchedTmdb ? 'TMDB matched' : 'no TMDB match'})`);
            try {
                await client.sendMessage(message.peerId, {
                    message: `✅ Episode S${r.season}E${r.episode} added to series "${r.series.originalTitle}" (draft).\n` +
                             (r.matchedTmdb ? `🎬 Series poster + details pulled from TMDB.\n` : `⚠️ No TMDB match — set the series poster in Series Management.\n`) +
                             `Open Series Management to review and publish.`,
                    replyTo: message.id
                });
            } catch (e) { /* best-effort */ }
            return true;
        }

        // 3b) otherwise it's a movie — look up TMDB and create a movie draft
        const meta = await fetchTmdbMeta(query, year);
        if (meta) {
            log(`    TMDB: matched "${meta.title}" (${meta.release_date ? meta.release_date.slice(0, 4) : '?'}) — poster + details attached`);
        } else {
            log(`    TMDB: no match for "${query}" — poster/details left as placeholder`);
        }
        const originalTitle = (meta && meta.title) || query || `Untitled ${message.id}`;
        const lugandaTitle = caption || originalTitle;
        const draft = await createDraftMovie({
            originalTitle, lugandaTitle, publicUrl, size: info.size,
            format: path.extname(uploadName).slice(1) || 'mp4', meta, vj
        });
        log(`    draft created (id ${draft._id})`);

        // 4) acknowledge back in the chat
        try {
            await client.sendMessage(message.peerId, {
                message: `✅ Uploaded as draft: "${draft.originalTitle}"\n` +
                         (meta ? `🎬 Poster + details pulled from TMDB.\n` : `⚠️ No TMDB match — add a poster + details manually.\n`) +
                         `Open the admin panel, review, pick the right poster, and publish.`,
                replyTo: message.id
            });
        } catch (e) { /* ack is best-effort */ }

        return true;
    } finally {
        // always clean up temp files (the download + any converted copy)
        fs.promises.unlink(localPath).catch(() => {});
        if (uploadPath !== localPath) fs.promises.unlink(uploadPath).catch(() => {});
    }
}

// ── main ───────────────────────────────────────────────────────────────────

function requireEnv(keys) {
    const missing = keys.filter(k => !process.env[k]);
    if (missing.length) {
        console.error('\nMissing required .env values: ' + missing.join(', '));
        if (missing.includes('TELEGRAM_API_ID') || missing.includes('TELEGRAM_API_HASH')) {
            console.error('Get api_id + api_hash from https://my.telegram.org -> API development tools,');
            console.error('then add TELEGRAM_API_ID=... and TELEGRAM_API_HASH=... to server/.env');
        }
        process.exit(1);
    }
}

async function main() {
    requireEnv(['TELEGRAM_API_ID', 'TELEGRAM_API_HASH', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID',
                'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL', 'MONGODB_URI']);

    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

    log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    log('MongoDB connected.');

    const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
    const apiHash = process.env.TELEGRAM_API_HASH;
    const session = new StringSession(process.env.TELEGRAM_SESSION || '');
    const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 });

    const hadSession = !!process.env.TELEGRAM_SESSION;
    await client.start({
        phoneNumber: async () => ask('Phone number (with country code, e.g. +256...): '),
        password: async () => ask('2FA password (press Enter if none): '),
        phoneCode: async () => ask('Login code Telegram sent you: '),
        onError: (err) => console.error('Login error:', err.message || err)
    });

    if (!hadSession) {
        const saved = client.session.save();
        setEnvVar('TELEGRAM_SESSION', saved);
        log('Logged in. Session saved to .env — future runs will not ask again.');
    } else {
        log('Logged in with saved session.');
    }

    const sourceName = process.env.TELEGRAM_SOURCE || 'me';
    const source = await client.getEntity(sourceName);
    const sourceId = source.id.toString();
    log(`Watching "${sourceName}" for new videos.`);

    const r2 = r2Client();
    const state = loadState();

    // First time watching this chat: start from the latest message so we don't
    // re-ingest the whole history. Only genuinely new posts get processed.
    if (!state[sourceId]) {
        const [latest] = await client.getMessages(source, { limit: 1 });
        state[sourceId] = { lastId: latest ? latest.id : 0 };
        saveState(state);
        log(`Baseline set at message id ${state[sourceId].lastId}. Forward a movie to test.`);
    } else {
        log(`Resuming from message id ${state[sourceId].lastId}.`);
    }

    const pollSeconds = Math.max(10, parseInt(process.env.TELEGRAM_POLL_SECONDS || '30', 10));
    let polling = false;

    async function poll() {
        if (polling) return;
        polling = true;
        try {
            const lastId = state[sourceId].lastId;
            const messages = await client.getMessages(source, { minId: lastId, limit: 100 });
            if (messages.length) {
                // getMessages returns newest-first; process oldest-first.
                for (const message of [...messages].reverse()) {
                    try {
                        await handleMessage(client, r2, message);
                    } catch (e) {
                        log(`✗ failed on message ${message.id}: ${e.message}`);
                        log('  (re-forward the file to retry it)');
                    }
                    if (message.id > state[sourceId].lastId) {
                        state[sourceId].lastId = message.id;
                        saveState(state);
                    }
                }
            }
        } catch (e) {
            log('poll error:', e.message);
        } finally {
            polling = false;
        }
    }

    await poll();
    const timer = setInterval(poll, pollSeconds * 1000);

    const shutdown = async () => {
        log('Shutting down...');
        clearInterval(timer);
        try { await client.disconnect(); } catch (e) {}
        try { await mongoose.disconnect(); } catch (e) {}
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    log(`Ready. Checking every ${pollSeconds}s. Press Ctrl+C to stop.`);
}

if (require.main === module) {
    main().catch((e) => {
        console.error('Fatal:', e);
        process.exit(1);
    });
}

module.exports = { parseTitleQuery, parseSeriesEpisode, fetchTmdbMeta, fetchTmdbTv, mapGenres, trailerUrl, ensureStreamable, probeCodecs };
