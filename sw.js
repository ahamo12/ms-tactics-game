/* MS戦術シミュレーション（キャラ×機体） Service Worker
   ゲーム本体と画像をキャッシュし、オフラインでも開けるようにします。
   このファイルは assets/ 配下に置かれるため、パスはすべて相対指定です。 */
var CACHE_NAME = 'ms-tactics-v4';
var PRECACHE = [
  '../index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './hq-musai.webp',
  './hq-whitebase.webp',
  './ms-agguguy.webp',
  './ms-ball.webp',
  './ms-bigzam.webp',
  './ms-brawbro.webp',
  './ms-chargelgoog.webp',
  './ms-charzaku.webp',
  './ms-charzgok.webp',
  './ms-corefighter.webp',
  './ms-dom.webp',
  './ms-domtropen.webp',
  './ms-elmeth.webp',
  './ms-gelgoog.webp',
  './ms-gelgooghm.webp',
  './ms-giradoga.webp',
  './ms-gm.webp',
  './ms-gogg.webp',
  './ms-gouf.webp',
  './ms-goufcustom.webp',
  './ms-guncannon.webp',
  './ms-gundam.webp',
  './ms-guntank.webp',
  './ms-gyan.webp',
  './ms-hygogg.webp',
  './ms-jagddoga.webp',
  './ms-jegan.webp',
  './ms-nu.webp',
  './ms-rickdom.webp',
  './ms-sazabi.webp',
  './ms-zaku2.webp',
  './ms-zakufz.webp',
  './ms-zeong.webp',
  './ms-zgok.webp',
  './pilot-amuro.webp',
  './pilot-bright.webp',
  './pilot-challia.webp',
  './pilot-char.webp',
  './pilot-cozun.webp',
  './pilot-denim.webp',
  './pilot-doan.webp',
  './pilot-dozle.webp',
  './pilot-dren.webp',
  './pilot-fraw.webp',
  './pilot-gaia.webp',
  './pilot-garma.webp',
  './pilot-gene.webp',
  './pilot-hamon.webp',
  './pilot-hayato.webp',
  './pilot-kai.webp',
  './pilot-katz.webp',
  './pilot-kycilia.webp',
  './pilot-lalah.webp',
  './pilot-mash.webp',
  './pilot-mirai.webp',
  './pilot-mquve.webp',
  './pilot-ortega.webp',
  './pilot-ramba.webp',
  './pilot-ryu.webp',
  './pilot-sayla.webp',
  './pilot-sleggar.webp',
  './pilot-slender.webp',
  './pilot-uragan.webp',
  './title-main.webp',
  './scene-loum.webp',
  './scene-colony.webp',
  './scene-odessa.webp',
  './scene-jaburo.webp',
  './scene-solomon.webp',
  './scene-lunar.webp',
  './scene-abaoku.webp',
  './scene-cca.webp'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      /* 1件失敗しても全体を止めない */
      return Promise.all(PRECACHE.map(function (url) {
        return cache.add(url).catch(function () { /* 取得できない素材はスキップ */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return key === CACHE_NAME ? null : caches.delete(key);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  /* ページ遷移：キャッシュ優先、無ければネットワーク→失敗時はキャッシュ済み本体 */
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('../index.html', { ignoreSearch: true }).then(function (cached) {
        var network = fetch(req).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put('../index.html', copy); });
          }
          return res;
        }).catch(function () { return cached; });
        return cached || network;
      })
    );
    return;
  }

  /* 静的素材：キャッシュ優先（stale-while-revalidate） */
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
