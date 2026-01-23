from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


def main() -> None:
    # Reference icon (outside workspace)
    ref_ico = Path(r"C:\Users\dell\OneDrive\Desktop\hafithu modes\munowatch\favicon.ico")

    # Targets (inside workspace)
    root = Path(r"C:\Users\dell\OneDrive\Desktop\unruly")
    out_png = root / "assets" / "images" / "favicon.png"
    out_ico = root / "favicon.ico"
    out_logo = root / "assets" / "images" / "logo.png"

    preview_ref = root / "assets" / "images" / "reference-munowatch-favicon.png"
    preview_new = root / "assets" / "images" / "favicon-um-preview-256.png"

    if not ref_ico.exists():
        raise SystemExit(f"Reference favicon not found: {ref_ico}")

    ico = Image.open(ref_ico)

    frames: list[Image.Image] = []
    try:
        n_frames = getattr(ico, "n_frames", 1)
    except Exception:
        n_frames = 1

    for i in range(n_frames):
        try:
            ico.seek(i)
            frames.append(ico.copy().convert("RGBA"))
        except Exception:
            pass

    if not frames:
        frames = [ico.convert("RGBA")]

    base = max(frames, key=lambda im: im.size[0] * im.size[1])
    w, h = base.size

    preview_ref.parent.mkdir(parents=True, exist_ok=True)
    base.save(preview_ref)

    # Estimate background from border pixels
    px = base.load()
    border = max(2, int(min(w, h) * 0.08))

    samples: list[tuple[int, int, int]] = []
    for y in range(h):
        for x in range(w):
            if x < border or x >= w - border or y < border or y >= h - border:
                r, g, b, a = px[x, y]
                if a > 200:
                    samples.append((r, g, b))

    if not samples:
        bg = (0, 0, 0)
    else:
        buckets: dict[tuple[int, int, int], int] = {}
        for r, g, b in samples:
            key = (r // 8, g // 8, b // 8)
            buckets[key] = buckets.get(key, 0) + 1
        best = max(buckets.items(), key=lambda kv: kv[1])[0]
        bg = (best[0] * 8 + 4, best[1] * 8 + 4, best[2] * 8 + 4)

    # Estimate foreground by averaging non-bg pixels
    fg_samples: list[tuple[int, int, int]] = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 200:
                continue
            dist = abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2])
            if dist > 60:
                fg_samples.append((r, g, b))

    if fg_samples:
        fg = (
            int(sum(c[0] for c in fg_samples) / len(fg_samples)),
            int(sum(c[1] for c in fg_samples) / len(fg_samples)),
            int(sum(c[2] for c in fg_samples) / len(fg_samples)),
        )
    else:
        lum = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]
        fg = (255, 255, 255) if lum < 128 else (0, 0, 0)

    # Create a proper square favicon canvas.
    # (Some ICOs in the wild are oddly non-square; browsers still expect standard square sizes.)
    canvas_size = 256
    new = Image.new("RGBA", (canvas_size, canvas_size), bg + (255,))
    draw = ImageDraw.Draw(new)

    text_u = "U"
    text_m = "M"

    font_candidates = [
        Path(r"C:\Windows\Fonts\arialbd.ttf"),
        Path(r"C:\Windows\Fonts\segoeuib.ttf"),
        Path(r"C:\Windows\Fonts\seguisb.ttf"),
    ]
    font_path = next((p for p in font_candidates if p.exists()), None)

    pad = int(canvas_size * 0.12)
    max_w = canvas_size - pad * 2
    max_h = canvas_size - pad * 2

    best_font: ImageFont.ImageFont | None = None
    best_bboxes = None
    best_spacing = None
    best_kerning = None

    for size in range(int(canvas_size * 0.80), int(canvas_size * 0.22), -2):
        try:
            font = ImageFont.truetype(str(font_path), size=size) if font_path else ImageFont.load_default()
        except Exception:
            font = ImageFont.load_default()

        bbox_u = draw.textbbox((0, 0), text_u, font=font)
        bbox_m = draw.textbbox((0, 0), text_m, font=font)
        wu = bbox_u[2] - bbox_u[0]
        hu = bbox_u[3] - bbox_u[1]
        wm = bbox_m[2] - bbox_m[0]
        hm = bbox_m[3] - bbox_m[1]

        # Tight tracking/kerning to mimic the reference mark
        # spacing: extra gap between glyphs (keep minimal)
        # kerning: negative pulls M closer to U
        spacing = max(0, int(size * 0.004))
        kerning = -max(0, int(size * 0.02))

        tw = wu + spacing + wm + kerning
        th = max(hu, hm)

        if tw <= max_w and th <= max_h:
            best_font = font
            best_bboxes = (bbox_u, bbox_m)
            best_spacing = spacing
            best_kerning = kerning
            break

    if best_font is None or best_bboxes is None or best_spacing is None or best_kerning is None:
        best_font = ImageFont.load_default()
        bbox_u = draw.textbbox((0, 0), text_u, font=best_font)
        bbox_m = draw.textbbox((0, 0), text_m, font=best_font)
        best_bboxes = (bbox_u, bbox_m)
        best_spacing = 0
        best_kerning = 0

    bbox_u, bbox_m = best_bboxes
    wu = bbox_u[2] - bbox_u[0]
    hu = bbox_u[3] - bbox_u[1]
    wm = bbox_m[2] - bbox_m[0]
    hm = bbox_m[3] - bbox_m[1]

    tw = wu + best_spacing + wm + best_kerning
    th = max(hu, hm)

    x0 = (canvas_size - tw) // 2
    y0 = (canvas_size - th) // 2

    # Align each glyph to the shared top box, adjusting for its own bbox offset.
    xu = x0 - bbox_u[0]
    yu = y0 - bbox_u[1] + (th - hu) // 2
    xm = x0 + wu + best_spacing + best_kerning - bbox_m[0]
    ym = y0 - bbox_m[1] + (th - hm) // 2

    shadow = (0, 0, 0, 120) if (fg[0] + fg[1] + fg[2]) > 500 else (255, 255, 255, 80)
    shadow_offset = max(1, int(canvas_size * 0.02))

    # U (white) + M (green)
    u_fill = (255, 255, 255, 255)
    # Use the site's dark green (matches css/style.css --primary-dark).
    m_fill = (0x66, 0xCC, 0x00, 255)

    draw.text((xu + shadow_offset, yu + shadow_offset), text_u, font=best_font, fill=shadow)
    draw.text((xm + shadow_offset, ym + shadow_offset), text_m, font=best_font, fill=shadow)
    draw.text((xu, yu), text_u, font=best_font, fill=u_fill)
    draw.text((xm, ym), text_m, font=best_font, fill=m_fill)

    new.save(preview_new)

    # Save favicon.png (site uses this everywhere)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    new.resize((32, 32), Image.Resampling.LANCZOS).save(out_png)

    # Save multi-size favicon.ico
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    new.save(out_ico, format="ICO", sizes=sizes)

    # Save a high-res square logo used by Apple touch / PWA icon generation.
    out_logo.parent.mkdir(parents=True, exist_ok=True)
    new.resize((1024, 1024), Image.Resampling.LANCZOS).save(out_logo)

    print("OK")
    print("Reference preview:", preview_ref)
    print("New preview:", preview_new)
    print("Updated:", out_png)
    print("Updated:", out_ico)
    print("Updated:", out_logo)
    print("Detected bg:", bg, "fg:", fg, "reference_size:", base.size)


if __name__ == "__main__":
    main()
