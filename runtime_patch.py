"""Apply presentation edits only when the reviewed upstream marker is present."""

def replace_required(root, path, old, new):
    file = root / path
    if not file.is_file():
        raise RuntimeError('Required upstream file missing: ' + path)
    text = file.read_text(encoding='utf-8')
    if not old or old not in text:
        raise RuntimeError('Upstream marker changed; review required: ' + path + ' ' + repr(old[:60]))
    file.write_text(text.replace(old, new, 1), encoding='utf-8')
    return True
