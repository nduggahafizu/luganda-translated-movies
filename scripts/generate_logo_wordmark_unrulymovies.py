from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


def _find_font() -> Path | None:
    candidates = [
        Path(r"C:\Windows\Fonts\arialblack.ttf"),
        Path(r"C:\Windows\Fonts\arialbd.ttf"),
        Path(r"C:\Windows\Fonts\segoeuib.ttf"),
        Path(r"C:\Windows\Fonts\impact.ttf"),
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def _vertical_gradient(size: tuple[int, int], top_rgb: tuple[int, int, int], bottom_rgb: tuple[int, int, int]) -> Image.Image:
    w, h = size
    base = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(base)
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(top_rgb[0] * (1 - t) + bottom_rgb[0] * t)
        g = int(top_rgb[1] * (1 - t) + bottom_rgb[1] * t)
        b = int(top_rgb[2] * (1 - t) + bottom_rgb[2] * t)
        d.line([(0, y), (w, y)], fill=(r, g, b, 255))
    return base


def _crop_alpha(img: Image.Image, padding: int) -> Image.Image:
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - padding)
    y0 = max(0, y0 - padding)
    x1 = min(img.width, x1 + padding)
    y1 = min(img.height, y1 + padding)
    return img.crop((x0, y0, x1, y1))


def main() -> None:
    root = Path(r"C:\Users\dell\OneDrive\Desktop\unruly")
    out_wordmark = root / "assets" / "images" / "logo-wordmark.png"
    preview = root / "assets" / "images" / "logo-wordmark-preview.png"

    text_left = "UNRULY"
    text_right = "MOVIES"

    # Build on a big transparent canvas then crop tight.
    canvas_w, canvas_h = 1800, 520
    img = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))

    font_path = _find_font()
    draw = ImageDraw.Draw(img)

    # Choose size to match the screenshot proportions.
    target_h = int(canvas_h * 0.55)
    best_font = None
    best = None

    for size in range(int(target_h), int(target_h * 0.6), -2):
        try:
            font = ImageFont.truetype(str(font_path), size=size) if font_path else ImageFont.load_default()
        except Exception:
            font = ImageFont.load_default()

        bbox_l = draw.textbbox((0, 0), text_left, font=font)
        bbox_r = draw.textbbox((0, 0), text_right, font=font)
        wl = bbox_l[2] - bbox_l[0]
        hl = bbox_l[3] - bbox_l[1]
        wr = bbox_r[2] - bbox_r[0]
        hr = bbox_r[3] - bbox_r[1]

        spacing = max(0, int(size * 0.006))
        kerning = -max(0, int(size * 0.035))

        tw = wl + spacing + wr + kerning
        th = max(hl, hr)

        if tw <= int(canvas_w * 0.92) and th <= int(canvas_h * 0.70):
            best_font = font
            best = (bbox_l, bbox_r, spacing, kerning, tw, th)
            break

    if best_font is None or best is None:
        best_font = ImageFont.load_default()
        bbox_l = draw.textbbox((0, 0), text_left, font=best_font)
        bbox_r = draw.textbbox((0, 0), text_right, font=best_font)
        wl = bbox_l[2] - bbox_l[0]
        hl = bbox_l[3] - bbox_l[1]
        wr = bbox_r[2] - bbox_r[0]
        hr = bbox_r[3] - bbox_r[1]
        best = (bbox_l, bbox_r, 0, 0, wl + wr, max(hl, hr))

    bbox_l, bbox_r, spacing, kerning, tw, th = best

    # Center
    x0 = (canvas_w - tw) // 2
    y0 = (canvas_h - th) // 2

    wl = bbox_l[2] - bbox_l[0]
    hl = bbox_l[3] - bbox_l[1]
    wr = bbox_r[2] - bbox_r[0]
    hr = bbox_r[3] - bbox_r[1]

    xl = x0 - bbox_l[0]
    yl = y0 - bbox_l[1] + (th - hl) // 2
    xr = x0 + wl + spacing + kerning - bbox_r[0]
    yr = y0 - bbox_r[1] + (th - hr) // 2

    # Masks
    mask_all = Image.new("L", (canvas_w, canvas_h), 0)
    ma = ImageDraw.Draw(mask_all)
    ma.text((xl, yl), text_left, font=best_font, fill=255)
    ma.text((xr, yr), text_right, font=best_font, fill=255)

    mask_left = Image.new("L", (canvas_w, canvas_h), 0)
    ml = ImageDraw.Draw(mask_left)
    ml.text((xl, yl), text_left, font=best_font, fill=255)

    mask_right = Image.new("L", (canvas_w, canvas_h), 0)
    mr = ImageDraw.Draw(mask_right)
    mr.text((xr, yr), text_right, font=best_font, fill=255)

    # Shadow
    shadow = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    off = max(5, int(best_font.size * 0.06)) if hasattr(best_font, "size") else 10
    sd.text((xl + off, yl + off), text_left, font=best_font, fill=(0, 0, 0, 170))
    sd.text((xr + off, yr + off), text_right, font=best_font, fill=(0, 0, 0, 170))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=max(3, int(canvas_h * 0.01))))
    img = Image.alpha_composite(img, shadow)

    # Fill colors
    left_fill = Image.new("RGBA", (canvas_w, canvas_h), (255, 255, 255, 255))
    green_grad = _vertical_gradient((canvas_w, canvas_h), (0, 255, 80), (0, 160, 45))

    left_layer = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    right_layer = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))

    left_layer.paste(left_fill, (0, 0), mask_left)
    right_layer.paste(green_grad, (0, 0), mask_right)

    img = Image.alpha_composite(img, left_layer)
    img = Image.alpha_composite(img, right_layer)

    # Shine band (top highlight)
    shine = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    sh = ImageDraw.Draw(shine)
    band_y = y0 + int(th * 0.05)
    band_h = int(th * 0.22)
    sh.rectangle([0, band_y, canvas_w, band_y + band_h], fill=(255, 255, 255, 45))
    shine = shine.filter(ImageFilter.GaussianBlur(radius=max(2, int(canvas_h * 0.006))))
    img = Image.alpha_composite(img, Image.composite(shine, Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0)), mask_all))

    # Tight crop so it doesn't look like a boxed image
    cropped = _crop_alpha(img, padding=12)

    out_wordmark.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(out_wordmark)
    cropped.save(preview)

    print("OK")
    print("Updated:", out_wordmark)
    print("Preview:", preview)


if __name__ == "__main__":
    main()
