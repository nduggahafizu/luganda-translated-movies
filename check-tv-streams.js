// Node.js script to check if Uganda TV station streams are online (HTTP 200)
const https = require('https');
const http = require('http');

const streams = {
  "ntv-uganda": [
    "https://stream.ntvuganda.co.ug/live/ntv/index.m3u8",
    "https://bcovlive-a.akamaihd.net/b4e4e5e5e5e5e5e5e5e5e5e5e5e5e5e5/us-east-1/6314071972001/playlist.m3u8",
    "https://ythls-v3.onrender.com/channel/UCwga1dPCqBddbtq5KYRii2g.m3u8",
    "https://ythls.armelin.one/channel/UCwga1dPCqBddbtq5KYRii2g.m3u8"
  ],
  "nbs-tv": [
    "https://stream.nbstv.co.ug/live/nbs/index.m3u8",
    "https://ythls-v3.onrender.com/channel/UCT0bVGYRe-Qg_CAjJ7RQb0g.m3u8",
    "https://ythls.armelin.one/channel/UCT0bVGYRe-Qg_CAjJ7RQb0g.m3u8"
  ],
  "ubc-tv": [
    "https://webstreaming.viewmedia.tv/web_013/Stream/playlist.m3u8",
    "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8",
    "https://ythls.armelin.one/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
  ],
  "bukedde-tv": [
    "https://stream.bukeddetv.co.ug/live/bukedde/index.m3u8",
    "https://ythls-v3.onrender.com/channel/UCouBdXAhnJbVpXlLi5YYkxg.m3u8",
    "https://ythls.armelin.one/channel/UCouBdXAhnJbVpXlLi5YYkxg.m3u8"
  ],
  "urban-tv": [
    "https://stream.urbantv.co.ug/live/urban/index.m3u8",
    "https://ythls-v3.onrender.com/channel/UCxS3-UXJjVdOZmnPpzgRXOg.m3u8",
    "https://ythls.armelin.one/channel/UCxS3-UXJjVdOZmnPpzgRXOg.m3u8"
  ],
  "spark-tv": [
    "https://stream.sparktv.co.ug/live/spark/index.m3u8",
    "https://webstreaming.viewmedia.tv/web_016/Stream/playlist.m3u8",
    "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
  ],
  "tv-west": [
    "https://webstreaming.viewmedia.tv/web_017/Stream/playlist.m3u8",
    "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
  ],
  "salt-tv": [
    "https://webstreaming.viewmedia.tv/web_018/Stream/playlist.m3u8",
    "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
  ],
  "tv-east": [
    "https://webstreaming.viewmedia.tv/web_019/Stream/playlist.m3u8",
    "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
  ],
  "bbs-tv": [
    "https://stream.bbstv.co.ug/live/bbs/index.m3u8",
    "https://ythls-v3.onrender.com/channel/UCgLpjHjfGTbBBi5T5JaBcKg.m3u8",
    "https://ythls.armelin.one/channel/UCgLpjHjfGTbBBi5T5JaBcKg.m3u8"
  ],
  "tv-north": [
    "https://webstreaming.viewmedia.tv/web_021/Stream/playlist.m3u8",
    "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
  ],
  "wan-luo-tv": [
    "https://webstreaming.viewmedia.tv/web_022/Stream/playlist.m3u8",
    "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
  ]
};

function checkUrl(url) {
  return new Promise(resolve => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(url, { method: 'HEAD', timeout: 5000 }, res => {
      resolve(res.statusCode);
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

(async () => {
  for (const [station, urls] of Object.entries(streams)) {
    for (const url of urls) {
      const status = await checkUrl(url);
      console.log(`${station}: ${url} => ${status === 200 ? 'ONLINE' : status ? 'Status ' + status : 'OFFLINE/NO RESPONSE'}`);
    }
  }
})();
