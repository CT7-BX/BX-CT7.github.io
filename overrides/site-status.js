/* Read-only release/network status. ES5, no payload or kernel access.
 * One request per explicit check; never refreshes or clears cache automatically. */
(function () {
    'use strict';
    var active = null, serial = 0;
    function id(name) { return document.getElementById(name); }
    function text(node, value) { if (node) node.textContent = value; }
    function network() {
        text(id('bx-site-network'), navigator.onLine === false ? 'Navegador indica: offline' :
             navigator.onLine === true ? 'Navegador indica: online' : 'Rede não informada');
    }
    function init() {
        var box = id('bx-site-status'), button = id('bx-site-check'), message = id('bx-site-message');
        if (!box || !button || !message) return;
        var revision = box.getAttribute('data-revision');
        network();
        window.addEventListener('online', network, false);
        window.addEventListener('offline', network, false);
        button.onclick = function () {
            var current = ++serial, done = false;
            if (active) { try { active.abort(); } catch (ignore) {} }
            text(message, 'Consultando a versão publicada...');
            var request;
            function finish(value) {
                if (done || current !== serial) return;
                done = true; active = null; text(message, value);
            }
            try {
                request = new XMLHttpRequest(); active = request;
                request.open('GET', './release.json?check=' + new Date().getTime(), true);
                request.timeout = 10000;
                request.onreadystatechange = function () {
                    if (request.readyState !== 4 || current !== serial || done) return;
                    if (request.status === 0) return; // onerror/ontimeout provide the precise failure.
                    if (request.status < 200 || request.status >= 300) {
                        finish('Não foi possível conferir a publicação (HTTP ' + request.status + ').'); return;
                    }
                    try {
                        var data = JSON.parse(request.responseText);
                        if (!data || data.schema_version !== 1 || typeof data.revision !== 'string' ||
                            !/^[a-f0-9]{40}$/.test(data.revision)) throw new Error('Invalid release');
                        if (!/^[a-f0-9]{40}$/.test(revision)) {
                            finish('Build local; comparação de publicação indisponível.');
                        } else if (data.revision === revision) {
                            finish('Esta página corresponde à publicação ' + data.revision.slice(0, 7) + '.');
                        } else {
                            finish('Há uma publicação diferente (' + data.revision.slice(0, 7) +
                                   '). Com internet, use Atualizar cache e reabra o site.');
                        }
                    } catch (error) { finish('A resposta de versão está inválida. Tente novamente.'); }
                };
                request.onerror = function () { finish('Sem resposta da rede. A versão carregada continua disponível.'); };
                request.ontimeout = function () { finish('A consulta demorou demais. Tente novamente com internet.'); };
                request.send(null);
            } catch (error) { finish('A consulta não está disponível neste navegador.'); }
        };
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, false);
    else init();
})();
