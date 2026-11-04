/* BX-CT7: firmware 14.00 routes to the independently maintained Afterglow
 * landing page. Does not alter WebKitty exploits, firmware support lists,
 * controls or styling, and does not auto-trigger any kernel exploit.
 * Afterglow has its own manual start and original source/credits. */
(function () {
    'use strict';
    function isPs4Fw1400() {
        try {
            var ua = navigator.userAgent || '';
            if (ua.indexOf('PlayStation 4') === -1) return false;
            if (typeof getPs4FwVersion !== 'function') return false;
            var fw = String(getPs4FwVersion());
            return /^14\.00(?:$|[^0-9])/.test(fw);
        } catch (e) {
            return false;
        }
    }
    function originalStartButton(element) {
        while (element && element !== document) {
            if (element.id === 'pslogo' ||
                element.id === 'ps-logo-container' ||
                element.id === 'exploitRun') return true;
            element = element.parentNode;
        }
        return false;
    }
    document.addEventListener('click', function (event) {
        if (!isPs4Fw1400() || !originalStartButton(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        // Local, relative path works with the repository's GitHub Pages subpath.
        window.location.href = './afterglow/index.html';
    }, true);
})();
