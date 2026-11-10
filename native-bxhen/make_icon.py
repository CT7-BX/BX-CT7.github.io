#!/usr/bin/env python3
"""Create a PS4 package icon without external assets: 512px RGB PNG (type 2)."""
from pathlib import Path
import struct
import sys
import zlib

SIZE = 512

def png_chunk(kind, payload):
    return (struct.pack('>I', len(payload)) + kind + payload
            + struct.pack('>I', zlib.crc32(kind + payload) & 0xffffffff))

def color(x, y):
    # RGB-only image; no alpha/transparency (PS4 icon requirement).
    edge = min(x, y, SIZE - 1 - x, SIZE - 1 - y)
    if 11 <= edge <= 20:
        return (26, 229, 248) if (x + y) % 40 < 20 else (194, 52, 242)
    if edge < 11:
        return (5, 8, 22)
    # Neon navy background with subtle light field and diagonal scan lines.
    return (6 + (y * 7 // SIZE),
            10 + (x * 8 // SIZE),
            32 + (x * 20 // SIZE) + (3 if (x + y) % 28 < 2 else 0))

def inside_b(x, y):
    return ((105 <= x <= 128 and 165 <= y <= 340)
            or (119 <= x <= 191 and (165 <= y <= 188 or 244 <= y <= 267 or 316 <= y <= 340))
            or (175 <= x <= 199 and (180 <= y <= 251 or 255 <= y <= 326)))

def inside_x(x, y):
    if not (223 <= x <= 335 and 165 <= y <= 340):
        return False
    a = 223 + (y - 165) * 112 // 175
    b = 335 - (y - 165) * 112 // 175
    return abs(x - a) <= 13 or abs(x - b) <= 13

def main():
    path = Path(sys.argv[1] if len(sys.argv) > 1 else 'icon0.png')
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = bytearray()
    for y in range(SIZE):
        raw.append(0)  # PNG scanline filter: None
        for x in range(SIZE):
            if inside_b(x, y):
                raw.extend((34, 231, 251))
            elif inside_x(x, y):
                raw.extend((219, 70, 251))
            else:
                raw.extend(color(x, y))
    png = (b'\x89PNG\r\n\x1a\n'
           + png_chunk(b'IHDR', struct.pack('>IIBBBBB', SIZE, SIZE, 8, 2, 0, 0, 0))
           + png_chunk(b'IDAT', zlib.compress(raw, 9))
           + png_chunk(b'IEND', b''))
    path.write_bytes(png)
    assert png[:8] == b'\x89PNG\r\n\x1a\n'
    assert struct.unpack_from('>II', png, 16) == (512, 512)
    assert png[24:26] == bytes([8, 2])
    print('BX-HEN icon0: 512x512 RGB, 24-bit,', len(png), 'bytes')

if __name__ == '__main__':
    main()
