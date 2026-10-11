import os
import struct
import zlib

def make_png(width, height, color_func):
    """Generates an uncompressed RGBA PNG using only python standard library."""
    # Build raw image data (RGBA)
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter byte: 0 = None
        for x in range(width):
            r, g, b, a = color_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data))
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + ihdr_crc
    
    # IDAT chunk
    compressed = zlib.compress(bytes(raw_data), 9)
    idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + compressed))
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + idat_crc
    
    # IEND chunk
    iend_crc = struct.pack('>I', zlib.crc32(b'IEND'))
    png += struct.pack('>I', 0) + b'IEND' + iend_crc
    
    return bytes(png)

def festival_icon_pixel(x, y, width, height, maskable=False):
    # Normalized coords 0 to 1
    nx = x / width
    ny = y / height
    
    # Background
    bg_r, bg_g, bg_b = (17, 17, 17) # #111111 deep charcoal/black
    
    # Gold colors: #A3792C
    gold_r, gold_g, gold_b = (163, 121, 44)
    # Off-white: #FAF8F5
    white_r, white_g, white_b = (250, 248, 245)
    
    # If not maskable, give nice rounded corners if desired or full bleed
    scale = 0.7 if maskable else 0.8
    cx, cy = 0.5, 0.5
    
    # Check bounds relative to center
    dx = (nx - cx) / scale
    dy = (ny - cy) / scale
    
    # Central golden pillar
    # Center pillar is at dx between -0.06 and +0.06, dy between -0.28 and +0.22
    if -0.08 <= dx <= 0.08 and -0.32 <= dy <= 0.22:
        # inner cavity cutout
        if -0.03 <= dx <= 0.03 and -0.22 <= dy <= 0.12:
            return (bg_r, bg_g, bg_b, 255)
        return (gold_r, gold_g, gold_b, 255)
    
    # Left Arabic architecture arch / stroke
    if -0.32 <= dx <= -0.12 and -0.32 <= dy <= 0.28:
        if -0.25 <= dx <= -0.19 and -0.22 <= dy <= 0.20:
            return (bg_r, bg_g, bg_b, 255)
        return (white_r, white_g, white_b, 255)
        
    # Right Arabic architecture arch / stroke
    if 0.12 <= dx <= 0.32 and -0.32 <= dy <= 0.28:
        if 0.19 <= dx <= 0.25 and -0.22 <= dy <= 0.20:
            return (bg_r, bg_g, bg_b, 255)
        return (white_r, white_g, white_b, 255)
        
    # Bottom baseline bar
    if -0.36 <= dx <= 0.36 and 0.24 <= dy <= 0.32:
        return (white_r, white_g, white_b, 255)

    # Film strip crown / leaf on top left: dx: -0.35 to -0.1, dy: -0.45 to -0.32
    if -0.35 <= dx <= -0.10 and -0.44 <= dy <= -0.32:
        # diagonal check
        if abs(dy - (-0.44 + (dx + 0.35)*0.45)) < 0.035:
            # film sprocket notches
            if int(x * 0.15) % 2 == 0:
                return (gold_r, gold_g, gold_b, 255)
            else:
                return (white_r, white_g, white_b, 255)
                
    # Subtitle text bar representation:
    if -0.34 <= dx <= 0.34 and 0.38 <= dy <= 0.42:
        return (gold_r, gold_g, gold_b, 220)
        
    return (bg_r, bg_g, bg_b, 255)

os.makedirs('public', exist_ok=True)

# Generate 192x192
print("Generating 192x192...")
png_192 = make_png(192, 192, lambda x, y, w, h: festival_icon_pixel(x, y, w, h, maskable=False))
with open('public/pwa-192x192.png', 'wb') as f:
    f.write(png_192)

# Generate 512x512
print("Generating 512x512...")
png_512 = make_png(512, 512, lambda x, y, w, h: festival_icon_pixel(x, y, w, h, maskable=False))
with open('public/pwa-512x512.png', 'wb') as f:
    f.write(png_512)

# Generate maskable 512x512 (with safe zone margin)
print("Generating maskable 512x512...")
png_maskable = make_png(512, 512, lambda x, y, w, h: festival_icon_pixel(x, y, w, h, maskable=True))
with open('public/pwa-maskable-512x512.png', 'wb') as f:
    f.write(png_maskable)

# Generate apple-touch-icon (180x180)
print("Generating apple-touch-icon.png...")
png_apple = make_png(180, 180, lambda x, y, w, h: festival_icon_pixel(x, y, w, h, maskable=False))
with open('public/apple-touch-icon.png', 'wb') as f:
    f.write(png_apple)

# Copy favicon
with open('public/favicon.ico', 'wb') as f:
    f.write(png_192)

print("Icons successfully created in public!")
