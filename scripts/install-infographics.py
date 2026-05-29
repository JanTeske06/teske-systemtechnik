"""Install Apolinar's final infographic assets into the case-study pages.

Source files:
  PNG (1)/PNG/<...>.png
  svg/SVG/<...>.svg

Target:
  static/projects/<slug>/images/infographic.{svg,png}
  Replace the "<aside ... Diagramm folgt ...>" placeholder in every DE/EN
  case-study HTML with an <img> embedding the infographic.

Idempotent: re-running is a no-op once assets are installed and placeholders
are replaced."""

from pathlib import Path
import re
import shutil
import sys

ROOT = Path(__file__).resolve().parent.parent

# slug -> (svg source name, png source name, alt-text per language)
ASSETS = {
    "microsoft-shopping-feed": {
        "svg": "Automated ETL Pipeline - Teske Systemtechnik.svg",
        "png": "Automated-ETL-Pipeline---Teske-Systemtechnik.png",
        "alt_de": "Microsoft Shopping Feed Pipeline — Infografik",
        "alt_en": "Microsoft Shopping Feed Pipeline — infographic",
    },
    "legacy-data-extraction": {
        "svg": "Legacy DB Reverse - Teske Systemtechnik.svg",
        "png": "Legacy-DB-Reverse---Teske-Systemtechnik.png",
        "alt_de": "Legacy-DB Reverse Engineering & Migration — Infografik",
        "alt_en": "Legacy DB Reverse Engineering & Migration — infographic",
    },
    "book-lister-ai": {
        "svg": "Book Lister AI - Teske Systemtechnik.svg",
        "png": "Book-Lister-AI---Teske-Systemtechnik.png",
        "alt_de": "Book Lister AI — Vorher/Nachher-Infografik",
        "alt_en": "Book Lister AI — before/after infographic",
    },
    "browser-automation-framework": {
        "svg": "Multi Process Browser Automation - Teske Systemtechnik.svg",
        "png": "Multi-Process-Browser-Automation---Teske-Systemtechnik.png",
        "alt_de": "Multi-Process Browser-Automation Framework — Codebase-Treemap",
        "alt_en": "Multi-Process Browser-Automation Framework — codebase treemap",
    },
}

LANGS = [("de", "de/projekte"), ("en", "en/projects")]

SRC_SVG_DIR = ROOT / "svg" / "SVG"
SRC_PNG_DIR = ROOT / "PNG (1)" / "PNG"


# --- Step 1: copy assets ----------------------------------------------------

def copy_assets() -> int:
    rc = 0
    for slug, meta in ASSETS.items():
        target_dir = ROOT / "static" / "projects" / slug / "images"
        if not target_dir.is_dir():
            print(f"  [FAIL] {slug}: target dir does not exist: {target_dir}")
            rc = 1
            continue
        for ext, src_dir, src_name in [
            ("svg", SRC_SVG_DIR, meta["svg"]),
            ("png", SRC_PNG_DIR, meta["png"]),
        ]:
            src = src_dir / src_name
            dst = target_dir / f"infographic.{ext}"
            if not src.is_file():
                print(f"  [MISS] {slug}.{ext}: source not found: {src}")
                rc = 1
                continue
            if dst.is_file() and dst.stat().st_size == src.stat().st_size:
                print(f"  [SKIP] {slug}.{ext} (already installed, same size)")
                continue
            shutil.copy2(src, dst)
            print(f"  [ok]   {slug}.{ext} -> {dst.relative_to(ROOT)}")
    return rc


# --- Step 2: replace placeholders ------------------------------------------

# Match the placeholder <aside>...</aside> block. We accept any aria-label and
# any inner text, because those vary across projects + languages.
PLACEHOLDER_RE = re.compile(
    r'            <aside class="not-prose mt-10 mb-10 flex aspect-\[16/9\] items-center justify-center rounded-2xl border border-stone-800 bg-stone-900/60"[^>]*>\n'
    r'              <div class="text-center">\n'
    r'                <p class="font-aspekta text-xs font-semibold uppercase tracking-widest text-stone-500">[^<]+</p>\n'
    r'                <p class="mt-2 text-sm text-stone-400">[^<]+</p>\n'
    r'              </div>\n'
    r'            </aside>\n',
)


def replace_placeholder(html: str, slug: str, alt_text: str) -> tuple[str, bool]:
    new_block = (
        f'            <figure class="not-prose mt-10 mb-10 overflow-hidden rounded-2xl border border-stone-800">\n'
        f'              <img src="/static/projects/{slug}/images/infographic.svg" '
        f'alt="{alt_text}" class="block w-full" loading="lazy">\n'
        f'            </figure>\n'
    )
    new_text, n = PLACEHOLDER_RE.subn(new_block, html, count=1)
    return new_text, n > 0


def patch_html_files() -> int:
    rc = 0
    for lang_code, projects_dir in LANGS:
        for slug, meta in ASSETS.items():
            path = ROOT / projects_dir / slug / "index.html"
            if not path.is_file():
                print(f"  [MISS] {lang_code}/{slug}")
                rc = 1
                continue
            text = path.read_text(encoding="utf-8")

            already_done = f'/static/projects/{slug}/images/infographic.svg' in text
            if already_done:
                print(f"  [SKIP] {lang_code}/{slug} (already embeds infographic)")
                continue

            alt = meta[f"alt_{lang_code}"]
            new_text, replaced = replace_placeholder(text, slug, alt)
            if not replaced:
                print(f"  [FAIL] {lang_code}/{slug}: placeholder pattern not found")
                rc = 1
                continue
            path.write_text(new_text, encoding="utf-8")
            print(f"  [ok]   {lang_code}/{slug}: placeholder replaced")
    return rc


def main() -> int:
    print("[1] copying assets")
    rc1 = copy_assets()
    print("\n[2] replacing placeholders in DE/EN case-study HTMLs")
    rc2 = patch_html_files()
    return rc1 | rc2


if __name__ == "__main__":
    raise SystemExit(main())
