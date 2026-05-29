"""Finish the lightbox rollout across all case studies in all languages:

1) Wrap the AWS Cost Optimization in-body diagram (the before/after AWS
   architecture image) with the lightbox, in DE/EN/RU.

2) Insert the project infographic block into the four RU case studies that
   have an infographic asset (legacy, book-lister, browser-automation,
   microsoft-shopping-feed). DE and EN already have it from a previous run.

Idempotent: re-running is a no-op."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

# --- 1) AWS diagram wrap -----------------------------------------------------

AWS_DIAGRAM_RE = re.compile(
    r'            <figure>\n'
    r'              <img src="(?P<src>/static/projects/aws-cost-optimization/images/diagram\.[a-z]+)" '
    r'alt="(?P<alt>[^"]+)" loading="lazy">\n'
    r'              <figcaption class="text-center text-sm text-stone-400">(?P<cap>[^<]+)</figcaption>\n'
    r'            </figure>\n'
)

AWS_LABELS = {
    "de": "Diagramm in voller Größe ansehen",
    "en": "View diagram at full size",
    "ru": "Открыть диаграмму в полном размере",
}


def wrap_aws_diagram(text: str, lang: str):
    label = AWS_LABELS[lang]

    def repl(m: re.Match) -> str:
        src = m.group("src")
        alt = m.group("alt")
        cap = m.group("cap")
        return (
            f'            <figure class="not-prose mt-10 mb-10">\n'
            f'              <div class="overflow-hidden rounded-2xl border border-stone-800 transition-colors hover:border-orange-500/60">\n'
            f'                <a href="{src}" data-lightbox\n'
            f'                   aria-label="{label}" title="{label}"\n'
            f'                   class="group block cursor-zoom-in">\n'
            f'                  <img src="{src}" alt="{alt}" '
            f'class="block w-full transition group-hover:opacity-90" loading="lazy">\n'
            f'                </a>\n'
            f'              </div>\n'
            f'              <figcaption class="mt-3 text-center text-sm text-stone-400">{cap}</figcaption>\n'
            f'            </figure>\n'
        )
    return AWS_DIAGRAM_RE.subn(repl, text, count=1)


# --- 2) RU infographic insert ------------------------------------------------

RU_INSERT_ANCHOR = re.compile(r'(            <h2 id="rezultat">)')

RU_INFOGRAPHIC_TPL = (
    '            <figure class="not-prose mt-10 mb-10 overflow-hidden rounded-2xl '
    'border border-stone-800 transition-colors hover:border-orange-500/60">\n'
    '              <a href="/static/projects/{slug}/images/infographic.png" data-lightbox\n'
    '                 aria-label="Открыть инфографику в полном размере" '
    'title="Открыть инфографику в полном размере"\n'
    '                 class="group block cursor-zoom-in">\n'
    '                <img src="/static/projects/{slug}/images/infographic.png" alt="{alt}" '
    'class="block w-full transition group-hover:opacity-90" loading="lazy">\n'
    '              </a>\n'
    '            </figure>\n\n'
)

RU_ALTS = {
    "legacy-data-extraction":       "Реверс-инжиниринг и миграция legacy-БД — инфографика",
    "book-lister-ai":               "Book Lister AI — инфографика до/после",
    "browser-automation-framework": "Multi-Process Browser-Automation Framework — карта кодовой базы",
    "microsoft-shopping-feed":      "Microsoft Shopping Feed Pipeline — инфографика",
}


def insert_ru_infographic(text: str, slug: str):
    if f'/static/projects/{slug}/images/infographic.png' in text:
        return text, 0
    block = RU_INFOGRAPHIC_TPL.format(slug=slug, alt=RU_ALTS[slug])
    return RU_INSERT_ANCHOR.subn(block + r'\1', text, count=1)


# --- main --------------------------------------------------------------------

LANGS = [("de", "de/projekte"), ("en", "en/projects"), ("ru", "ru/proekty")]


def main() -> int:
    rc = 0

    print("[1] AWS diagram wrap")
    for lang, base in LANGS:
        path = ROOT / base / "aws-cost-optimization" / "index.html"
        text = path.read_text(encoding="utf-8")
        if 'diagram.svg" data-lightbox' in text or 'diagram.png" data-lightbox' in text:
            print(f"  [SKIP] {lang}/aws: already wrapped")
            continue
        new_text, n = wrap_aws_diagram(text, lang)
        if n == 0:
            print(f"  [FAIL] {lang}/aws: AWS diagram pattern not found")
            rc = 1
            continue
        path.write_text(new_text, encoding="utf-8")
        print(f"  [ok]   {lang}/aws: diagram wrapped")

    print("\n[2] RU infographic insert")
    for slug in ("legacy-data-extraction", "book-lister-ai",
                 "browser-automation-framework", "microsoft-shopping-feed"):
        path = ROOT / "ru" / "proekty" / slug / "index.html"
        text = path.read_text(encoding="utf-8")
        new_text, n = insert_ru_infographic(text, slug)
        if n == 0:
            if f'/static/projects/{slug}/images/infographic.png' in text:
                print(f"  [SKIP] ru/{slug}: already inserted")
            else:
                print(f"  [FAIL] ru/{slug}: anchor <h2 id=\"rezultat\"> not found")
                rc = 1
            continue
        path.write_text(new_text, encoding="utf-8")
        print(f"  [ok]   ru/{slug}: infographic inserted")

    return rc


if __name__ == "__main__":
    raise SystemExit(main())
