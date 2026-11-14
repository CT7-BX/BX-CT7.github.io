/* ES5 presentation recovery after completion and browser history restoration.
 * Never reruns a payload, changes success detection, or interrupts an active chain. */
(function () {
    'use strict';
    var running = false, completed = false;
    var originalCleanup = window.cleanUp, originalSuccess = window.jailbreakSuccess;
    function node(id) { return document.getElementById(id); }
    function hidden(element) { return element && (element.classList.contains('hidden') || element.style.display === 'none'); }
    function show(element) {
        if (!element) return;
        element.classList.remove('hidden');
        if (element.style.display === 'none') element.style.removeProperty('display');
    }
    function restore(historyReturn) {
        if (running || typeof isPS4Console !== 'function' || !isPS4Console()) return;
        var initial = node('initial-screen'), payloads = node('payloadsSection');
        if (!initial || !payloads || (!completed && !(hidden(initial) && hidden(payloads)))) return;
        show(initial); show(payloads); show(node('exploit-main-screen'));
        var main = document.querySelector('.mainContainer');
        if (main && (historyReturn || main.scrollTop > Math.max(0, main.scrollHeight - main.clientHeight))) {
            // PS4 can retain an out-of-range scroll offset after hidden sections resize.
            main.scrollTop = 0;
            if (typeof lastScrollY !== 'undefined') lastScrollY = 0;
            if (typeof lastSection !== 'undefined') lastSection = 'initial';
        }
    }
    if (typeof originalCleanup === 'function') window.cleanUp = function () {
        running = true; completed = false;
        return originalCleanup.apply(this, arguments);
    };
    if (typeof originalSuccess === 'function') window.jailbreakSuccess = function () {
        var result = originalSuccess.apply(this, arguments);
        running = false; completed = true;
        restore(false);
        return result;
    };
    window.addEventListener('pageshow', function (event) {
        if (event && event.persisted) restore(true);
    }, false);
})();
