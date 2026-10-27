const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * Wasabi S3 presigned URLs for direct browser playback and download.
 *
 * Background: the catalogue stores CDN URLs like
 *   https://jimmy.pearlpix.xyz/VJ ICE P/28.Years.Later.mkv
 * That hostname is Cloudflare in front of a Backblaze B2 origin whose account
 * is suspended, so it returns 403 "account_trouble" for every path — including
 * paths that don't exist. The files themselves were moved to Wasabi and are
 * fine; only the hostname still points at the dead origin.
 *
 * The bucket is named after the hostname, so the mapping is mechanical:
 *   https://<host>/<path>  ->  bucket <host>, key <path>
 * Verified: an unsigned request for that bucket returns AccessDenied ("Public
 * use of objects is not allowed by this account") while a made-up bucket
 * returns NoSuchBucket — the bucket exists and is simply private.
 *
 * Configure with:
 *   WASABI_ACCESS_KEY / WASABI_SECRET_KEY   credentials for that account
 *   WASABI_BUCKET_HOSTS                     comma-separated hostnames whose
 *                                           content lives in a same-named bucket
 *   WASABI_REGION                           default eu-west-1
 *   WASABI_URL_TTL_SECONDS                  default 6h
 *
 * Without credentials every function here no-ops, so the app behaves exactly
 * as it does today until the account details are actually set.
 */

const REGION = process.env.WASABI_REGION || 'eu-west-1';
const DEFAULT_TTL_SECONDS = Number(process.env.WASABI_URL_TTL_SECONDS) || 6 * 60 * 60;

// Wasabi's S3 endpoint for the region. Bucket goes in the path, not the
// hostname: these bucket names contain dots, which breaks TLS for
// virtual-hosted style (a wildcard cert matches one label, not "a.b.c").
const ENDPOINT = `https://s3.${REGION}.wasabisys.com`;

// The browser needs a real media type. Wasabi stores these objects as
// binary/octet-stream, which a <video> element can refuse outright, so the
// signed URL overrides it via response-content-type.
const CONTENT_TYPES = {
    '.mp4': 'video/mp4',
    '.m4v': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime'
};

let clientCache = null;
let hostCache = null;

function credentials() {
    const accessKeyId = process.env.WASABI_ACCESS_KEY;
    const secretAccessKey = process.env.WASABI_SECRET_KEY;
    return accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : null;
}

function client() {
    if (clientCache) return clientCache;
    const creds = credentials();
    if (!creds) return null;
    clientCache = new S3Client({
        region: REGION,
        endpoint: ENDPOINT,
        credentials: creds,
        forcePathStyle: true
    });
    return clientCache;
}

function bucketHosts() {
    if (hostCache) return hostCache;
    hostCache = new Set(
        String(process.env.WASABI_BUCKET_HOSTS || '')
            .split(',')
            .map(h => h.trim().toLowerCase())
            .filter(Boolean)
    );
    return hostCache;
}

/** Is this a URL we can re-point at Wasabi and sign? */
function isWasabiBackedUrl(rawUrl) {
    return !!toBucketAndKey(rawUrl);
}

/**
 * Work out the bucket and object key for a stored URL. Handles both shapes:
 *   https://jimmy.pearlpix.xyz/a/b.mp4            -> bucket from hostname
 *   https://s3.eu-west-1.wasabisys.com/buck/a.mp4 -> bucket from first path segment
 */
function toBucketAndKey(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;

    let parsed;
    try {
        parsed = new URL(rawUrl.trim());
    } catch (e) {
        return null;
    }

    const host = parsed.hostname.toLowerCase();
    // S3 keys are literal bytes: a stored ".../WEEK%206/x.mp4" is the key
    // "WEEK 6/x.mp4". Sign the decoded form and let the SDK re-encode, or the
    // signature covers a path the object doesn't have.
    let pathname;
    try {
        pathname = decodeURIComponent(parsed.pathname);
    } catch (e) {
        pathname = parsed.pathname;
    }

    if (host === `s3.${REGION}.wasabisys.com` || /^s3\.[a-z0-9-]+\.wasabisys\.com$/.test(host)) {
        const segments = pathname.replace(/^\/+/, '').split('/');
        const bucket = segments.shift();
        const key = segments.join('/');
        return bucket && key ? { bucket, key } : null;
    }

    if (bucketHosts().has(host)) {
        const key = pathname.replace(/^\/+/, '');
        return key ? { bucket: host, key } : null;
    }

    return null;
}

/**
 * Presign a stored catalogue URL so the browser can fetch it straight from
 * Wasabi. Returns null when this isn't a Wasabi-backed URL or no credentials
 * are configured, in which case the caller should fall back to its existing
 * behaviour.
 *
 * @param {string} rawUrl             the URL as stored in the catalogue
 * @param {object} [opts]
 * @param {string} [opts.downloadName] filename to force a save-as instead of
 *                                     inline playback
 * @param {number} [opts.ttlSeconds]   how long the link stays valid
 */
async function signWasabiUrl(rawUrl, opts = {}) {
    const s3 = client();
    if (!s3) return null;

    const target = toBucketAndKey(rawUrl);
    if (!target) return null;

    const ext = path.extname(target.key).toLowerCase();
    const ttl = Number(opts.ttlSeconds) > 0 ? Number(opts.ttlSeconds) : DEFAULT_TTL_SECONDS;

    // Wasabi honours response-content-disposition (verified against a live
    // object), so a download saves straight from storage — no proxying the
    // bytes through this server just to attach a header.
    const disposition = opts.downloadName
        ? `attachment; filename="${String(opts.downloadName).replace(/[^a-zA-Z0-9._\- ]/g, '')}"`
        : 'inline';

    const command = new GetObjectCommand({
        Bucket: target.bucket,
        Key: target.key,
        ResponseContentDisposition: disposition,
        ResponseContentType: CONTENT_TYPES[ext] || 'video/mp4'
    });

    try {
        return await getSignedUrl(s3, command, { expiresIn: ttl });
    } catch (e) {
        console.error('wasabiSign: could not presign', target.bucket, e.message);
        return null;
    }
}

module.exports = {
    signWasabiUrl,
    isWasabiBackedUrl,
    toBucketAndKey,
    DEFAULT_TTL_SECONDS
};
