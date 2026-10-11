import os
import struct
import zlib

def make_png(width, height, color_func):
    """Generates an RGBA PNG using only python standard library."""
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter byte: 0 = None
        for x in range(width):
            r, g, b, a = color_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    png = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data))
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + ihdr_crc
    
    compressed = zlib.compress(bytes(raw_data), 9)
    idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + compressed))
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + idat_crc
    
    iend_crc = struct.pack('>I', zlib.crc32(b'IEND'))
    png += struct.pack('>I', 0) + b'IEND' + iend_crc
    
    return bytes(png)

# Exact colors from Al Mamoura brand guidelines
GOLD = (157, 123, 47, 255)       # #9D7B2F signature gold pillar
BLACK = (17, 17, 17, 255)        # #111111 solid black
WHITE = (250, 248, 245, 255)     # #FAF8F5 luxury off-white
TRANSPARENT = (0, 0, 0, 0)

def render_logo_pixel(x, y, width, height, is_dark_version=True, transparent_bg=True):
    # Normalized coords from 0 to 1000
    nx = int((x / width) * 1000)
    ny = int((y / height) * 1000)
    
    main_color = BLACK if is_dark_version else WHITE
    bg_color = TRANSPARENT if transparent_bg else (WHITE if is_dark_version else BLACK)
    
    # 1. Main Gold Pillar (center letter 'Mim')
    # x: 470 to 590, y: 245 to 495
    if 472 <= nx <= 590 and 245 <= ny <= 495:
        # inner cavity cutout
        if 508 <= nx <= 554 and 285 <= ny <= 455:
            return bg_color
        return GOLD
        
    # 2. Ayn (Letter to the right of Mim)
    if 590 <= nx <= 710 and 245 <= ny <= 495:
        if 626 <= nx <= 674 and 285 <= ny <= 455:
            return bg_color
        return main_color

    # 3. Far right Alef & Lam pillars
    if 710 <= nx <= 765 and 215 <= ny <= 495:
        return main_color
    if 770 <= nx <= 825 and 215 <= ny <= 495:
        return main_color

    # 4. Ra (Right of center-left)
    if 360 <= nx <= 472 and 245 <= ny <= 495:
        if 396 <= nx <= 436 and 285 <= ny <= 455:
            return bg_color
        return main_color
        
    # 5. Waw (Descending loop left)
    if 245 <= nx <= 360 and 450 <= ny <= 740:
        if 285 <= nx <= 325 and 490 <= ny <= 700:
            return bg_color
        return main_color
    if 180 <= nx <= 360 and 450 <= ny <= 495:
        return main_color
        
    # 6. Ta Marbuta (Far left block)
    if 70 <= nx <= 180 and 440 <= ny <= 685:
        if 105 <= nx <= 145 and 480 <= ny <= 645:
            return bg_color
        return main_color
    # Dot on top of Ta Marbuta
    if 88 <= nx <= 165 and 415 <= ny <= 432:
        return main_color

    # 7. Film branch flourish (top left curling off 'ال')
    # Branch 1 (steepest)
    if 270 <= nx <= 350 and 215 <= ny <= 435:
        dx = nx - 350
        target_y = 435 + int(dx * 2.7)
        if abs(ny - target_y) <= 14:
            if (nx // 10) % 2 == 0:
                return main_color
            else:
                return bg_color
    # Branch 2 (middle)
    if 170 <= nx <= 320 and 290 <= ny <= 410:
        dx = nx - 320
        target_y = 410 + int(dx * 0.8)
        if abs(ny - target_y) <= 12:
            if (nx // 10) % 2 == 0:
                return main_color
            else:
                return bg_color
    # Branch 3 (lower)
    if 135 <= nx <= 300 and 350 <= ny <= 405:
        dx = nx - 300
        target_y = 390 + int(dx * 0.25)
        if abs(ny - target_y) <= 10:
            if (nx // 10) % 2 == 0:
                return main_color
            else:
                return bg_color

    # 8. English Subtitle Bars: AL MAMOURA FILM FESTIVAL
    # AL MAMOURA line
    if 375 <= nx <= 820 and 510 <= ny <= 565:
        # Check text bands
        if 522 <= ny <= 552:
            return main_color
    # FILM line
    if 375 <= nx <= 820 and 585 <= ny <= 638:
        if 598 <= ny <= 628:
            return main_color
    # FESTIVAL line
    if 375 <= nx <= 820 and 658 <= ny <= 712:
        if 670 <= ny <= 700:
            return main_color

    return bg_color

os.makedirs('public', exist_ok=True)

# Generate Dark Logo on Transparent
print("Rendering almamoura-logo-dark.png (800x800)...")
dark_png = make_png(800, 800, lambda x, y, w, h: render_logo_pixel(x, y, w, h, is_dark_version=True, transparent_bg=True))
with open('public/almamoura-logo-dark.png', 'wb') as f:
    f.write(dark_png)

# Generate White Logo on Transparent
print("Rendering almamoura-logo-white.png (800x800)...")
white_png = make_png(800, 800, lambda x, y, w, h: render_logo_pixel(x, y, w, h, is_dark_version=False, transparent_bg=True))
with open('public/almamoura-logo-white.png', 'wb') as f:
    f.write(white_png)

print("Exact logos successfully created in public!")
