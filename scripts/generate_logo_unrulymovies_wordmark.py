from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


def _find_font() -> Path | None:
    candidates = [
        Path(r"C:\Windows\Fonts\arialbd.ttf"),  # Arial Bold
        Path(r"C:\Windows\Fonts\arialblack.ttf"),
        Path(r"C:\Windows\Fonts\segoeuib.ttf"),  # Segoe UI Bold
        Path(r"C:\Windows\Fonts\impact.ttf"),
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def _linear_gradient(size: tuple[int, int], top_rgb: tuple[int, int, int], bottom_rgb: tuple[int, int, int]) -> Image.Image:
    w, h = size
    base = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(base)
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(top_rgb[0] * (1 - t) + bottom_rgb[0] * t)
        g = int(top_rgb[1] * (1 - t) + bottom_rgb[1] * t)
        b = int(top_rgb[2] * (1 - t) + bottom_rgb[2] * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
    return base


def main() -> None:
    root = Path(r"C:\Users\dell\OneDrive\Desktop\unruly")

    out_logo = root / "assets" / "images" / "logo.png"
    preview = root / "assets" / "images" / "logo-unrulymovies-preview.png"

    canvas_size = 1024

    text_left = "UNRULY"
    text_right = "MOVIES"

    font_path = _find_font()

    # Create square canvas with black background (matches reference)
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 255))

    # Draw text masks on a temp image to measure
    measure = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    mdraw = ImageDraw.Draw(measure)

    # Fit a single-line wordmark across the canvas
    pad_x = int(canvas_size * 0.08)
    pad_y = int(canvas_size * 0.33)
    max_w = canvas_size - pad_x * 2
    max_h = int(canvas_size * 0.40)

    best_font = None
    best = None

    for size in range(int(canvas_size * 0.22), int(canvas_size * 0.08), -2):
        try:
            font = ImageFont.truetype(str(font_path), size=size) if font_path else ImageFont.load_default()
        except Exception:
            font = ImageFont.load_default()

        bbox_l = mdraw.textbbox((0, 0), text_left, font=font)
        bbox_r = mdraw.textbbox((0, 0), text_right, font=font)
        wl = bbox_l[2] - bbox_l[0]
        hl = bbox_l[3] - bbox_l[1]
        wr = bbox_r[2] - bbox_r[0]
        hr = bbox_r[3] - bbox_r[1]

        # Tight spacing like the reference
        spacing = max(0, int(size * 0.01))
        kerning = -max(0, int(size * 0.03))

        tw = wl + spacing + wr + kerning
        th = max(hl, hr)

        if tw <= max_w and th <= max_h:
            best_font = font
            best = (bbox_l, bbox_r, spacing, kerning, tw, th)
            break

    if best_font is None or best is None:
        best_font = ImageFont.load_default()
        bbox_l = mdraw.textbbox((0, 0), text_left, font=best_font)
        bbox_r = mdraw.textbbox((0, 0), text_right, font=best_font)
        best = (bbox_l, bbox_r, 0, 0, (bbox_l[2] - bbox_l[0]) + (bbox_r[2] - bbox_r[0]), max(bbox_l[3] - bbox_l[1], bbox_r[3] - bbox_r[1]))

    bbox_l, bbox_r, spacing, kerning, tw, th = best

    # Center horizontally, place slightly above center (like a header logo)
    x0 = (canvas_size - tw) // 2
    y0 = (canvas_size - th) // 2 - int(canvas_size * 0.03)

    wl = bbox_l[2] - bbox_l[0]
    hl = bbox_l[3] - bbox_l[1]
    wr = bbox_r[2] - bbox_r[0]
    hr = bbox_r[3] - bbox_r[1]

    xl = x0 - bbox_l[0]
    yl = y0 - bbox_l[1] + (th - hl) // 2
    xr = x0 + wl + spacing + kerning - bbox_r[0]
    yr = y0 - bbox_r[1] + (th - hr) // 2

    # Build masks
    mask = Image.new("L", (canvas_size, canvas_size), 0)
    m = ImageDraw.Draw(mask)
    m.text((xl, yl), text_left, font=best_font, fill=255)
    m.text((xr, yr), text_right, font=best_font, fill=255)

    mask_l = Image.new("L", (canvas_size, canvas_size), 0)
    ml = ImageDraw.Draw(mask_l)
    ml.text((xl, yl), text_left, font=best_font, fill=255)

    mask_r = Image.new("L", (canvas_size, canvas_size), 0)
    mr = ImageDraw.Draw(mask_r)
    mr.text((xr, yr), text_right, font=best_font, fill=255)

    # Shadow (soft)
    shadow = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    offset = max(3, int(canvas_size * 0.01))
    sd.text((xl + offset, yl + offset), text_left, font=best_font, fill=(0, 0, 0, 180))
    sd.text((xr + offset, yr + offset), text_right, font=best_font, fill=(0, 0, 0, 180))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=max(2, int(canvas_size * 0.006))))
    img = Image.alpha_composite(img, shadow)

    # Fill: white part with subtle highlight; green part with neon-ish gradient
    left_grad = _linear_gradient((canvas_size, canvas_size), (235, 235, 235), (255, 255, 255))
    right_grad = _linear_gradient((canvas_size, canvas_size), (0, 255, 76), (0, 170, 55))

    left = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    right = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))

    left.paste(left_grad, (0, 0), mask_l)
    right.paste(right_grad, (0, 0), mask_r)

    img = Image.alpha_composite(img, left)
    img = Image.alpha_composite(img, right)

    # Very subtle top shine band (like the reference glare)
    shine = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    sd2 = ImageDraw.Draw(shine)
    band_h = int(th * 0.18)
    sd2.rectangle([0, y0 - int(th * 0.1), canvas_size, y0 - int(th * 0.1) + band_h], fill=(255, 255, 255, 40))
    shine = shine.filter(ImageFilter.GaussianBlur(radius=max(2, int(canvas_size * 0.004))))
    img = Image.alpha_composite(img, Image.composite(shine, Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0)), mask))

    # Save
    out_logo.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_logo)
    img.save(preview)

    print("OK")
    print("Updated:", out_logo)
    print("Preview:", preview)


if __name__ == "__main__":
    main()
