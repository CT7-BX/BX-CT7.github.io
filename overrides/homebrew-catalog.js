/* BX-CT7 Homebrew catalog cards. NOT a PKG installer or payload loader.
 * Cards are based on the public store catalog; browser-only, PS4-safe ES5. */
(function () {
  'use strict';
  var source = './bx-hen/store/catalog.json';
  function node(parent, tag, className, value) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (typeof value === 'string') n.textContent = value;
    parent.appendChild(n);
    return n;
  }
  function secureDownload(item) {
    return item && item.status === 'available' &&
      typeof item.download_url === 'string' &&
      /^https:\/\/[A-Za-z0-9.-]+(?::443)?(?:\/|$)/.test(item.download_url) &&
      item.download_url.indexOf('@') === -1 &&
      typeof item.sha256 === 'string' && /^[a-fA-F0-9]{64}$/.test(item.sha256) &&
      typeof item.license === 'string' && item.license.length > 1 && item.license !== 'A confirmar';
  }
  function addItem(container, item) {
    if (!item || (item.id !== 'minecraft-online-manager' && item.id !== 'java')) return;
    if (document.getElementById('bx-homebrew-' + item.id)) return;
    var outer = node(container, 'div', 'payload payload-card bx-homebrew-entry');
    outer.id = 'bx-homebrew-' + item.id;
    var box = node(outer, 'div', 'payloadContainer');
    var card = node(box, 'div', 'bg-gray-800 border border-white/20 rounded-xl p-6 h-full bx-homebrew-card');
    node(card, 'h3', 'text-start font-semibold text-white text-lg', item.title);
    node(card, 'p', 'text-start text-cyan-300', 'BX-CT7 • Catálogo de aplicativos');
    node(card, 'p', 'text-start text-white/70 text-sm leading-relaxed',
      item.description || 'Projeto do catálogo BX-CT7.');
    var available = secureDownload(item);
    node(card, 'p', 'bx-homebrew-status', available ?
      'PKG com link publicado na loja (instalação não automática)' :
      'PKG ainda não disponibilizado — sem instalador');
    var action = node(card, 'a', 'bx-homebrew-link',
      available ? 'Ver download na loja' : 'Consultar projeto na loja');
    action.href = './bx-hen/store/?q=' + encodeURIComponent(item.title);
    action.setAttribute('aria-label', 'Abrir ' + item.title + ' na loja de PKGs');
  }
  function addFallback(container) {
    addItem(container, {
      id:'minecraft-online-manager', title:'Minecraft Online Manager',
      description:'Projeto em preparação. Arquivo PKG ainda não disponibilizado.',
      status:'planned'
    });
    addItem(container, {
      id:'java', title:'Java — projeto BX-CT7',
      description:'Projeto em preparação. Arquivo PKG ainda não disponibilizado.',
      status:'planned'
    });
  }
  window.bxRenderHomebrewCards = function (container) {
    if (!container) return;
    /* The upstream Homebrew tab is cleared and re-rendered on navigation. */
    var request = new XMLHttpRequest();
    request.open('GET', source, true);
    request.onreadystatechange = function () {
      if (request.readyState !== 4) return;
      /* Never append to an inactive tab or after a different render. */
      if (container.getAttribute('data-bx-homebrew-render') !== renderToken) return;
      if (request.status !== 200) { addFallback(container); return; }
      try {
        var body = JSON.parse(request.responseText);
        if (!body || !body.items || !body.items.length) throw Error('invalid catalog');
        for (var i = 0; i < body.items.length; i++) addItem(container, body.items[i]);
      } catch (error) { addFallback(container); }
    };
    request.onerror = function () {
      if (container.getAttribute('data-bx-homebrew-render') === renderToken) addFallback(container);
    };
    var renderToken = String(new Date().getTime()) + '-' + String(Math.random()).slice(2);
    container.setAttribute('data-bx-homebrew-render', renderToken);
    try { request.send(null); } catch (error) { addFallback(container); }
  };
})();
