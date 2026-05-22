"""Submit every URL from sitemap.xml to Bing IndexNow.

api.indexnow.org forwards the request to all participating engines
(Bing, Yandex, Seznam, Naver), so a single POST covers them all.

Usage:
    python scripts/submit_indexnow.py --key <YOUR_KEY>
    INDEXNOW_KEY=<key> python scripts/submit_indexnow.py
    python scripts/submit_indexnow.py --key <key> --dry-run

Prerequisites:
    1. Generate an 8–128 char key (a-z, A-Z, 0-9, -) at bing.com/indexnow
    2. Place a file <key>.txt at the web root containing exactly that key,
       e.g. https://teske-systemtechnik.de/<key>.txt
    3. Deploy that file (commit + push) before running the script,
       otherwise IndexNow returns 403.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parents[1]
SITEMAP = ROOT / "sitemap.xml"
HOST = "teske-systemtechnik.de"
ENDPOINT = "https://api.indexnow.org/indexnow"
SITEMAP_NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
KEY_PATTERN = re.compile(r"^[a-zA-Z0-9-]{8,128}$")


def load_urls(sitemap_path: Path) -> list[str]:
    tree = ET.parse(sitemap_path)
    urls = [
        loc.text.strip()
        for loc in tree.iter(f"{SITEMAP_NS}loc")
        if loc.text and loc.text.strip()
    ]
    # Root URL is intentionally absent from sitemap.xml (DE is the canonical
    # entry point), but it mirrors de/ and should be indexed too.
    root = f"https://{HOST}/"
    if root not in urls:
        urls.insert(0, root)
    return urls


def submit(urls: list[str], key: str) -> int:
    payload = {
        "host": HOST,
        "key": key,
        "keyLocation": f"https://{HOST}/{key}.txt",
        "urlList": urls,
    }
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        ENDPOINT,
        data=body,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            text = resp.read().decode("utf-8", errors="ignore")
            print(f"IndexNow response: HTTP {resp.status}")
            if text:
                print(text)
            return 0
    except HTTPError as e:
        text = e.read().decode("utf-8", errors="ignore")
        print(f"HTTP {e.code}: {e.reason}", file=sys.stderr)
        if text:
            print(text, file=sys.stderr)
        # Hint for the most common failure mode.
        if e.code == 403:
            print(
                f"\nHint: 403 usually means {HOST}/{key}.txt is not reachable "
                "or its contents do not exactly match the key. "
                "Check https://{0}/{1}.txt in a browser.".format(HOST, key),
                file=sys.stderr,
            )
        return 1
    except URLError as e:
        print(f"Network error: {e.reason}", file=sys.stderr)
        return 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--key",
        default=os.environ.get("INDEXNOW_KEY"),
        help="IndexNow API key (or set INDEXNOW_KEY env var).",
    )
    parser.add_argument(
        "--sitemap",
        type=Path,
        default=SITEMAP,
        help="Path to sitemap.xml (default: %(default)s).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print URLs that would be submitted, then exit without calling the API.",
    )
    args = parser.parse_args()

    if not args.key and not args.dry_run:
        parser.error("--key or INDEXNOW_KEY env var required (unless --dry-run)")
    if args.key and not KEY_PATTERN.match(args.key):
        parser.error(
            "Key must be 8–128 characters and only contain a-z, A-Z, 0-9, '-'"
        )

    urls = load_urls(args.sitemap)
    print(f"Loaded {len(urls)} URLs from {args.sitemap.name}")
    for url in urls:
        print(f"  {url}")

    if args.dry_run:
        print("\n--dry-run: not submitting.")
        return 0

    print(f"\nSubmitting to {ENDPOINT} with key {args.key[:4]}...{args.key[-4:]}")
    return submit(urls, args.key)


if __name__ == "__main__":
    sys.exit(main())
