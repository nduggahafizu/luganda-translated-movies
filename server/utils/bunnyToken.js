const crypto = require('crypto');

/**
 * BunnyCDN URL Token Authentication
 *
 * Replaces referer-based hotlink protection, which protected nothing here:
 * the player sends <meta name="referrer" content="no-referrer">, so every
 * playback request arrived with no Referer — and a pull zone configured to
 * allow no-referer requests allows curl, wget, every download extension and
 * every other site's <video> embed too.
 *
 * A signed URL still plays straight from the CDN (no proxying, full Range
 * support, so seeking works), but it stops being useful to anyone else:
 * it expires, and optionally only works from the viewer's own IP.
 *
 * Configure with BUNNY_TOKEN_KEYS as a comma-separated list of
 * `hostname:security_key` pairs — one entry per pull zone whose
 * "Token Authentication" is switched on in the Bunny dashboard:
 *
 *   BUNNY_TOKEN_KEYS=lunoluno.b-cdn.net:a1b2c3-...,other.b-cdn.net:d4e5f6-...
 *
 * Hosts with no configured key are returned untouched, so catalogue entries
 * on CDNs we don't own (and any zone before its key is added) keep working
 * exactly as they do today. That also means enabling Token Authentication in
 * the Bunny dashboard BEFORE the key is set here would break that zone — set
 * the env var first, deploy, then flip the dashboard toggle.
 */

const DEFAULT_TTL_SECONDS = Number(process.env.BUNNY_TOKEN_TTL_SECONDS) || 6 * 60 * 60;

// Bunny validates the token against the requesting IP when one is baked in.
// Off by default on purpose: this audience is overwhelmingly on mobile data,
// where carrier NAT reassigns the client IP mid-session, and the browser may
// also reach Bunny over IPv6 while our API call came in over IPv4 — either
// mismatch kills playback partway through a movie. Only turn this on if you
// know your traffic is stable.
const LOCK_TO_IP = String(process.env.BUNNY_TOKEN_LOCK_IP || '').toLowerCase() === 'true';

// Params Bunny itself owns — never fed back into the signature.
const RESERVED_PARAMS = new Set(['token', 'expires', 'token_path']);

let keyCache = null;

function loadKeys() {
    if (keyCache) return keyCache;
    keyCache = new Map();
    const raw = process.env.BUNNY_TOKEN_KEYS || '';
    for (const entry of raw.split(',')) {
        const pair = entry.trim();
        if (!pair) continue;
        // Split on the FIRST colon only — a security key may contain colons,
        // a hostname never does (no ports on b-cdn.net URLs).
        const idx = pair.indexOf(':');
        if (idx < 1) {
            console.warn('BUNNY_TOKEN_KEYS: ignoring malformed entry (want host:key)');
            continue;
        }
        const host = pair.slice(0, idx).trim().toLowerCase();
        const key = pair.slice(idx + 1).trim();
        if (host && key) keyCache.set(host, key);
    }
    return keyCache;
}

function keyForHost(hostname) {
    return loadKeys().get(String(hostname || '').toLowerCase()) || null;
}

/** Is this a host we hold a signing key for? */
function isTokenAuthHost(hostname) {
    return !!keyForHost(hostname);
}

/**
 * Sign a CDN URL for direct browser playback.
 *
 * Idempotent: an already-signed URL is re-signed from scratch (old token and
 * expires are dropped first) rather than accumulating a second token, which
 * matters because stream-proxy is handed URLs that came out of here.
 *
 * @param {string} rawUrl        the stored CDN URL
 * @param {object} [opts]
 * @param {number} [opts.ttlSeconds]  how long the link stays valid
 * @param {string} [opts.clientIp]    viewer IP, when IP locking is enabled
 * @param {string} [opts.pathPrefix]  sign a directory instead of one file
 *                                    (Bunny `token_path`) — needed for HLS,
 *                                    where one token must cover every segment
 * @returns {string} the signed URL, or rawUrl unchanged if this host has no key
 */
function signBunnyUrl(rawUrl, opts = {}) {
    if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;

    let parsed;
    try {
        parsed = new URL(rawUrl.trim());
    } catch (e) {
        return rawUrl;
    }

    const securityKey = keyForHost(parsed.hostname);
    if (!securityKey) return rawUrl;

    const ttl = Number(opts.ttlSeconds) > 0 ? Number(opts.ttlSeconds) : DEFAULT_TTL_SECONDS;
    const expires = Math.floor(Date.now() / 1000) + ttl;

    // Bunny hashes the DECODED path: a stored
    // ".../FAMILY%202026%20VJ.ULIO.mp4" has to be signed as
    // ".../FAMILY 2026 VJ.ULIO.mp4" (literal spaces) or every request 403s.
    // The URL we hand back keeps the encoded form, since that's what has to
    // go over the wire.
    let signaturePath;
    try {
        signaturePath = decodeURIComponent(parsed.pathname);
    } catch (e) {
        signaturePath = parsed.pathname; // malformed escapes — sign as-is
    }

    // Collect any pre-existing query params (minus Bunny's own), because
    // Bunny folds them into the hash. Sorted by key, raw values.
    const extraParams = [];
    for (const [k, v] of parsed.searchParams.entries()) {
        if (!RESERVED_PARAMS.has(k.toLowerCase())) extraParams.push([k, v]);
    }

    if (opts.pathPrefix) {
        signaturePath = opts.pathPrefix;
        extraParams.push(['token_path', opts.pathPrefix]);
    }

    extraParams.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    const parameterData = extraParams.map(([k, v]) => `${k}=${v}`).join('&');

    const clientIp = LOCK_TO_IP ? normalizeIp(opts.clientIp) : '';

    const hashableBase = securityKey + signaturePath + expires + clientIp + parameterData;

    const token = crypto.createHash('sha256')
        .update(hashableBase, 'utf8')
        .digest('base64')
        .replace(/\n/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    const out = new URLSearchParams();
    for (const [k, v] of extraParams) out.append(k, v);
    out.append('token', token);
    out.append('expires', String(expires));

    return `${parsed.origin}${parsed.pathname}?${out.toString()}`;
}

/**
 * Express gives IPv4 clients behind a proxy the IPv4-mapped IPv6 form
 * (::ffff:1.2.3.4); Bunny's edge compares against the plain address.
 */
function normalizeIp(ip) {
    if (!ip) return '';
    const s = String(ip).trim();
    const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    return mapped ? mapped[1] : s;
}

/** The viewer's real IP, honouring the `trust proxy` setting in server.js. */
function clientIpFromRequest(req) {
    if (!req) return '';
    return normalizeIp(req.ip || req.connection?.remoteAddress || '');
}

module.exports = {
    signBunnyUrl,
    isTokenAuthHost,
    clientIpFromRequest,
    LOCK_TO_IP,
    DEFAULT_TTL_SECONDS
};
