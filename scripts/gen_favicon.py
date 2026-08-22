from PIL import Image, ImageDraw


def draw_badge(size: int) -> Image.Image:
    """Same badge as the SVG favicon: lime-400 rounded square + black piggy-bank glyph."""
    scale = 4  # supersample for smooth edges, then downscale
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    radius = int(s * (12 / 32))  # same corner-radius ratio as the real rounded-xl badge
    draw.rounded_rectangle([0, 0, s - 1, s - 1], radius=radius, fill=(163, 230, 53, 255))  # lime-400

    cx, cy = s / 2, s / 2
    stroke = max(2, int(s * (2 / 32) * 0.62))
    black = (0, 0, 0, 255)

    # Simplified piggy-bank glyph (rounded body, ear, eye, coin slot, legs, snout)
    body_w, body_h = s * 0.48, s * 0.36
    body_box = [cx - body_w / 2, cy - body_h / 2 + s * 0.02, cx + body_w / 2, cy + body_h / 2 + s * 0.02]
    draw.rounded_rectangle(body_box, radius=int(body_h * 0.5), outline=black, width=stroke)

    # Ear — small thin triangle sitting on top of the body's back-right curve
    ear_base_x = body_box[2] - body_w * 0.2
    ear = [
        (ear_base_x - body_w * 0.03, body_box[1] + body_h * 0.16),
        (ear_base_x + body_w * 0.14, body_box[1] - body_h * 0.22),
        (ear_base_x + body_w * 0.2, body_box[1] + body_h * 0.06),
    ]
    draw.line([ear[0], ear[1], ear[2]], fill=black, width=max(2, stroke - 2), joint="curve")

    # Snout (small circle on the left)
    snout_r = body_h * 0.11
    snout_c = (body_box[0] + body_w * 0.04, cy + s * 0.02)
    draw.ellipse(
        [snout_c[0] - snout_r, snout_c[1] - snout_r, snout_c[0] + snout_r, snout_c[1] + snout_r],
        outline=black,
        width=max(2, stroke - 2),
    )

    # Eye
    eye_r = max(2, int(s * 0.011))
    eye_c = (body_box[0] + body_w * 0.34, cy - s * 0.02)
    draw.ellipse([eye_c[0] - eye_r, eye_c[1] - eye_r, eye_c[0] + eye_r, eye_c[1] + eye_r], fill=black)

    # Coin slot (small notch on top)
    slot_x = cx + body_w * 0.02
    draw.line(
        [(slot_x - s * 0.018, body_box[1] + s * 0.006), (slot_x + s * 0.018, body_box[1] + s * 0.006)],
        fill=black,
        width=max(2, stroke - 2),
    )

    # Legs — start slightly above the body's bottom edge so they visually merge with it
    leg_w = max(2, int(s * 0.038))
    leg_y0 = body_box[3] - body_h * 0.22
    leg_y1 = body_box[3] + s * 0.07
    for lx in (body_box[0] + body_w * 0.24, body_box[2] - body_w * 0.24):
        draw.line([(lx, leg_y0), (lx, leg_y1)], fill=black, width=leg_w)

    return img.resize((size, size), Image.LANCZOS)


sizes = {
    "/mnt/user-data/outputs/_preview_favicon_512.png": 512,
    "icon-512.png": 512,
    "icon-192.png": 192,
    "apple-touch-icon.png": 180,
}

base_512 = None
for path, size in sizes.items():
    img = draw_badge(size)
    if size == 512 and base_512 is None:
        base_512 = img
    out_path = path if path.startswith("/mnt") else f"public/{path}"
    img.save(out_path)

# Multi-resolution favicon.ico for legacy browser support
ico_sizes = [16, 32, 48]
ico_img = draw_badge(48)
ico_img.save("public/favicon.ico", sizes=[(s, s) for s in ico_sizes])

print("done")
