/* ES5 release check on opening and every 10 seconds, including hidden tabs.
 * Background timer delivery remains subject to browser throttling.
 * Updates only after an explicit button click.
 * Never executes payloads or changes the original PS4 cache implementation. */
(function () {
    'use strict';
    var active = null, serial = 0;
    function id(name) { return document.getElementById(name); }
    function text(node, value) { if (node && node.textContent !== value) node.textContent = value; }
    function init() {
        var box = id('bx-site-status'), button = id('bx-site-check'), message = id('bx-site-message');
        if (!box || !button || !message) return;
        var revision = box.getAttribute('data-revision'), available = false;
        var timer = null, stopped = true, updating = false, firstCheck = true;
        function stop() {
            stopped = true; ++serial;
            if (timer !== null) { window.clearInterval(timer); timer = null; }
            if (active) { try { active.abort(); } catch (ignore) {} active = null; }
        }
        function start() {
            if (timer !== null || updating) return;
            stopped = false;
            check();
            timer = window.setInterval(check, 10000);
        }
        function state(name, title, detail) {
            available = name === 'available';
            box.setAttribute('data-update-state', name);
            text(id('bx-site-revision'), title); text(message, detail);
            button.disabled = !available; button.hidden = !available;
            button.style.display = available ? 'inline-block' : 'none';
            text(button, 'Atualizar agora');
        }
        function network() {
            text(id('bx-site-network'), navigator.onLine === false ? 'Sem conexão' :
                 navigator.onLine === true ? 'Conexão informada: online' : 'Rede não informada');
        }
        function check() {
            if (stopped || updating) return;
            var current = ++serial, done = false;
            if (active) { try { active.abort(); } catch (ignore) {} }
            active = null; network();
            if (navigator.onLine === false) {
                state('offline', 'Não foi possível verificar',
                      'Você está sem conexão. A verificação acontecerá quando a rede voltar.');
                return;
            }
            if (firstCheck) {
                firstCheck = false;
                state('checking', 'Verificando atualização...', 'Conferindo se existe uma nova versão do site.');
            }
            function finish(name, title, detail) {
                if (done || current !== serial) return;
                done = true; active = null; state(name, title, detail);
            }
            function failure(detail) { finish('unavailable', 'Não foi possível verificar', detail); }
            try {
                var request = new XMLHttpRequest(); active = request;
                request.open('GET', './release.json?check=' + new Date().getTime(), true);
                request.timeout = 8000; // Finish stalled requests before the next scheduled check.
                request.onreadystatechange = function () {
                    if (request.readyState !== 4 || current !== serial || done) return;
                    if (request.status === 0) return;
                    if (request.status < 200 || request.status >= 300) {
                        failure('O servidor não respondeu à consulta. Tente abrir o site novamente mais tarde.'); return;
                    }
                    try {
                        var data = JSON.parse(request.responseText);
                        if (!data || data.schema_version !== 1 || typeof data.revision !== 'string' ||
                            !/^[a-f0-9]{40}$/.test(data.revision)) throw new Error('Invalid release');
                        if (!/^[a-f0-9]{40}$/.test(revision)) {
                            failure('Esta é uma versão local; não foi possível comparar com a publicação.');
                        } else if (data.revision === revision) {
                            finish('current', 'Versão mais recente', 'Você já está usando a versão mais recente do site.');
                        } else {
                            finish('available', 'Nova atualização disponível',
                                   'Uma nova versão do site já foi liberada. Toque em Atualizar agora para recebê-la.');
                        }
                    } catch (error) { failure('Não foi possível confirmar a versão publicada. Reabra o site mais tarde.'); }
                };
                request.onerror = function () { failure('A consulta falhou. A página carregada continua disponível.'); };
                request.ontimeout = function () { failure('A consulta demorou demais. Reabra o site quando a conexão melhorar.'); };
                request.send(null);
            } catch (error) { failure('A consulta não está disponível neste navegador.'); }
        }
        button.onclick = function () {
            if (!available || button.disabled) return;
            if (navigator.onLine === false) { check(); return; }
            var original = id('updateCache');
            var ps4 = typeof isPS4Console === 'function' && isPS4Console();
            try {
            if (ps4 && window.applicationCache) {
                if (!original || typeof original.click !== 'function') {
                    state('unavailable', 'Não foi possível atualizar', 'Reabra o site para tentar novamente.'); return;
                }
                updating = true; stop();
                state('updating', 'Atualizando o site...', 'Aguarde a conclusão do cache.');
                original.click();
            } else {
                updating = true; stop();
                state('updating', 'Atualizando o site...', 'Reabrindo a página para carregar a versão publicada.');
                window.location.reload();
            }
            } catch (error) {
                updating = false;
                stopped = false;
                state('available', 'Não foi possível iniciar a atualização',
                      'A atualização continua disponível. Tente novamente.');
                // Restore polling without immediately replacing the useful error.
                timer = window.setInterval(check, 10000);
            }
        };
        window.addEventListener('online', check, false);
        window.addEventListener('offline', check, false);
        window.addEventListener('pagehide', stop, false);
        window.addEventListener('pageshow', function (event) {
            // A restored page is no longer leaving for the cache update screen.
            if (event && event.persisted) updating = false;
            if (stopped && !updating) start();
        }, false);
        start();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, false);
    else init();
})();
