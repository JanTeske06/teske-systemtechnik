"""Wrap each embedded infographic <img> in an <a data-lightbox> link, so a
click opens the full-resolution PNG in an in-page lightbox (via
/static/js/lightbox.js). Also injects the lightbox.js <script> tag in the
<head> of every patched case-study HTML.

Idempotent: re-running is a no-op."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

IMG_RE = re.compile(
    r'              <img src="(/static/projects/(?P<slug>[^/]+)/images/infographic\.png)" '
    r'alt="(?P<alt>[^"]+)" class="block w-full" loading="lazy">\n'
)

LABELS = {
    "de": "Infografik in voller Größe ansehen",
    "en": "View infographic at full size",
}

LIGHTBOX_SCRIPT = '<script src="/static/js/lightbox.js?v=20260529a" defer></script>'

# Anchor for inserting the <script> tag: right before the closing </head>.
HEAD_CLOSE_RE = re.compile(r'(\n)</head>', re.IGNORECASE)


def patch_file(path: Path, lang: str) -> str:
    text = path.read_text(encoding="utf-8")

    actions: list[str] = []

    # 1) Add lightbox.js to <head> if not already present.
    if 'js/lightbox.js' not in text:
        new_text, n = HEAD_CLOSE_RE.subn(
            f'\n  {LIGHTBOX_SCRIPT}\n</head>', text, count=1,
        )
        if n:
            text = new_text
            actions.append("script-added")
        else:
            return "fail-no-head-anchor"

    # 2) Wrap <img> in anchor with data-lightbox.
    if "data-lightbox" not in text:
        def replacer(m: re.Match) -> str:
            src = m.group(1)
            alt = m.group("alt")
            label = LABELS[lang]
            return (
                f'              <a href="{src}" data-lightbox\n'
                f'                 aria-label="{label}" title="{label}"\n'
                f'                 class="group block cursor-zoom-in">\n'
                f'                <img src="{src}" alt="{alt}" '
                f'class="block w-full transition group-hover:opacity-90" loading="lazy">\n'
                f'              </a>\n'
            )
        text, n = IMG_RE.subn(replacer, text, count=1)
        if not n:
            return "fail-no-img-match (script ok)" if actions else "fail-no-img-match"
        actions.append("img-wrapped")

    if not actions:
        return "skip-already-applied"

    path.write_text(text, encoding="utf-8")
    return "ok: " + ", ".join(actions)


def main() -> int:
    rc = 0
    for lang, base in [("de", "de/projekte"), ("en", "en/projects")]:
        for path in sorted((ROOT / base).glob("*/index.html")):
            slug = path.parent.name
            if not (ROOT / "static" / "projects" / slug / "images" / "infographic.png").is_file():
                continue
            status = patch_file(path, lang)
            tag = "ok" if status.startswith("ok") else "SKIP" if status.startswith("skip") else "FAIL"
            print(f"  [{tag}] {lang}/{slug}: {status}")
            if status.startswith("fail"):
                rc = 1
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
