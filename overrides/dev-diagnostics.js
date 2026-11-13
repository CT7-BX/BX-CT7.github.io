/* BX-CT7 diagnostics panel (read-only): browser-side host data only.
   Does not unlock GoldHEN internals, bypass firmware guards, scan LAN,
   enable test mode or execute payloads. Compatible with PS4's older browser. */
(function () {
    'use strict';
    var previousFocus = null, closeControl = null, previousOverflow = null;
    function el(id) { return document.getElementById(id); }
    function txt(node, value) { if (node) node.textContent = String(value); }
    function fmt(value) { return value === undefined || value === null || value === '' ? 'Indisponível' : String(value); }
    function fw() {
        try { return typeof getPs4FwVersion === 'function' ? getPs4FwVersion() : null; }
        catch (e) { return null; }
    }
    function supported(value) {
        if (!value || typeof isFirmwareSupported !== 'function') return 'Não confirmado';
        try { return isFirmwareSupported(parseFloat(value)) ? 'Reconhecido pelo WebKitty' : 'Não reconhecido'; }
        catch (e) { return 'Não confirmado'; }
    }
    function stored(key) {
        try { return window.localStorage ? localStorage.getItem(key) : null; }
        catch (e) { return null; }
    }
    function selectedPayload() {
        try { return storage.session.getString('payload_path', null); }
        catch (e) { return null; }
    }
    function hostText(id, limit) {
        var node = el(id);
        return node ? String(node.textContent || '').slice(-limit) : '';
    }
    function cacheState() {
        try {
            var cache = window.applicationCache;
            if (!cache) return 'Indisponível neste navegador';
            var states = ['Sem cache', 'Pronto', 'Verificando', 'Baixando', 'Atualização pronta', 'Obsoleto'];
            return states[cache.status] || 'Estado não informado';
        } catch (e) { return 'Não foi possível consultar'; }
    }
    function updateState(release) {
        var names = {current:'Versão mais recente',available:'Nova atualização disponível',
            checking:'Verificando',offline:'Sem conexão',unavailable:'Não foi possível verificar',updating:'Atualizando'};
        var value = release ? release.getAttribute('data-update-state') : null;
        return names[value] || 'Não informado';
    }
    function details() {
        var version = fw();
        var selectedHen = (typeof user !== 'undefined' && user) ? user.currentJbFlavor : null;
        var gh = stored('GHVer');
        var chain = (typeof user !== 'undefined' && user) ? user.exploitChain : null;
        var currentLayout = stored('theme');
        var isConsole = typeof isPS4Console === 'function' && isPS4Console();
        var dev = typeof devMode !== 'undefined' && devMode;
        var count = typeof payloadsList !== 'undefined' ? payloadsList.length : 0;
        var release = el('bx-site-status');
        return [
            ['Revisão do site carregada', release ? fmt(release.getAttribute('data-revision')) : 'Não informada'],
            ['Verificação de atualização', updateState(release)],
            ['Estado do cache do navegador', cacheState()],
            ['Plataforma', isConsole ? 'PlayStation 4' : 'Navegador externo'],
            ['Firmware detectado', fmt(version)],
            ['Cadeia do firmware', supported(version)],
            ['HEN selecionado (não prova ativação)', fmt(selectedHen)],
            ['GoldHEN selecionado no host', fmt(gh)],
            ['Cadeia selecionada (ID)', fmt(chain)],
            ['Payload selecionado (não prova execução)', fmt(selectedPayload())],
            ['Última linha do registro do host', fmt(hostText('console', 1000).replace(/\s+$/, '').split('\n').pop().slice(-300))],
            ['nexHEN', 'Experimental; suporte e execução no console não confirmados'],
            ['Layout atual', fmt(currentLayout || 'neon')],
            ['Modo de teste do WebKitty', dev ? 'Ativado nesta sessão' : 'Desativado'],
            ['Itens cadastrados no host', count],
            ['Aplicação offline do navegador', typeof window.applicationCache === 'undefined' ? 'Indisponível neste navegador' : 'Suportada'],
            ['GoldHEN ativo no console', 'Não verificável por esta página']
        ];
    }
    function fill() {
        var table = el('bx-dev-diagnostics');
        if (!table) return;
        while (table.firstChild) table.removeChild(table.firstChild);
        var rows = details();
        for (var i = 0; i < rows.length; i++) {
            var row = document.createElement('div');
            row.className = 'bx-dev-row';
            var key = document.createElement('span');
            var value = document.createElement('strong');
            txt(key, rows[i][0]);
            txt(value, rows[i][1]);
            row.appendChild(key);
            row.appendChild(value);
            table.appendChild(row);
        }
    }
    function copyReport() {
        var rows = details(), lines = ['BX-CT7 PS4 Host - diagnóstico'];
        for (var i = 0; i < rows.length; i++) lines.push(rows[i][0] + ': ' + rows[i][1]);
        lines.push('', 'Últimas mensagens do host (até 12000 caracteres):',
                   hostText('console', 12000) || 'Nenhuma mensagem disponível.',
                   '', 'Relatório local. Revise o conteúdo antes de compartilhar.');
        var str = lines.join('\n'), input = el('bx-dev-report');
        input.value = str; input.style.display = 'block'; input.focus(); input.select();
        var copied = false;
        try { copied = document.execCommand('copy'); } catch (e) {}
        txt(el('bx-dev-note'), copied ? 'Relatório copiado. Revise antes de compartilhar.' :
            'Cópia automática indisponível. O relatório está selecionado; também pode fotografar as mensagens.');
    }
    window.bxOpenDiagnostics = function () {
        var panel = el('bx-dev-overlay');
        if (!panel) return;
        if (panel.style.display !== 'flex') {
            previousFocus = document.activeElement;
            previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }
        fill();
        var report = el('bx-dev-report');
        if (report) { report.value = ''; report.style.display = 'none'; }
        txt(el('bx-dev-note'), 'Se o nexHEN não concluir, copie o diagnóstico após a falha. Nada é enviado automaticamente.');
        panel.setAttribute('aria-hidden', 'false');
        panel.style.display = 'flex';
        if (closeControl) closeControl.focus();
    };
    window.bxCloseDiagnostics = function () {
        var panel = el('bx-dev-overlay');
        if (panel) { panel.style.display = 'none'; panel.setAttribute('aria-hidden', 'true'); }
        if (previousOverflow !== null) { document.body.style.overflow = previousOverflow; previousOverflow = null; }
        if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
        previousFocus = null;
    };
    function ready() {
        if (el('bx-dev-overlay')) return;
        var overlay = document.createElement('div');
        overlay.id = 'bx-dev-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-label', 'Diagnóstico do BX-CT7');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-hidden', 'true');
        var card = document.createElement('div');
        card.className = 'bx-dev-card';
        var head = document.createElement('div');
        head.className = 'bx-dev-head';
        var h = document.createElement('h2');
        txt(h, 'Diagnóstico e opções avançadas');
        var close = document.createElement('button');
        closeControl = close; close.type = 'button';
        txt(close, 'Fechar ✕');
        close.onclick = window.bxCloseDiagnostics;
        head.appendChild(h); head.appendChild(close);
        card.appendChild(head);
        var warning = document.createElement('p');
        txt(warning, 'Dados do site e navegador. Não identifica se o GoldHEN está ativo, nem desbloqueia funções internas do console.');
        warning.className = 'bx-dev-warning';
        card.appendChild(warning);
        var table = document.createElement('div');
        table.id = 'bx-dev-diagnostics';
        card.appendChild(table);
        var actions = document.createElement('div');
        actions.className = 'bx-dev-actions';
        var refresh = document.createElement('button');
        refresh.type = 'button';
        txt(refresh, 'Atualizar informações'); refresh.onclick = fill;
        actions.appendChild(refresh);
        var copy = document.createElement('button');
        copy.type = 'button';
        txt(copy, 'Copiar diagnóstico'); copy.onclick = copyReport;
        actions.appendChild(copy);
        var advanced = document.createElement('button');
        advanced.type = 'button';
        txt(advanced, 'Abrir aba Avançado');
        advanced.onclick = function () {
            window.bxCloseDiagnostics();
            var settingsOverlay = el('settings-popup-overlay');
            if (settingsOverlay && !settingsOverlay.classList.contains('hidden') && typeof settingsPopup === 'function') settingsPopup();
            var tab = el('advanced-tab');
            if (tab) tab.click();
            var screen = el('exploit-main-screen');
            if (screen && screen.scrollIntoView) screen.scrollIntoView();
        };
        actions.appendChild(advanced);
        card.appendChild(actions);
        var report = document.createElement('textarea');
        report.id = 'bx-dev-report';
        report.readOnly = true;
        report.setAttribute('aria-label', 'Texto do relatório');
        card.appendChild(report);
        var note = document.createElement('p');
        note.id = 'bx-dev-note';
        note.className = 'bx-dev-warning';
        note.setAttribute('role', 'status');
        note.setAttribute('aria-live', 'polite');
        txt(note, 'Se o nexHEN não concluir, copie o diagnóstico após a falha. Nada é enviado automaticamente.');
        card.appendChild(note);
        overlay.appendChild(card);
        overlay.onclick = function (event) { if (event.target === overlay) window.bxCloseDiagnostics(); };
        document.body.appendChild(overlay);
        document.addEventListener('keydown', function (event) {
            if (overlay.style.display !== 'flex') return;
            var key = event.keyCode || event.which;
            if (key === 27) { event.preventDefault(); window.bxCloseDiagnostics(); return; }
            if (key !== 9) return;
            var first = close, last = report.style.display === 'block' ? report : advanced;
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault(); first.focus();
            }
        }, false);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, false);
    else ready();
})();
