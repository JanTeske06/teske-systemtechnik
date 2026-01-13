import os
from datetime import datetime

DOMAIN = "https://teske-systemtechnik.de"
EXCLUDE = [".git", ".idea", "css", "js", "assets", "CNAME", "generate_sitemap.py"]
OUTPUT_FILE = "sitemap.xml"


def generate_sitemap():
  print(f"Generiere Sitemap für {DOMAIN}...")

  xml_content = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ]

  for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if not d.startswith('.') and d not in EXCLUDE]

    for file in files:
      if file.endswith(".html"):
        path = os.path.join(root, file).replace("\\", "/")
        if path.startswith("./"):
          path = path[2:]

        if path == "index.html":
          url = DOMAIN + "/"
        else:
          url = f"{DOMAIN}/{path}"

        last_mod = datetime.fromtimestamp(os.path.getmtime(path)).strftime('%Y-%m-%d')

        entry = f"""  <url>
    <loc>{url}</loc>
    <lastmod>{last_mod}</lastmod>
    <priority>{'1.0' if path == 'index.html' else '0.8'}</priority>
  </url>"""
        xml_content.append(entry)

  xml_content.append('</urlset>')

  with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(xml_content))

  print(f"✅ {OUTPUT_FILE} erfolgreich erstellt.")


if __name__ == "__main__":
  generate_sitemap()
