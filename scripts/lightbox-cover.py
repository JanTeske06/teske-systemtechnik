"""Make the case-study hero cover image clickable: wraps it in an
<a data-lightbox> link so it opens in the in-page lightbox, adds the orange
hover frame, and ensures /static/js/lightbox.js is loaded.

Runs across all 15 case-studies (5 projects x DE/EN/RU). Idempotent."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

LANGS = [
    ("de", "de/projekte", "Cover-Bild in voller Größe ansehen"),
    ("en", "en/projects", "View cover image at full size"),
    ("ru", "ru/proekty",  "Открыть обложку в полном размере"),
]

LIGHTBOX_SCRIPT = '<script src="/static/js/lightbox.js?v=20260529a" defer></script>'

HEAD_CLOSE_RE = re.compile(r'(\n)</head>', re.IGNORECASE)

# Match the bare cover block:
#       <div class="mt-10 overflow-hidden rounded-3xl border border-stone-800">
#         <img src="..." alt="..." class="w-full">
#       </div>
COVER_RE = re.compile(
    r'      <div class="mt-10 overflow-hidden rounded-3xl border border-stone-800">\n'
    r'        <img src="(?P<src>[^"]+)" alt="(?P<alt>[^"]+)" class="w-full">\n'
    r'      </div>\n'
)


def patch_file(path: Path, label: str) -> str:
    text = path.read_text(encoding="utf-8")
    actions: list[str] = []

    # 1) Ensure lightbox.js is loaded.
    if 'js/lightbox.js' not in text:
        new_text, n = HEAD_CLOSE_RE.subn(
            f'\n  {LIGHTBOX_SCRIPT}\n</head>', text, count=1,
        )
        if n:
            text = new_text
            actions.append("script-added")
        else:
            return "fail-no-head-anchor"

    # 2) Wrap cover <img> in lightbox anchor + add hover frame.
    if 'data-lightbox' in text and 'cover.' in text and 'cursor-zoom-in' in text:
        # Already wrapped earlier for the infographic; check whether the cover-specific anchor exists.
        # We detect cover-anchor by presence of cover.svg right after a data-lightbox.
        if re.search(r'data-lightbox[^>]*>\s*<img src="[^"]*/cover\.', text):
            return "skip-already-wrapped" if not actions else "ok: " + ", ".join(actions)

    def replacer(m: re.Match) -> str:
        src = m.group("src")
        alt = m.group("alt")
        return (
            f'      <div class="mt-10 overflow-hidden rounded-3xl border border-stone-800 transition-colors hover:border-orange-500/60">\n'
            f'        <a href="{src}" data-lightbox\n'
            f'           aria-label="{label}" title="{label}"\n'
            f'           class="group block cursor-zoom-in">\n'
            f'          <img src="{src}" alt="{alt}" class="block w-full transition group-hover:opacity-90">\n'
            f'        </a>\n'
            f'      </div>\n'
        )

    new_text, n = COVER_RE.subn(replacer, text, count=1)
    if not n:
        return "fail-no-cover-match" if not actions else "ok-partial: " + ", ".join(actions)
    text = new_text
    actions.append("cover-wrapped")

    path.write_text(text, encoding="utf-8")
    return "ok: " + ", ".join(actions)


def main() -> int:
    rc = 0
    for lang_code, projects_dir, label in LANGS:
        for path in sorted((ROOT / projects_dir).glob("*/index.html")):
            slug = path.parent.name
            status = patch_file(path, label)
            tag = "ok" if status.startswith("ok") else "SKIP" if status.startswith("skip") else "FAIL"
            print(f"  [{tag}] {lang_code}/{slug}: {status}")
            if status.startswith("fail"):
                rc = 1
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
