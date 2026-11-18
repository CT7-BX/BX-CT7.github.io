/* ES5 host script loading: one pending request per URL/type and bounded readiness. */
var bxHostPendingScripts = {};
function bxHostScriptFailure(error) {
    if (typeof window !== 'undefined' && window.bxHostRuntime) window.bxHostRuntime.fail(error);
}
function getScript(source,isModule,debug) {
    var key = String(source)+'|'+(isModule ? 'module' : 'classic');
    if (bxHostPendingScripts[key]) return bxHostPendingScripts[key];
    var promise = new Promise(function (resolve,reject) {
        var element = null, done = false, timer = null;
        function finish(ok,error) {
            if (done) return;
            if (ok && typeof window !== 'undefined' && window.bxHostRuntime && window.bxHostRuntime.state() === 'interrupted') { ok = false; error = Error('O carregamento foi interrompido pela navegação.'); }
            done = true;
            if (timer !== null) clearTimeout(timer);
            delete bxHostPendingScripts[key];
            if (ok) resolve();
            else { bxHostScriptFailure(error); reject(error); }
        }
        try {
            if (typeof source !== 'string' || !source) throw Error('Caminho de script inválido.');
            element = document.createElement('script'); element.src = source;
            element.type = isModule ? 'module' : 'text/javascript'; element.async = false;
            element.onload = function () { finish(true); };
            element.onerror = function () { finish(false,Error('Falha ao carregar o script: '+source)); };
            timer = setTimeout(function () { finish(false,Error('O script não respondeu dentro do limite de espera: '+source)); },120000);
            document.body.appendChild(element);
            if (debug && typeof log === 'function') log('[Debug] Script: '+source,'grey');
        } catch (error) { finish(false,error); }
    });
    bxHostPendingScripts[key] = promise;
    // Promise callbacks run after assignment, including synchronous construction errors.
    promise.then(function () { if (bxHostPendingScripts[key] === promise) delete bxHostPendingScripts[key]; },
                 function () { if (bxHostPendingScripts[key] === promise) delete bxHostPendingScripts[key]; });
    return promise;
}
function loadScript(source,isModule,debug) {
    window.script_loaded = 0;
    return getScript(source,isModule,debug).then(function () {
        return new Promise(function (resolve,reject) {
            var tries = 0;
            function inspect() {
                if (window.bxHostRuntime && window.bxHostRuntime.state() === 'interrupted') { reject(Error('A navegação interrompeu a espera do script.')); return; }
                if (window.script_loaded >= 1) { resolve(); return; }
                if (++tries >= 1200) { var error = Error('O script carregou, mas não sinalizou que está pronto.'); bxHostScriptFailure(error); reject(error); return; }
                setTimeout(inspect,50);
            }
            inspect();
        });
    });
}
