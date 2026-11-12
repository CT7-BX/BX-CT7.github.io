"""Improve the cache progress page without touching firmware or payload logic."""
import re


def improve_cache_page(html):
    pattern = r'<script>\s*var fwVersion = getPs4FwVersion\(\);[\s\S]*?</script>'
    html, count = re.subn(pattern, '<script src="./includes/js/cache-status.js"></script>', html)
    if count != 1:
        raise ValueError('Cache controller markup changed')
    anchor = '<div class="cache-subtitle" id="cacheStatus">Preparando...</div>'
    if html.count(anchor) != 1:
        raise ValueError('Cache status markup changed')
    html = html.replace(anchor, '<div class="cache-subtitle" id="cacheStatus" role="status" aria-live="polite" aria-atomic="true">Preparando...</div>'
                        '<div class="bx-cache-actions"><button type="button" id="bx-cache-retry" hidden style="display:none">Tentar novamente</button>'
                        '<a id="bx-cache-back" href="./">Voltar ao site</a></div>', 1)
    html = html.replace('<div class="progress-bar-wrap">', '<div class="progress-bar-wrap" id="bx-cache-progress" role="progressbar" aria-label="Atualização do cache" aria-valuemin="0" aria-valuemax="100">', 1)
    html = html.replace('initial-scale=1.0, maximum-scale=1', 'initial-scale=1.0')
    style = '''<style>
.cache-screen{box-sizing:border-box;height:auto;min-height:100vh;padding:24px 16px}
.cache-title,.cache-subtitle,.bx-cache-actions{max-width:650px;word-wrap:break-word}
.cache-subtitle{white-space:pre-wrap;color:#c6d0df;line-height:1.6;margin:16px 0}
.progress-bar-wrap{max-width:100%;margin:16px 0}
.bx-cache-actions a,.bx-cache-actions button{display:inline-block;box-sizing:border-box;min-height:44px;padding:12px 16px;margin:5px;border:1px solid #596273;border-radius:7px;background:#202631;color:#fff;font:14px Arial,sans-serif;text-decoration:none;cursor:pointer}
.bx-cache-actions :focus{outline:2px solid #b8d5ff;outline-offset:3px}
</style>\n'''
    return html.replace('</head>', style + '</head>', 1)
