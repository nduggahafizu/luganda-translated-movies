/**
 * Stand-alone MKV/AVI → MP4 converter — the same engine and logic the Telegram
 * bot uses, but for converting files by hand on your PC.
 *
 * It picks the fastest safe path automatically:
 *   - H.264 + AAC            -> remux (copy), full quality, seconds
 *   - H.264 + other audio    -> copy video, re-encode audio to AAC
 *   - HEVC / other video     -> full transcode to H.264/AAC (slow; required,
 *                               because browsers/phones can't play HEVC)
 *
 * Output goes to a "converted" folder next to the file(s), as browser-ready
 * MP4 (faststart). Upload those MP4s through the admin panel.
 *
 * Usage (from the server folder):
 *   node tools/convert.js "C:\path\movie.mkv"
 *   node tools/convert.js "C:\path\movie1.mkv" "C:\path\movie2.avi"
 *   node tools/convert.js "C:\path\to\folder"      (converts every video in it)
 * Or just drag video files onto tools\convert-mp4.bat
 */

const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(require('@ffmpeg-installer/ffmpeg').path);
ffmpeg.setFfprobePath(require('@ffprobe-installer/ffprobe').path);

const VIDEO_EXTS = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.flv', '.wmv', '.ts', '.3gp'];
const BROWSER_SAFE = new Set(['.mp4', '.m4v', '.webm']);

function probe(file) {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(file, (err, data) => {
            if (err || !data) return resolve(null);
            const s = data.streams || [];
            const v = s.find(x => x.codec_type === 'video');
            const a = s.find(x => x.codec_type === 'audio');
            resolve({ v: (v && v.codec_name) || '', a: (a && a.codec_name) || '' });
        });
    });
}

async function convertOne(input, outDir) {
    const ext = path.extname(input).toLowerCase();
    const out = path.join(outDir, path.basename(input, path.extname(input)) + '.mp4');

    const c = await probe(input);
    if (!c) { console.log('  could not read this file — skipping'); return null; }
    const vOk = /^(h264|avc)/i.test(c.v);
    const aOk = /^aac/i.test(c.a);

    // Already a web-ready MP4/WebM with the right codecs: just copy it over.
    if (BROWSER_SAFE.has(ext) && vOk && aOk) {
        console.log('  already web-ready — copying as-is');
        fs.copyFileSync(input, out);
        console.log('  done -> ' + out);
        return out;
    }

    await new Promise((resolve, reject) => {
        let cmd = ffmpeg(input);
        if (vOk && aOk) {
            console.log('  remux (copy) — full quality, fast');
            cmd = cmd.videoCodec('copy').audioCodec('copy');
        } else if (vOk) {
            console.log('  copy video (full quality), re-encode audio -> AAC');
            cmd = cmd.videoCodec('copy').audioCodec('aac').audioBitrate('192k');
        } else {
            console.log(`  full transcode -> H.264/AAC (slow; source video = ${c.v || '?'})`);
            cmd = cmd.videoCodec('libx264').audioCodec('aac').audioBitrate('192k')
                     .outputOptions(['-preset veryfast', '-crf 23']);
        }
        let last = -10;
        cmd.outputOptions(['-movflags +faststart'])
            .on('progress', p => { if (p.percent && p.percent >= last + 10) { last = p.percent; process.stdout.write(`  ${Math.floor(p.percent)}%\r`); } })
            .on('end', () => { console.log('  done -> ' + out); resolve(); })
            .on('error', err => reject(err))
            .save(out);
    });
    return out;
}

(async () => {
    const args = process.argv.slice(2);
    if (!args.length) {
        console.log('Usage: node tools/convert.js <file-or-folder> [more files...]');
        console.log('   or: drag video files onto tools\\convert-mp4.bat');
        process.exit(1);
    }

    const files = [];
    for (const a of args) {
        let st;
        try { st = fs.statSync(a); } catch (e) { console.log('skip (not found): ' + a); continue; }
        if (st.isDirectory()) {
            for (const f of fs.readdirSync(a)) {
                if (VIDEO_EXTS.includes(path.extname(f).toLowerCase())) files.push(path.join(a, f));
            }
        } else {
            files.push(a);
        }
    }
    if (!files.length) { console.log('No video files found.'); process.exit(1); }

    const outDir = path.join(path.dirname(files[0]), 'converted');
    fs.mkdirSync(outDir, { recursive: true });
    console.log(`\nConverting ${files.length} file(s)  ->  ${outDir}\n`);

    let ok = 0, fail = 0;
    for (const f of files) {
        console.log(path.basename(f));
        try { if (await convertOne(f, outDir)) ok++; else fail++; }
        catch (e) { console.log('  FAILED: ' + (e.message || e)); fail++; }
    }
    console.log(`\nFinished: ${ok} converted, ${fail} failed.`);
    console.log(`MP4s are in: ${outDir}`);
    console.log('Upload them via the admin panel (they stream + download fine).');
})();
