/* ES5 settings dialog keyboard support. Original settings handlers remain in use. */
(function () {
    'use strict';
    function init() {
        var panel = document.getElementById('settings-popup');
        var overlay = document.getElementById('settings-popup-overlay');
        if (!panel || !overlay || typeof window.settingsPopup !== 'function') return;
        var original = window.settingsPopup, opener = null, overflow = null;
        var title = panel.querySelector('h2');
        if (title) { title.id = title.id || 'bx-settings-title'; panel.setAttribute('aria-labelledby', title.id); }
        panel.setAttribute('tabindex', '-1');
        panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
        function open() { return !overlay.classList.contains('hidden'); }
        function diagnosticsOpen() {
            var diagnostic = document.getElementById('bx-dev-overlay');
            return diagnostic && diagnostic.style.display === 'flex';
        }
        function sync() {
            if (open()) {
                if (overflow === null) {
                    opener = document.activeElement; overflow = document.body.style.overflow;
                    document.body.style.overflow = 'hidden';
                }
                panel.setAttribute('aria-hidden', 'false');
                var close = document.getElementById('close-settings');
                if (close && !close.disabled) close.focus();
                else panel.focus();
            } else {
                panel.setAttribute('aria-hidden', 'true');
                if (overflow !== null) { document.body.style.overflow = overflow; overflow = null; }
                if (opener && typeof opener.focus === 'function') opener.focus();
                opener = null;
            }
        }
        window.settingsPopup = function () { var result = original.apply(this, arguments); sync(); return result; };
        panel.setAttribute('aria-hidden', open() ? 'false' : 'true');
        document.addEventListener('keydown', function (event) {
            if (event.defaultPrevented || !open() || diagnosticsOpen()) return;
            var key = event.keyCode || event.which;
            if (key === 27) { event.preventDefault(); window.settingsPopup(); return; }
            if (key !== 9) return;
            var candidates = panel.querySelectorAll('button,input,select,textarea,a[href],summary'), controls = [];
            for (var i = 0; i < candidates.length; i++) {
                var element = candidates[i];
                if (!element.disabled && element.tabIndex !== -1 &&
                    (element.offsetWidth || element.offsetHeight || element.getClientRects().length)) controls.push(element);
            }
            if (!controls.length) { event.preventDefault(); panel.focus(); return; }
            var first = controls[0], last = controls[controls.length - 1], focused = document.activeElement;
            if (event.shiftKey && (focused === first || !panel.contains(focused))) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && (focused === last || !panel.contains(focused))) {
                event.preventDefault(); first.focus();
            }
        }, false);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, false);
    else init();
})();
