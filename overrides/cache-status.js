/* ES5 cache UI. Receives only the selected same-origin iframe's messages. */
(function () {
    'use strict';
    var status = document.getElementById('cacheStatus'), fill = document.getElementById('progressFill');
    var frame = document.getElementById('cacheFrame'), retry = document.getElementById('bx-cache-retry');
    var back = document.getElementById('bx-cache-back'), progress = document.getElementById('bx-cache-progress');
    if (!status || !fill || !frame || !retry || !back) return;
    var finished = false, failed = false;
    var origin = window.location.protocol + '//' + window.location.host;
    var destination = typeof mainPage === 'string' ? mainPage : './';
    back.href = destination;
    function error(reason) {
        if (finished || failed) return;
        failed = true;
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
            finished = true; fill.style.width = '100%';
            if (progress) progress.setAttribute('aria-valuenow', '100');
            status.textContent = 'Cache atualizado. Voltando ao site...';
            window.setTimeout(function () { window.location.replace(destination); }, 1000);
        } else if (data.type === 'CACHE_PROGRESS') {
            if (typeof data.percent === 'number' && isFinite(data.percent) && data.percent >= 0 && data.percent <= 100) {
                var percent = Math.round(data.percent);
                fill.style.width = percent + '%';
                if (progress) progress.setAttribute('aria-valuenow', String(percent));
                status.textContent = 'Baixando arquivos... ' + percent + '%';
            } else if (data.percent === -1 && typeof data.loaded === 'number' && typeof data.total === 'number' &&
                       isFinite(data.loaded) && isFinite(data.total) && data.loaded >= 0 && data.total >= data.loaded) {
                status.textContent = 'Baixando arquivos... ' + Math.floor(data.loaded) + ' de ' + Math.floor(data.total);
            }
        } else if (data.type === 'CACHE_CHECKING') {
            status.textContent = 'Verificando arquivos do cache...';
        } else if (data.type === 'CACHE_DOWNLOADING') {
            status.textContent = 'Salvando arquivos para uso offline...';
        }
    }, false);
    frame.onerror = function () { error('Não foi possível abrir a página de cache.'); };
    if (!window.applicationCache) {
        error('Este navegador não oferece o cache offline usado pelo PS4. Use Voltar ao site.');
        return;
    }
    try {
        var firmware = getPs4FwVersion();
        status.textContent = 'Iniciando atualização do cache para o firmware ' + (firmware || 'não identificado') + '...';
        frame.src = getCachePage(firmware);
    } catch (e) {
        error('Não foi possível preparar a página de cache neste navegador.');
    }
})();
