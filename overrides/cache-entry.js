/* ES5 cache entry: no redirect loop on return and no false cache claim. */
(function () {
    'use strict';
    var resolveEntry;
    window.bxCacheEntryPending = true;
    window.bxCacheEntryReady = new Promise(function (resolve) { resolveEntry = resolve; });
    function complete(ready) { window.bxCacheEntryPending = !ready; resolveEntry(ready); }
    window.addEventListener('load', function () {
        var returning = typeof getQueryParam === 'function' && getQueryParam('cacheReturn') === '1';
        if (returning) {
            try {
                var parts = window.location.search.substring(1).split('&'), keep = [];
                for (var i = 0; i < parts.length; i++) {
                    if (!parts[i]) continue;
                    var key = parts[i].split('=')[0];
                    try { key = decodeURIComponent(key); } catch (ignore) {}
                    if (key !== 'cacheReturn') keep.push(parts[i]);
                }
                if (window.history && window.history.replaceState) window.history.replaceState(null, '',
                    window.location.pathname + (keep.length ? '?' + keep.join('&') : '') + window.location.hash);
            } catch (ignore) {}
            complete(true); return;
        }
        if (typeof isPS4Console !== 'function' || !isPS4Console() ||
            (typeof devMode !== 'undefined' && devMode)) { complete(true); return; }
        var cache = window.applicationCache;
        // Unsupported/offline browsers must not be trapped in an unavailable cache page.
        if (!cache || (typeof navigator !== 'undefined' && navigator.onLine === false)) { complete(true); return; }
        if (cache.status === 0) {
            complete(false);
            var target = testModeUrl('./cache.html');
            window.location.href = target + (target.indexOf('?') < 0 ? '?' : '&') + 'bxCacheRequest=' + new Date().getTime();
        } else complete(true);
    }, false);
})();
function terminateCache() {
    var cache = window.applicationCache;
    if (cache && (cache.status === 2 || cache.status === 3)) {
        try { cache.abort(); } catch (ignore) {}
    }
}
