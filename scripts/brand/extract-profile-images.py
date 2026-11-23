"""
Extracts the portraits and partner logos from the Society's 2026 profile into named PNG files, for
`npm run content -w @as/api -- profile-2026` to upload.

    python3 scripts/brand/extract-profile-images.py \
        brand-source/drive-2026-11/profile-2026.pdf brand-source/drive-2026-11/images

Needs PyMuPDF (`pip install pymupdf`). Images are picked by their embedded object number (xref),
checked against the slide layout on 19 Nov 2026; if the Society re-exports the PDF, recheck them.
The output folder is git-ignored with the rest of brand-source/.
"""

import sys
from pathlib import Path

import pymupdf

# slide (1-based) -> {xref: output name}
IMAGES = {
    6: {  # Board of Directors
        16: "board-saad-alzaaqi",
        18: "board-khalid-alanqari",
        20: "board-abdulrahman-alnajadi",
        22: "board-ahlam-alshadoukhi",
        24: "board-abdulwahad-alabdali",
    },
    7: {  # General Assembly (members 5 and 12 have no photo on the slide, only a placeholder)
        52: "assembly-01-abdulwahad-alabdali",
        62: "assembly-02-khalid-alotein",
        36: "assembly-03-abdulrahman-almuhanna",
        46: "assembly-04-michael-murengezi",
        56: "assembly-06-ahlam-alshadoukhi",
        60: "assembly-07-saad-alzaaqi",
        58: "assembly-08-khalid-alanqari",
        54: "assembly-09-abdulrahman-alnajadi",
        44: "assembly-10-charles-cooney",
        40: "assembly-11-mohammed-abdulwahad",
        38: "assembly-13-taher-alabdali",
        42: "assembly-14-hamad-aldawsari",
    },
    41: {  # Partners
        295: "partner-digital-game-association",
        297: "partner-seventies-cafe",
        299: "partner-society-of-oral-medicine",
        301: "partner-effat-university",
        303: "partner-gulf-axes",
        305: "partner-khubara",
        307: "partner-arab-act",
        285: "partner-associations-support-fund",
        287: "partner-microsoft",
        289: "partner-monday",
        291: "partner-nuke",
        293: "partner-foundry",
    },
}


def main(pdf: str, out: str) -> None:
    doc = pymupdf.open(pdf)
    target = Path(out)
    target.mkdir(parents=True, exist_ok=True)
    for slide, wanted in IMAGES.items():
        found = {info["xref"] for info in doc[slide - 1].get_image_info(xrefs=True)}
        for xref, name in wanted.items():
            if xref not in found:
                raise SystemExit(f"slide {slide}: image {xref} ({name}) not found; the PDF changed")
            pix = pymupdf.Pixmap(doc, xref)
            if pix.n - pix.alpha > 3:
                pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            pix.save(str(target / f"{name}.png"))
            print(f"{name}.png {pix.width}x{pix.height}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
