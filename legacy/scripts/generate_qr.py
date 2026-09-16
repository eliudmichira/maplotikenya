"""Generate a QR code PNG from the given details.

Usage (Python 3, from the repo root):

    python scripts/generate_qr.py "FHC2025458566" "JANE NJOKI WAIRIMU" "ID 450924627" -o out/qr.png

Pass each line as a separate positional argument, or use --text for a
multi-line payload. The QR is styled like the clinic ID cards: black on
white, with a quiet-zone border.
"""

import argparse
import sys
from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_M


def build_qr(payload: str, box_size: int = 10, border: int = 4):
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=box_size,
        border=border,
    )
    qr.add_data(payload)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("lines", nargs="*", help="each line of the QR payload")
    parser.add_argument(
        "--text",
        help="full payload as one string (newlines allowed); overrides positional lines",
    )
    parser.add_argument(
        "-o", "--output", default="new_barcode.png", help="output PNG path"
    )
    parser.add_argument("--box-size", type=int, default=10)
    parser.add_argument("--border", type=int, default=4)
    args = parser.parse_args()

    if args.text is not None:
        payload = args.text
    elif args.lines:
        payload = "\n".join(args.lines)
    else:
        parser.error("provide at least one detail line or --text")

    image = build_qr(payload, box_size=args.box_size, border=args.border)
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    image.save(out)
    print(f"Saved {out} ({image.size[0]}x{image.size[1]})")

    # Sanity check: decode it back with the QRCodeDetector we know is present.
    try:
        import cv2

        import numpy as np

        arr = np.array(image.convert("RGB"))[:, :, ::-1]
        data, _, _ = cv2.QRCodeDetector().detectAndDecode(arr)
        if data == payload:
            print("Verified: decoded payload matches")
        else:
            print(f"WARNING: decoded back as {data!r}")
    except Exception as exc:  # pragma: no cover - cv2/numpy optional
        print(f"Note: could not self-verify ({exc})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
