/* ES5 language loading: bounded waits, trusted names and English fallback.
 * Presentation only: never starts a payload or a jailbreak. */
var bxLanguageLoadSerial = 0;
var bxLanguageLastCommitted = null;
function loadLanguage() {
    var selected = user.currentLanguage;
    var allowed = ['en', 'es', 'fa', 'ru', 'tr', 'zh-cn', 'ar', 'pt-br'];
    if (allowed.indexOf(selected) === -1) selected = 'pt-br';
    user.currentLanguage = selected;
    var radio = document.querySelector('input[name="language"][value="' + selected + '"]');
    if (radio) radio.checked = true;
    var serial = ++bxLanguageLoadSerial;
    return new Promise(function (resolve, reject) {
        function stale() {
            if (serial === bxLanguageLoadSerial) return false;
            if (bxLanguageLastCommitted) window.lang = bxLanguageLastCommitted;
            reject(new Error('Language request superseded'));
            return true;
        }
        function valid(strings) { return strings && typeof strings === 'object' && typeof strings.clickToStart === 'string'; }
        function script(language, callback) {
            var old = document.getElementById('langScript');
            if (old && old.parentNode) old.parentNode.removeChild(old);
            var element = document.createElement('script'), done = false, previousStrings = window.lang;
            element.id = 'langScript';
            element.src = './includes/js/languages/' + language + '.js';
            var timer = window.setTimeout(function () { finish(false); }, 8000);
            function finish(ok) {
                if (done) return;
                done = true; window.clearTimeout(timer);
                if (stale()) return;
                var strings = ok && window.lang !== previousStrings && valid(window.lang) ? window.lang : null;
                if (!ok && element.parentNode) element.parentNode.removeChild(element);
                callback(strings);
            }
            element.onload = function () {
                if (done) { if (bxLanguageLastCommitted) window.lang = bxLanguageLastCommitted; return; }
                finish(true);
            };
            element.onerror = function () { finish(false); };
            document.head.appendChild(element);
        }
        function commit(strings, actualLanguage) {
            if (stale()) return;
            if (!valid(strings)) { reject(new Error('No interface language could be loaded')); return; }
            var clean = {}, key;
            for (key in strings) if (Object.prototype.hasOwnProperty.call(strings, key) && typeof strings[key] === 'string') clean[key] = strings[key];
            user.currentLanguage = actualLanguage;
            bxLanguageLastCommitted = clean; window.lang = clean; resolve(clean);
        }
        script('en', function (english) {
            if (selected === 'en') { commit(english, 'en'); return; }
            script(selected, function (translated) {
                if (!translated) { commit(english, 'en'); return; }
                var combined = {}, key;
                if (english) for (key in english) if (Object.prototype.hasOwnProperty.call(english, key)) combined[key] = english[key];
                for (key in translated) if (Object.prototype.hasOwnProperty.call(translated, key)) combined[key] = translated[key];
                commit(combined, selected);
            });
        });
    });
}
