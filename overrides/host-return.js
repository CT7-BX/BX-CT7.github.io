/* ES5 host lifecycle. It coordinates readiness, one execution and UI recovery.
 * Only the existing success callback may signal completion. No automatic retry. */
(function () {
    'use strict';
    var phase = 'booting', preparing = null, prepared = false, completed = false, generation = 0, returnTimer = null;
    var originalCleanup = window.cleanUp, originalSuccess = window.jailbreakSuccess, originalLaunch = window.jailbreak;
    function node(id) { return document.getElementById(id); }
    function signal(next) {
        phase = next;
        if (document.documentElement) document.documentElement.setAttribute('data-bx-host-state', next);
        if (document.createEvent && window.dispatchEvent) {
            var event = document.createEvent('Event'); event.initEvent('bx-host-state',false,false); event.bxState = next; window.dispatchEvent(event);
        }
    }
    function running() { return phase === 'launching' || phase === 'running'; }
    function hideClass(active) { if (document.body) document.body.classList[active ? 'add' : 'remove']('bx-host-running'); }
    function show(element) { if (element) { element.classList.remove('hidden'); if (element.style.display === 'none') element.style.removeProperty('display'); } }
    function restore(historyReturn) {
        if (running() || typeof isPS4Console !== 'function' || !isPS4Console()) return;
        var initial = node('initial-screen'), payloads = node('payloadsSection');
        var bothHidden = initial && payloads && initial.classList.contains('hidden') && payloads.classList.contains('hidden');
        if (!initial || (!completed && !bothHidden && phase !== 'interrupted' && phase !== 'failed')) return;
        show(initial); show(payloads); show(node('exploit-main-screen')); hideClass(false);
        var main = document.querySelector('.mainContainer');
        if (main && (historyReturn || main.scrollTop > Math.max(0,main.scrollHeight-main.clientHeight))) {
            main.scrollTop = 0;
            if (typeof lastScrollY !== 'undefined') lastScrollY = 0;
            if (typeof lastSection !== 'undefined') lastSection = 'initial';
        }
    }
    function notice(message) { if (typeof log === 'function') log(message,'orange'); if (typeof alert === 'function') alert(message); }
    function releaseClick() { if (typeof user !== 'undefined') user.blockJailbreak = false; }
    function fail(error, token) {
        if (token !== undefined && token !== generation) return;
        if (phase === 'failed' || phase === 'interrupted' || (phase === 'completed' && completed)) return;
        signal('failed'); hideClass(false); restore(true);
        notice('O host não conseguiu concluir esta etapa. Reabra a página antes de tentar novamente. ' + (error && error.message ? error.message : ''));
    }
    function launch(operation) {
        if (running()) return Promise.resolve(false);
        if (!prepared || phase === 'failed' || phase === 'interrupted' || window.bxCacheEntryPending) {
            releaseClick(); notice(prepared ? 'Reabra o host para iniciar uma nova tentativa.' : 'Aguarde a preparação do host terminar antes de iniciar.'); return Promise.resolve(false);
        }
        if (typeof isFirmwareSupported === 'function' && typeof getPs4FwVersion === 'function' && !isFirmwareSupported(getPs4FwVersion())) { releaseClick(); notice('O host não tem uma cadeia validada para este firmware.'); return Promise.resolve(false); }
        var cache = window.applicationCache;
        if (cache && (cache.status === 2 || cache.status === 3)) {
            releaseClick(); notice('O navegador ainda está preparando o cache. Aguarde a conclusão e reabra esta página antes de iniciar.'); return Promise.resolve(false);
        }
        if (typeof isPS4Console === 'function' && !isPS4Console() && !(typeof devMode !== 'undefined' && devMode)) { releaseClick(); return Promise.resolve(false); }
        generation++; var token = generation; signal('launching');
        try { return Promise.resolve(operation()).then(function (value) { return value; },function (error) { fail(error,token); return false; }); }
        catch (error) { fail(error,token); return Promise.resolve(false); }
    }
    var runtime = {
        isBusy: function () { return running() || phase === 'preparing' || phase === 'cache'; },
        state: function () { return phase; },
        prepare: function (operation) {
            if (phase === 'interrupted') return Promise.resolve(false);
            if (preparing) return preparing;
            if (prepared) return Promise.resolve(true);
            signal('preparing');
            var prepareGeneration = generation;
            preparing = Promise.resolve().then(operation).then(function () { return window.bxCacheEntryReady || true; }).then(function (entryReady) {
                if (prepareGeneration !== generation || phase === 'interrupted') return false;
                if (entryReady === false) { signal('cache'); return false; }
                prepared = true; signal('idle'); return true;
            },function (error) { fail(error); return false; });
            return preparing;
        },
        run: launch,
        fail: fail
    };
    window.bxHostRuntime = runtime;
    if (typeof originalLaunch === 'function') window.jailbreak = function () {
        var self = this, args = arguments;
        return launch(function () { return originalLaunch.apply(self,args); });
    };
    if (typeof originalCleanup === 'function') window.cleanUp = function () {
        completed = false; signal('running'); hideClass(true);
        return originalCleanup.apply(this,arguments);
    };
    if (typeof originalSuccess === 'function') window.jailbreakSuccess = function () {
        if (phase === 'interrupted' || (phase === 'completed' && completed)) return;
        var binloader = typeof storage !== 'undefined' && storage.session.getBoolean('binloader',false);
        var result;
        try { result = originalSuccess.apply(this,arguments); } catch (error) { fail(error); return; }
        completed = true; signal('completed'); hideClass(false); restore(false);
        if (!binloader && typeof getReloadAfterJbValue === 'function' && getReloadAfterJbValue()) {
            var returnGeneration = generation;
            returnTimer = window.setTimeout(function () {
                returnTimer = null;
                if (phase !== 'completed' || returnGeneration !== generation) return;
                var target = typeof mainPage === 'string' ? mainPage : './';
                var hashAt = target.indexOf('#'), hash = hashAt < 0 ? '' : target.substring(hashAt);
                var path = hashAt < 0 ? target : target.substring(0,hashAt);
                window.location.href = path + (path.indexOf('?') < 0 ? '?' : '&') + 'cacheReturn=1' + hash;
            },5000);
        }
        return result;
    };
    if (typeof EXPLOIT_HANDLERS !== 'undefined') for (var name in EXPLOIT_HANDLERS) if (Object.prototype.hasOwnProperty.call(EXPLOIT_HANDLERS,name)) {
        (function (key, handler) {
            if (typeof handler !== 'function') return;
            EXPLOIT_HANDLERS[key] = function () {
                var token = generation;
                try { var value = handler.apply(this,arguments); if (value && typeof value.then === 'function') value.then(null,function (error) { fail(error,token); }); return value; }
                catch (error) { fail(error,token); return null; }
            };
        })(name,EXPLOIT_HANDLERS[name]);
    }
    window.addEventListener('pagehide',function () {
        generation++;
        if (returnTimer !== null) { window.clearTimeout(returnTimer); returnTimer = null; }
        if (typeof window.bxCancelPayloadTransfers === 'function') window.bxCancelPayloadTransfers();
        if (running() || phase === 'booting' || phase === 'preparing') signal('interrupted');
    },false);
    window.addEventListener('pageshow',function (event) { if (event && event.persisted) restore(true); },false);
})();
