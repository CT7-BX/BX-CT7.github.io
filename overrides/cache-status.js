/* ES5 cache UI. Receives only the selected same-origin iframe's messages. */
(function () {
    'use strict';
    var status = document.getElementById('cacheStatus'), fill = document.getElementById('progressFill');
    var frame = document.getElementById('cacheFrame'), retry = document.getElementById('bx-cache-retry');
    var back = document.getElementById('bx-cache-back'), progress = document.getElementById('bx-cache-progress');
    if (!status || !fill || !frame || !retry || !back) return;
    var finished = false, failed = false, idleTimer = null, warned = false;
    function stopIdle() {
        if (idleTimer !== null) { window.clearTimeout(idleTimer); idleTimer = null; }
    }
    function activity() {
        stopIdle();
        if (finished || failed) return;
        if (warned) { warned = false; retry.hidden = true; retry.style.display = 'none'; }
        idleTimer = window.setTimeout(function () {
            idleTimer = null;
            if (finished || failed) return;
            warned = true;
            status.textContent = 'O cache está há 90 segundos sem informar progresso. Você pode aguardar, tentar novamente ou usar Voltar ao site. A conclusão ainda não foi confirmada.';
            retry.hidden = false; retry.style.display = 'inline-block';
        }, 90000);
    }
    var origin = window.location.protocol + '//' + window.location.host;
    var destination = typeof mainPage === 'string' ? mainPage : './';
    var hashIndex = destination.indexOf('#');
    var path = hashIndex === -1 ? destination : destination.substring(0, hashIndex);
    var hash = hashIndex === -1 ? '' : destination.substring(hashIndex);
    // Explicit return must not immediately reopen an incomplete cache attempt.
    back.href = path + (path.indexOf('?') === -1 ? '?' : '&') + 'cacheReturn=1' + hash;
    function error(reason) {
        if (finished || failed) return;
        failed = true; stopIdle();
        status.textContent = 'Não foi possível atualizar o cache.\n' + reason +
            '\nConfira a conexão e tente novamente. Esta mensagem ficará visível.';
        retry.hidden = false; retry.style.display = 'inline-block';
    }
    retry.onclick = function () { window.location.reload(); };
    window.addEventListener('message', function (event) {
        if (event.source !== frame.contentWindow || event.origin !== origin || finished || failed) return;
        var data = event.data;
        if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;
        if (data.type === 'CACHE_ERROR') {
            error(typeof data.reason === 'string' ? data.reason.slice(0, 350) : 'O navegador informou uma falha no cache.');
        } else if (data.type === 'CACHE_COMPLETE' || data.type === 'CACHE_EXISTS') {
            finished = true; stopIdle();
            retry.hidden = true; retry.style.display = 'none';
            fill.style.width = '100%';
            if (progress) progress.setAttribute('aria-valuenow', '100');
            status.textContent = 'Cache atualizado. Voltando ao site...';
            window.setTimeout(function () {
                try { window.location.replace(destination); }
                catch (e) {
                    status.textContent = 'Cache atualizado. Não foi possível voltar automaticamente. Use Voltar ao site.';
                }
            }, 1000);
        } else if (data.type === 'CACHE_PROGRESS') {
            if (typeof data.percent === 'number' && isFinite(data.percent) && data.percent >= 0 && data.percent <= 100) {
                activity();
                var percent = Math.round(data.percent);
                fill.style.width = percent + '%';
                if (progress) progress.setAttribute('aria-valuenow', String(percent));
                status.textContent = 'Baixando arquivos... ' + percent + '%';
            } else if (data.percent === -1 && typeof data.loaded === 'number' && typeof data.total === 'number' &&
                       isFinite(data.loaded) && isFinite(data.total) && data.loaded >= 0 && data.total >= data.loaded) {
                activity();
                status.textContent = 'Baixando arquivos... ' + Math.floor(data.loaded) + ' de ' + Math.floor(data.total);
            }
        } else if (data.type === 'CACHE_CHECKING') {
            activity();
            status.textContent = 'Verificando arquivos do cache...';
        } else if (data.type === 'CACHE_DOWNLOADING') {
            activity();
            status.textContent = 'Salvando arquivos para uso offline...';
        }
    }, false);
    window.addEventListener('pagehide', stopIdle, false);
    window.addEventListener('pageshow', function (event) { if (event && event.persisted) activity(); }, false);
    frame.onerror = function () { error('Não foi possível abrir a página de cache.'); };
    if (!window.applicationCache) {
        error('Este navegador não oferece o cache offline usado pelo PS4. Use Voltar ao site.');
        return;
    }
    try {
        var firmware = getPs4FwVersion();
        status.textContent = 'Iniciando atualização do cache para o firmware ' + (firmware || 'não identificado') + '...';
        frame.src = getCachePage(firmware);
        activity();
    } catch (e) {
        error('Não foi possível preparar a página de cache neste navegador.');
    }
})();
