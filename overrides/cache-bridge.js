/* ES5 AppCache bridge. A swap is not completion: reload and confirm the document revision. */
(function () {
    'use strict';
    var cache = window.applicationCache, terminal = false, swapping = false;
    var root = document.documentElement;
    var revision = root.getAttribute('data-bx-cache-revision') || '';
    var origin = window.location.protocol + '//' + window.location.host;
    function send(type, detail) {
        if (terminal) return;
        var data = {type:type, protocol:2, revision:revision};
        if (detail) for (var key in detail) if (Object.prototype.hasOwnProperty.call(detail, key)) data[key] = detail[key];
        window.parent.postMessage(data, origin);
    }
    function fail(reason) { if (terminal) return; send('CACHE_ERROR', {reason:reason}); terminal = true; }
    function complete(type) { if (terminal || swapping) return; send(type); terminal = true; }
    function swap() {
        if (terminal || swapping) return;
        swapping = true;
        try { cache.swapCache(); }
        catch (error) { swapping = false; fail('Não foi possível ativar o novo cache.'); return; }
        send('CACHE_CHECKING', {reason:'Ativando os arquivos da publicação.'});
        // Only the reloaded document may confirm which release is actually loaded.
        try { window.location.reload(); }
        catch (error) { swapping = false; fail('O cache foi recebido, mas o navegador bloqueou sua reabertura.'); }
    }
    if (!cache) { fail('Este navegador não oferece o cache offline usado pelo PS4.'); return; }
    if (!/^[a-f0-9]{40}$/.test(revision) && revision !== 'local-build') { fail('A página de cache não informou uma revisão válida.'); return; }
    cache.addEventListener('checking', function () { send('CACHE_CHECKING'); }, false);
    cache.addEventListener('downloading', function () { send('CACHE_DOWNLOADING'); }, false);
    cache.addEventListener('progress', function (event) {
        var loaded = Number(event.loaded), total = Number(event.total);
        if (!isFinite(loaded) || loaded < 0) return;
        send('CACHE_PROGRESS', {percent:event.lengthComputable && total > 0 ? Math.min(100, Math.round(loaded / total * 100)) : -1,
                               loaded:loaded, total:isFinite(total) && total >= loaded ? total : loaded});
    }, false);
    cache.addEventListener('cached', function () { complete('CACHE_COMPLETE'); }, false);
    cache.addEventListener('noupdate', function () { complete('CACHE_EXISTS'); }, false);
    cache.addEventListener('updateready', swap, false);
    cache.addEventListener('obsolete', function () { fail('O manifesto de cache não está mais disponível.'); }, false);
    cache.addEventListener('error', function () { fail('O navegador não conseguiu concluir a atualização. O cache anterior não foi confirmado como atualizado.'); }, false);
    window.addEventListener('pagehide', function () { terminal = true; }, false);
    // Catch an event that occurred before this script installed its listeners.
    if (cache.status === 4) swap();
    else if (cache.status === 5) fail('O cache foi marcado como obsoleto pelo navegador.');
    else if (cache.status === 1) {
        try { cache.update(); } catch (error) { fail('Não foi possível iniciar a conferência do manifesto.'); }
    }
})();
