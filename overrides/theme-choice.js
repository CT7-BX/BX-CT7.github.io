/* ES5 appearance preference only. No payload, navigation or network actions. */
(function () {
    'use strict';
    var key = 'bx-appearance-v1', current = 'gta', ready = false;
    function valid(value) { return value === 'original' || value === 'gta'; }
    function controls(message) {
        if (!ready) return;
        var radios = document.querySelectorAll('input[name="bx-appearance"]');
        for (var i = 0; i < radios.length; i++) radios[i].checked = radios[i].value === current;
        var status = document.getElementById('bx-theme-feedback');
        if (status) status.textContent = message || '';
    }
    function apply(value, save) {
        if (!valid(value)) return;
        current = value;
        var sheet = document.getElementById('bx-theme-stylesheet');
        if (sheet) sheet.media = value === 'original' ? 'not all' : 'all';
        document.documentElement.setAttribute('data-bx-theme', value);
        var message = '';
        if (save) {
            try { localStorage.setItem(key, value); message = 'Tema aplicado e salvo.'; }
            catch (ignore) { message = 'Tema aplicado. Este navegador não permitiu salvar a preferência.'; }
        }
        controls(message);
    }
    try { var saved = localStorage.getItem(key); if (valid(saved)) current = saved; } catch (ignore) {}
    // Run in the head, before the page body, to avoid flashing the other theme.
    apply(current, false);
    function init() {
        if (ready) return;
        ready = true; controls();
        document.addEventListener('change', function (event) {
            var target = event.target;
            if (target && target.name === 'bx-appearance' && target.checked && valid(target.value)) apply(target.value, true);
        }, false);
    }
    window.addEventListener('storage', function (event) {
        if (event && (event.key === key || event.key === null)) apply(valid(event.newValue) ? event.newValue : 'gta', false);
    }, false);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, false);
    else init();
})();
