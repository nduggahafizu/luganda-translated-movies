// Node.js script to download Uganda TV station logos from Wikipedia/official sources
const fs = require('fs');
const https = require('https');
const path = require('path');

const logos = {
  "ntv-uganda": "https://upload.wikimedia.org/wikipedia/commons/f/f8/NTV_Uganda_logo.png",
  "nbs-tv": "https://upload.wikimedia.org/wikipedia/en/d/d7/NBS_Television_logo.png",
  "ubc-tv": "https://upload.wikimedia.org/wikipedia/en/6/6f/Uganda_Broadcasting_Corporation_logo.png",
  "bukedde-tv": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Bukedde_TV_logo.png",
  "urban-tv": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Urban_TV_Uganda_logo.png",
  "spark-tv": "https://upload.wikimedia.org/wikipedia/commons/7/7d/Spark_TV_Uganda_logo.png",
  "tv-west": "https://upload.wikimedia.org/wikipedia/commons/2/2c/TV_West_Uganda_logo.png",
  "salt-tv": "https://saltmedia.ug/images/logo.png",
  "tv-east": "https://upload.wikimedia.org/wikipedia/commons/7/7e/TV_East_Uganda_logo.png",
  "bbs-tv": "https://upload.wikimedia.org/wikipedia/commons/2/2d/BBS_Television_logo.png",
  "tv-north": "https://upload.wikimedia.org/wikipedia/commons/6/6a/TV_North_Uganda_logo.png",
  "wan-luo-tv": "https://upload.wikimedia.org/wikipedia/commons/2/2b/Wan_Luo_TV_logo.png"
};

const destDir = path.join(__dirname, 'assets', 'tv-logos');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

function download(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  https.get(url, response => {
    if (response.statusCode !== 200) {
      file.close();
      fs.unlink(dest, () => {});
      return cb(new Error(`Failed to get '${url}' (${response.statusCode})`));
    }
    response.pipe(file);
    file.on('finish', () => file.close(cb));
  }).on('error', err => {
    file.close();
    fs.unlink(dest, () => {});
    cb(err);
  });
}

(async () => {
  for (const [id, url] of Object.entries(logos)) {
    const dest = path.join(destDir, `${id}.png`);
    console.log(`Downloading ${id}...`);
    await new Promise((resolve, reject) => {
      download(url, dest, err => {
        if (err) {
          console.error(`Failed to download ${id}: ${err.message}`);
        } else {
          console.log(`Saved ${id} logo.`);
        }
        resolve();
      });
    });
  }
  console.log('All downloads complete.');
})();
