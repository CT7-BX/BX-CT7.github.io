/* Canonical ES5 payload transport. No automatic exploit fallback, queue or resend. */
var ELFLDR = 'http://127.0.0.1:9021';
var needsPayloadLoader = false;
var bxPayloadOperations = {};
function bxPayloadWords() { return typeof window !== 'undefined' && window.lang ? window.lang : {}; }
function bxPayloadMessage(text, color) { if (typeof log === 'function') log(text,color || 'orange'); }
function bxPayloadNotify(text) { bxPayloadMessage(text); if (typeof alert === 'function') alert(text); }
function bxPayloadIP() {
    if (typeof isPS4Console === 'function' && isPS4Console()) return '127.0.0.1';
    var ip = typeof user !== 'undefined' && user.ip ? String(user.ip).replace(/^\s+|\s+$/g,'') : '127.0.0.1';
    if (!/^[a-z0-9.-]+$/i.test(ip) && !/^\[[a-f0-9:]+\]$/i.test(ip)) throw Error('Endereço do PS4 inválido.');
    return ip;
}
function getPayloadName(url) {
    if (typeof url !== 'string' || !url) return 'payload.elf';
    var clean = url.split('?')[0].split('#')[0].split('/');
    return clean[clean.length-1] || 'payload.elf';
}
function isPayloadElf(path) { return typeof path === 'string' && /\.elf$/i.test(path.split('?')[0].split('#')[0]); }
function sendPayload(bytes,name,onDone,args,endpoint) {
    var query = '?pipe=0' + (args ? '&args=' + encodeURIComponent(args) : '');
    return bxPayloadRequest('POST',(endpoint || ELFLDR)+'/'+encodeURIComponent(name || 'payload.elf')+query,
        bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes),false,8000,
        function (ok,req) { if (onDone) onDone(ok ? req.status : 0,ok ? req.responseText : 'request failed'); },true);
}
function loadAndSend(url,onDone,name,args,endpoint) {
    return getPayload(url,function (req) {
        if (!req || (req.status !== 200 && req.status !== 304) || !req.response || !req.response.byteLength) {
            if (onDone) onDone(0,'could not load '+url); return;
        }
        sendPayload(req.response,name || getPayloadName(url),onDone,args,endpoint);
    });
}
function sendElfToElfldr(url,name,onDone,args) {
    var endpoint = ELFLDR;
    return loadAndSend(url,function (status,text) {
        var ok = status === 200 || status === 202;
        if (ok) bxPayloadMessage('Envio aceito pelo Elf Loader. Isso não confirma a execução do payload.','green');
        if (onDone) onDone(ok,text);
    },name,args,endpoint);
}
function probeElfLoader() {
    return new Promise(function (resolve) {
        var ip;
        try { ip = bxPayloadIP(); } catch (error) { resolve(false); return; }
        bxPayloadRequest('GET','http://'+ip+':9021/',null,false,2000,function (ok,req) { resolve(!!(req && req.status > 0)); });
    });
}
function bxCancelPayloadTransfers() {
    var operations = [], key;
    for (key in bxPayloadOperations) if (Object.prototype.hasOwnProperty.call(bxPayloadOperations,key)) operations.push(bxPayloadOperations[key]);
    for (var i=0;i<operations.length;i++) operations[i].cancel();
}
if (typeof window !== 'undefined') window.bxCancelPayloadTransfers = bxCancelPayloadTransfers;
function Loadpayloadlocal(file,name,id,required,customPort,onComplete) {
    var ip, port = customPort === undefined || customPort === null || customPort === '' ? 9090 : customPort;
    try {
        ip = bxPayloadIP();
        if (!/^\d{1,5}$/.test(String(port)) || Number(port)<1 || Number(port)>65535) throw Error('Porta do carregador inválida.');
        if (typeof file !== 'string' || !file) throw Error('Nenhum arquivo de payload foi selecionado.');
    } catch (error) { bxPayloadNotify(error.message); if (onComplete) onComplete(false); return null; }
    if (typeof window !== 'undefined' && window.bxHostRuntime && window.bxHostRuntime.isBusy() && id !== 'jailbreak') {
        bxPayloadNotify('Aguarde a operação atual do host terminar.'); if (onComplete) onComplete(false); return null;
    }
    if (bxPayloadOperations[ip]) { bxPayloadNotify('Já existe um envio em andamento para este PS4.'); if (onComplete) onComplete(false); return null; }
    var request = null, done = false, elf = isPayloadElf(file) || isPayloadElf(name);
    var target = 'http://'+ip+':'+(elf ? 9021 : Number(port));
    var operation = {cancel:function () {
        if (done) return;
        done = true; delete bxPayloadOperations[ip];
        if (request) { try { request.abort(); } catch (ignore) {} }
        if (onComplete) onComplete(false);
    }};
    bxPayloadOperations[ip] = operation;
    function finish(ok, reason) {
        if (done) return;
        done = true; delete bxPayloadOperations[ip];
        if (ok) {
            var message = bxPayloadWords().payloadLoaderSendSuccess || 'Envio aceito pelo carregador: {payload}';
            bxPayloadMessage(String(message).replace('{payload}',name || getPayloadName(file)),'green');
        } else bxPayloadNotify(reason === 'download'
            ? 'Não foi possível baixar o arquivo do payload. Confira a conexão e atualize o cache.'
            : 'Não foi possível confirmar a resposta do carregador. Confira BinLoader Server na porta 9090; ELF requer Elf Loader na porta 9021. A falta de resposta não confirma se o payload executou.');
        if (onComplete) onComplete(ok);
    }
    request = getPayload(file,function (req) {
        if (done) return;
        if (!req || (req.status!==200 && req.status!==304) || !req.response || !req.response.byteLength) { finish(false,'download'); return; }
        var bytes = req.response;
        bxPayloadMessage('Enviando '+(name || getPayloadName(file))+'...');
        var endpoint = elf ? target+'/'+encodeURIComponent(name || getPayloadName(file))+'?pipe=0' : target+'/';
        request = bxPayloadRequest('POST',endpoint,elf ? new Uint8Array(bytes) : bytes,false,elf ? 8000 : 5000,
            function (ok) { finish(ok,'transport'); },elf);
    });
    return operation;
}
function Loadpayloadonline(file) {
    if (typeof window !== 'undefined' && window.bxHostRuntime && window.bxHostRuntime.isBusy()) return false;
    if (file === undefined || file === null) storage.session.set('binloader',1);
    else storage.session.set('payload_path',file);
    if (isPS4Console()) jailbreak();
    return true;
}
function customPayload(file) {
    if (!file || !file.size) { bxPayloadNotify('Selecione um arquivo de payload não vazio.'); return; }
    var url = URL.createObjectURL(file);
    return Loadpayloadlocal(url,file.name,file.id,false,undefined,function () { URL.revokeObjectURL(url); });
}
function payloadRouter(payload) {
    if (!payload || !isPayloadSupported(payload)) { bxPayloadNotify((bxPayloadWords().unsupportedFirmware || 'Firmware não suportado: ')+user.ps4Fw); return; }
    if (payload.src == undefined && payload.legacySrc == undefined) { Loadpayloadonline(undefined); return; }
    var source = getPs4FwVersion()<=4.74 && payload.legacySrc!=undefined ? payload.legacySrc : payload.src;
    var update = payload.id==='PSVue' && typeof source==='string' ? source.replace('base','124') : source;
    Loadpayloadlocal(source,payload.name,payload.id,payload.needsPayloadLoader,undefined,function (ok) {
        if (ok && update!==source) Loadpayloadlocal(update,payload.name,payload.id,payload.needsPayloadLoader);
    });
}
function requiresPayloadServer(required) {
    if (required) { bxPayloadNotify('Ative o carregador de payloads do GoldHEN antes de enviar.'); return true; }
    return false;
}
