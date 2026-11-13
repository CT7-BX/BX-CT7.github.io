#!/usr/bin/env python3
"""Propose a pinned WebKitty revision; never merge or publish automatically."""
import argparse
import json
import os
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
API = 'https://api.github.com/repos/ArabPixel/WebKitty'
PIN = re.compile(r"^SHA = '([a-f0-9]{40})'$", re.M)


def replace_pin(text, revision):
    if not re.fullmatch('[a-f0-9]{40}', revision):
        raise ValueError('Invalid revision')
    if len(PIN.findall(text)) != 1:
        raise ValueError('Expected exactly one upstream pin')
    return PIN.sub("SHA = '" + revision + "'", text)


def fetch(path):
    headers = {'User-Agent': 'BX-CT7-upstream-review', 'Accept': 'application/vnd.github+json'}
    if os.environ.get('GH_TOKEN'):
        headers['Authorization'] = 'Bearer ' + os.environ['GH_TOKEN']
    request = urllib.request.Request(API + path, headers=headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', metavar='SHA')
    args = parser.parse_args()
    build = ROOT / 'build.py'
    original = build.read_text(encoding='utf-8')
    current = PIN.findall(original)
    if len(current) != 1:
        raise ValueError('Expected exactly one upstream pin')
    if args.apply:
        build.write_text(replace_pin(original, args.apply), encoding='utf-8')
        return
    latest = fetch('/commits/main')['sha']
    replace_pin(original, latest)  # Validate before using it in a URL or output.
    changed = latest != current[0]
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as output:
            output.write('changed=' + str(changed).lower() + '\nrevision=' + latest + '\n')
    if not changed:
        print('WebKitty pin is already current.')
        return
    comparison = fetch('/compare/' + current[0] + '...' + latest)
    if comparison.get('status') != 'ahead':
        raise ValueError('Upstream history diverged; manual investigation required')
    files = comparison.get('files')
    if not isinstance(files, list) or len(files) >= 300:
        raise ValueError('Incomplete comparison; manual investigation required')
    sensitive = [f['filename'] for f in files if f['filename'].startswith(('src/', 'includes/payloads/'))]
    report = ('Atualiza a revisão fixa do WebKitty, preservando a personalização BX-CT7.\n\n'
              '[Comparação completa](https://github.com/ArabPixel/WebKitty/compare/' + current[0] + '...' + latest + ')\n\n'
              + str(len(files)) + ' arquivos alterados no upstream; ' + str(len(sensitive)) + ' em código de exploração ou payloads.\n\n'
              'Os testes automáticos verificam construção, interface, cache e integridade. '
              'Eles não comprovam desbloqueio nem substituem teste físico no PS4.\n\n'
              'Revisão humana obrigatória antes de mesclar. Se houver mudanças de kernel/payload, '
              'revisar a comparação completa e validar no console antes da aprovação. '
              'Esta automação não mescla nem publica a proposta.\n')
    if os.environ.get('GITHUB_RUN_ID'):
        report += ('\nValidação: ' + os.environ.get('GITHUB_SERVER_URL', 'https://github.com') + '/' +
                   os.environ.get('GITHUB_REPOSITORY', '') + '/actions/runs/' + os.environ['GITHUB_RUN_ID'] + '\n')
    (ROOT/'upstream-review.md').write_text(report, encoding='utf-8')
    (ROOT/'upstream-candidate.txt').write_text(latest + '\n', encoding='utf-8')
    build.write_text(replace_pin(original, latest), encoding='utf-8')
    print(report)


if __name__ == '__main__':
    main()
