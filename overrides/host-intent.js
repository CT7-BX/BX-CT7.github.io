/* ES5 one-use handoff to the minimal host. This is an execution intent, not authentication. */
(function () {
    'use strict';
    var key = 'bxHostLaunchIntent';
    function revision() { return document.documentElement.getAttribute('data-bx-host-revision') || ''; }
    // Retire only stale attempt flags on the first v2 main-page visit; keep user preferences.
    if (!/\/exploit\.html$/.test(window.location.pathname)) {
        try {
            if (sessionStorage.getItem('bxHostRuntimeSchema') !== '2') {
                sessionStorage.removeItem('autoJbRetry'); sessionStorage.removeItem('jailbreakNow'); sessionStorage.removeItem('binloader');
                sessionStorage.removeItem(key); sessionStorage.setItem('bxHostRuntimeSchema','2');
            }
        } catch (ignore) {}
    }
    window.bxCreateHostIntent = function () {
        try {
            var payload = sessionStorage.getItem('payload_path'), fw = getPs4FwVersion(), rev = revision();
            var chain = String(user.exploitChain);
            if (!payload || payload.length > 2048 || !fw || !isFinite(Number(chain)) ||
                (!/^[a-f0-9]{40}$/.test(rev) && rev !== 'local-build')) return false;
            var value = JSON.stringify({schema:2,at:new Date().getTime(),revision:rev,firmware:fw,payload:payload,chain:chain});
            sessionStorage.setItem(key,value);
            return sessionStorage.getItem(key) === value;
        } catch (error) { return false; }
    };
    window.bxConsumeHostIntent = function () {
        try {
            var raw = sessionStorage.getItem(key); sessionStorage.removeItem(key);
            if (!raw) return false;
            var value = JSON.parse(raw), age = new Date().getTime() - value.at;
            return value.schema === 2 && typeof value.at === 'number' && age >= 0 && age <= 120000 &&
                value.revision === revision() && value.firmware === getPs4FwVersion() &&
                value.payload === sessionStorage.getItem('payload_path') &&
                value.chain === String(parseFloat(localStorage.getItem('exploitChain'))) && localStorage.getItem('bareboneJB') === 'true';
        } catch (error) { return false; }
    };
})();
