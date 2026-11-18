/* ES5 cache page, protocol 2: one attempt, selected iframe, exact publication. */
(function () {
    'use strict';
    var status = document.getElementById('cacheStatus'), fill = document.getElementById('progressFill');
    var frame = document.getElementById('cacheFrame'), retry = document.getElementById('bx-cache-retry');
    var back = document.getElementById('bx-cache-back'), progress = document.getElementById('bx-cache-progress');
    if (!status || !fill || !frame || !retry || !back) return;
    var revision = document.documentElement.getAttribute('data-bx-cache-revision') || '';
    var origin = window.location.protocol + '//' + window.location.host;
    var finished = false, failed = false, hidden = false, warned = false, idle = null, returning = null, returnToken = 0, lastPercent = 0;
    var destination = typeof mainPage === 'string' ? mainPage : './';
    if (/^(?:[a-z]+:|\/\/)/i.test(destination)) destination = './';
    var hashAt = destination.indexOf('#'), path = hashAt < 0 ? destination : destination.substring(0, hashAt);
    var hash = hashAt < 0 ? '' : destination.substring(hashAt);
    var returnTo = path + (path.indexOf('?') < 0 ? '?' : '&') + 'cacheReturn=1' + hash;
    back.href = returnTo;
    function stopIdle() { if (idle !== null) { window.clearTimeout(idle); idle = null; } }
    function actions(visible) { retry.hidden = !visible; retry.style.display = visible ? 'inline-block' : 'none'; }
    function error(reason) {
        if (finished || failed) return;
        failed = true; stopIdle();
        status.textContent = 'Não foi possível atualizar o cache.\n' + reason + '\nConfira a conexão e tente novamente. Esta mensagem ficará visível.';
        actions(true);
    }
    function activity() {
        stopIdle();
        if (finished || failed || hidden) return;
        if (warned) { warned = false; actions(false); }
        idle = window.setTimeout(function () {
            idle = null;
            if (finished || failed || hidden) return;
            warned = true;
            status.textContent = 'O cache está há 90 segundos sem informar progresso. Você pode aguardar, tentar novamente ou usar Voltar ao site. A conclusão ainda não foi confirmada.';
            actions(true);
        }, 90000);
    }
    retry.onclick = function () { window.location.reload(); };
    window.addEventListener('message', function (event) {
        if (event.source !== frame.contentWindow || event.origin !== origin || finished || failed) return;
        var data = event.data;
        if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;
        if (data.protocol !== 2 || data.revision !== revision) {
            if (data.type === 'CACHE_COMPLETE' || data.type === 'CACHE_EXISTS') error('A página de cache pertence a outra publicação. Reabra o host online para carregar os arquivos atuais.');
            return;
        }
        if (hidden && data.type !== 'CACHE_COMPLETE' && data.type !== 'CACHE_EXISTS') return;
        if (data.type === 'CACHE_ERROR') {
            error(typeof data.reason === 'string' ? data.reason.slice(0,350) : 'O navegador informou uma falha no cache.');
        } else if (data.type === 'CACHE_COMPLETE' || data.type === 'CACHE_EXISTS') {
            finished = true; stopIdle(); actions(false); fill.style.width = '100%';
            if (progress) progress.setAttribute('aria-valuenow','100');
            status.textContent = hidden ? 'Cache atualizado. Use Voltar ao site.' : 'Cache atualizado. Voltando ao site...';
            if (hidden) return;
            var token = ++returnToken;
            returning = window.setTimeout(function () {
                returning = null;
                if (hidden || token !== returnToken) return;
                try { window.location.replace(returnTo); }
                catch (e) { status.textContent = 'Cache atualizado. Não foi possível voltar automaticamente. Use Voltar ao site.'; }
            },1000);
        } else if (data.type === 'CACHE_PROGRESS') {
            if (typeof data.percent === 'number' && isFinite(data.percent) && data.percent >= 0 && data.percent <= 100) {
                var percent = Math.round(data.percent); if (percent < lastPercent) return; lastPercent = percent;
                activity(); fill.style.width = percent + '%';
                if (progress) progress.setAttribute('aria-valuenow',String(percent));
                status.textContent = 'Baixando arquivos... ' + percent + '%';
            } else if (data.percent === -1 && typeof data.loaded === 'number' && typeof data.total === 'number' &&
                       isFinite(data.loaded) && isFinite(data.total) && data.loaded >= 0 && data.total >= data.loaded) {
                activity(); status.textContent = 'Baixando arquivos... ' + Math.floor(data.loaded) + ' de ' + Math.floor(data.total);
            }
        } else if (data.type === 'CACHE_CHECKING') { activity(); status.textContent = 'Verificando arquivos do cache...'; }
        else if (data.type === 'CACHE_DOWNLOADING') { activity(); status.textContent = 'Salvando arquivos para uso offline...'; }
    },false);
    function begin() {
        if (finished || failed) return;
        try {
            var firmware = getPs4FwVersion(), page = getCachePage(firmware);
            if (!/^\.\/includes\/caches\/cache[\w.-]+\.html$/.test(page)) throw Error('Invalid cache page');
            if (typeof isFirmwareSupported === 'function' && !isFirmwareSupported(firmware)) throw Error('Unsupported firmware');
            status.textContent = 'Iniciando atualização do cache para o firmware ' + (firmware || 'não identificado') + '...';
            frame.src = page + '?bxCacheRevision=' + encodeURIComponent(revision); activity();
        } catch (e) { error('Não foi possível preparar a página de cache neste navegador.'); }
    }
    window.addEventListener('pagehide',function () { hidden = true; returnToken++; stopIdle(); if (returning !== null) { window.clearTimeout(returning); returning = null; } },false);
    window.addEventListener('pageshow',function (event) { if (event && event.persisted) { hidden = false; if (finished) status.textContent = 'Cache atualizado. Use Voltar ao site.'; else begin(); } },false);
    frame.onerror = function () { error('Não foi possível abrir a página de cache.'); };
    if (!window.applicationCache) { error('Este navegador não oferece o cache offline usado pelo PS4. Use Voltar ao site.'); return; }
    if (!/^[a-f0-9]{40}$/.test(revision) && revision !== 'local-build') { error('A publicação não informou uma versão de cache válida.'); return; }
    begin();
})();
