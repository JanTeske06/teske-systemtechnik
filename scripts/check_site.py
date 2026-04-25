"""Site integrity checks — runs in CI on every push.

Checks:
  1. All HTML files parse as well-formed HTML
  2. All <script type="application/ld+json"> blocks contain valid JSON
  3. projects.json is valid JSON
  4. Every internal href in HTML resolves to an existing file (or a known
     special URL like '#' or 'mailto:')
  5. Every URL in sitemap.xml has a corresponding local file
  6. Required root files exist (robots.txt, sitemap.xml, llms.txt, CNAME,
     404.html, maintenance.html, index.html)

Usage: python scripts/check_site.py
Exit code: 0 on success, 1 on any failure.
"""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://teske-systemtechnik.de"

SKIP_DIRS = {
    ".git", "node_modules", ".venv", ".venv1", ".idea", ".claude",
    "build", "ORIGINAL_TEMPLATES", ".vscode", "public", "teske-maint-wt",
    "scripts",
}

REQUIRED_ROOT_FILES = [
    "robots.txt", "sitemap.xml", "llms.txt", "CNAME",
    "404.html", "maintenance.html", "index.html",
]

errors: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)
    print(f"  FAIL: {msg}")


def find_html_files() -> list[Path]:
    out = []
    for p in ROOT.rglob("*.html"):
        rel = p.relative_to(ROOT)
        if any(part in SKIP_DIRS for part in rel.parts):
            continue
        out.append(p)
    return out


# -------- Check 1: HTML well-formedness --------

class StrictHTMLParser(HTMLParser):
    """Raises on any parse error the stdlib surfaces."""
    def error(self, message):  # pragma: no cover — stdlib hook
        raise RuntimeError(message)


def check_html_parse(html_files: list[Path]) -> None:
    print("\n[1/6] HTML parse check")
    for f in html_files:
        try:
            StrictHTMLParser(convert_charrefs=True).feed(f.read_text(encoding="utf-8"))
        except Exception as e:
            fail(f"HTML parse error in {f.relative_to(ROOT)}: {e}")


# -------- Check 2: JSON-LD block validity --------

JSONLD_RE = re.compile(
    r'<script type="application/ld\+json">(.*?)</script>',
    re.DOTALL,
)


def check_jsonld(html_files: list[Path]) -> None:
    print("\n[2/6] JSON-LD validity")
    for f in html_files:
        content = f.read_text(encoding="utf-8")
        for i, m in enumerate(JSONLD_RE.finditer(content)):
            try:
                json.loads(m.group(1))
            except json.JSONDecodeError as e:
                fail(f"Invalid JSON-LD in {f.relative_to(ROOT)} [block {i}]: {e}")


# -------- Check 3: projects.json validity --------

def check_projects_json() -> None:
    print("\n[3/6] projects.json validity")
    p = ROOT / "static/data/projects.json"
    if not p.exists():
        fail("static/data/projects.json missing")
        return
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        fail(f"projects.json invalid JSON: {e}")
        return
    if "projects" not in data:
        fail("projects.json missing 'projects' key")
        return
    # Load i18n config so we know which languages a project must cover.
    required_langs = ["de", "en"]
    i18n_path = ROOT / "static/data/i18n.json"
    if i18n_path.exists():
        try:
            i18n = json.loads(i18n_path.read_text(encoding="utf-8"))
            required_langs = [lg["code"] for lg in i18n.get("languages", [])] or required_langs
        except json.JSONDecodeError as e:
            fail(f"i18n.json invalid JSON: {e}")

    for i, proj in enumerate(data["projects"]):
        for req in ("slug", "i18n", "tech", "date", "cover"):
            if req not in proj:
                fail(f"projects[{i}] missing key '{req}'")
        i18n_block = proj.get("i18n", {})
        for code in required_langs:
            if code not in i18n_block:
                fail(f"projects[{i}] ({proj.get('slug', '?')}) missing i18n.{code}")
            else:
                for field in ("title", "summary"):
                    if field not in i18n_block[code]:
                        fail(f"projects[{i}] ({proj.get('slug', '?')}) missing i18n.{code}.{field}")


# -------- Check 4: Internal link resolution --------

HREF_RE = re.compile(r'href="([^"]+)"')
SKIP_PREFIX = ("#", "mailto:", "tel:", "http://", "https://", "javascript:")


def resolve_href(href: str) -> Path | None:
    """Convert an absolute-path href to a local file path, or None if external."""
    if href.startswith(SKIP_PREFIX):
        return None
    # Strip query/fragment
    href = href.split("#")[0].split("?")[0]
    if not href or not href.startswith("/"):
        return None
    rel = href.lstrip("/")
    if rel.endswith("/") or rel == "":
        return ROOT / rel / "index.html"
    return ROOT / rel


def check_internal_links(html_files: list[Path]) -> None:
    print("\n[4/6] Internal link resolution")
    for f in html_files:
        content = f.read_text(encoding="utf-8")
        for href in HREF_RE.findall(content):
            target = resolve_href(href)
            if target is None:
                continue
            if not target.exists():
                fail(f"Dead internal link in {f.relative_to(ROOT)}: href=\"{href}\" -> {target.relative_to(ROOT)} does not exist")


# -------- Check 5: Sitemap URLs resolve --------

def check_sitemap() -> None:
    print("\n[5/6] Sitemap URL resolution")
    p = ROOT / "sitemap.xml"
    if not p.exists():
        fail("sitemap.xml missing")
        return
    try:
        tree = ET.parse(p)
    except ET.ParseError as e:
        fail(f"sitemap.xml invalid XML: {e}")
        return
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    for url_el in tree.getroot().findall("sm:url/sm:loc", ns):
        loc = (url_el.text or "").strip()
        if not loc.startswith(SITE_URL):
            fail(f"Sitemap URL doesn't match site base: {loc}")
            continue
        path_part = loc[len(SITE_URL):]
        target = resolve_href(path_part)
        if target is None or not target.exists():
            fail(f"Sitemap URL has no file behind it: {loc}")


# -------- Check 6: Required root files --------

def check_required_files() -> None:
    print("\n[6/6] Required root files")
    for name in REQUIRED_ROOT_FILES:
        if not (ROOT / name).exists():
            fail(f"Required file missing: {name}")


# -------- Main --------

def main() -> int:
    html_files = find_html_files()
    print(f"Found {len(html_files)} HTML files to check")

    check_html_parse(html_files)
    check_jsonld(html_files)
    check_projects_json()
    check_internal_links(html_files)
    check_sitemap()
    check_required_files()

    print("\n" + ("-" * 60))
    if errors:
        print(f"FAILED: {len(errors)} error(s)")
        return 1
    print("PASSED: all checks green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
