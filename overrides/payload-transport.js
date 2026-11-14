/* ES5 host transfers: exactly one result, bounded waits, no automatic resend. */
function bxPayloadRequest(method, url, data, binary, timeoutMs, callback, plainText) {
    var req = null, done = false, timer = null;
    function finish(ok, event) {
        if (done) return;
        done = true;
        if (timer !== null) clearTimeout(timer);
        // Cancel before reporting failure so caller fallback cannot overlap this request.
        if (!ok && req && req.readyState !== 4) { try { req.abort(); } catch (ignore) {} }
        if (callback) callback(ok, req, event);
    }
    try {
        req = new XMLHttpRequest();
        req.open(method, url, true);
        if (binary) req.responseType = 'arraybuffer';
        if (plainText) req.setRequestHeader('Content-Type', 'text/plain');
        req.onload = function (event) {
            var ok = req.status === 200 || (method === 'GET' ? req.status === 304 : req.status === 202);
            if (binary) ok = ok && req.response && req.response.byteLength > 0;
            finish(!!ok, event);
        };
        req.onerror = req.ontimeout = req.onabort = function (event) { finish(false, event); };
        timer = setTimeout(function () { finish(false); }, timeoutMs || 8000);
        req.send(data);
    } catch (e) { finish(false); }
    return req;
}
function getPayload(payloadUrl, onLoadEndCallback) {
    bxPayloadRequest('GET', payloadUrl, null, true, 8000, function (ok, req, event) {
        if (onLoadEndCallback) onLoadEndCallback(ok || (req && req.status >= 400) ? req : null, event);
    });
}
function sendPayloadWithTimeout(url, data, timeoutMs, onResult) {
    bxPayloadRequest('POST', url, data, false, timeoutMs, function (ok, req) {
        if (onResult) onResult(ok, req);
    });
}
