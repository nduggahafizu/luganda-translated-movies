const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * Presigned R2 GET URLs that force a download.
 *
 * The public pub-*.r2.dev URL is perfect for *playback* (direct, cached, free
 * egress) but it serves the object inline with its stored content-type, so a
 * browser just plays the .mp4 instead of saving it. R2 ignores a ?download=
 * query param — that convention is only honoured by our own proxy.
 *
 * To force a real download from a cross-origin URL the *response* must carry
 * Content-Disposition: attachment. R2 honours response-content-disposition on a
 * presigned GET, so we re-point the public URL at the S3 endpoint and sign it
 * with the attachment header. Playback keeps using the plain public URL.
 *
 * Inert (returns null) until the R2_* credentials are configured, so nothing
 * changes until R2 is actually set up.
 */

const TTL_SECONDS = Number(process.env.R2_URL_TTL_SECONDS) || 6 * 60 * 60;

const CONTENT_TYPES = {
    '.mp4': 'video/mp4',
    '.m4v': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo'
};

let clientCache = null;

function client() {
    if (clientCache) return clientCache;
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID ||
        !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
        return null;
    }
    clientCache = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
        },
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED'
    });
    return clientCache;
}

/** Is this one of our R2 public URLs (pub-*.r2.dev / custom r2.dev domain)? */
function isR2PublicUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return false;
    try {
        return new URL(rawUrl).hostname.toLowerCase().endsWith('.r2.dev');
    } catch (e) {
        return false;
    }
}

/** The object key is the URL path (decoded to literal bytes, no leading slash). */
function keyFromUrl(rawUrl) {
    try {
        const u = new URL(rawUrl);
        let p;
        try { p = decodeURIComponent(u.pathname); } catch (e) { p = u.pathname; }
        return p.replace(/^\/+/, '');
    } catch (e) {
        return null;
    }
}

/**
 * Presign a GET for the given R2 public URL that downloads instead of playing.
 * Returns null when it isn't an R2 URL or no credentials are configured.
 */
async function signR2DownloadUrl(rawUrl, downloadName) {
    const s3 = client();
    if (!s3) return null;
    if (!isR2PublicUrl(rawUrl)) return null;

    const key = keyFromUrl(rawUrl);
    if (!key) return null;

    const ext = path.extname(key).toLowerCase();
    const safeName = downloadName
        ? String(downloadName).replace(/[^a-zA-Z0-9._\- ]/g, '').trim()
        : '';
    const disposition = safeName
        ? `attachment; filename="${safeName}"`
        : 'attachment';

    const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: disposition,
        ResponseContentType: CONTENT_TYPES[ext] || 'application/octet-stream'
    });

    try {
        return await getSignedUrl(s3, command, { expiresIn: TTL_SECONDS });
    } catch (e) {
        console.error('r2Sign: could not presign', key, e.message);
        return null;
    }
}

module.exports = { signR2DownloadUrl, isR2PublicUrl };
