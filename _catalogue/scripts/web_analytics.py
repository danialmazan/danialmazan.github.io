"""Install the shared beacon idempotently and verify production HTML."""
from html.parser import HTMLParser
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SNIPPET = (ROOT / "assets/cloudflare-web-analytics.html").read_text().strip()
URL = "https://static.cloudflareinsights.com/beacon.min.js"
TOKEN = "7e557ad432574707b8ba15bdd75c688e"


class Beacons(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script" and ("cloudflareinsights.com" in attrs.get("src", "")
                                or "data-cf-beacon" in attrs):
            self.scripts.append(attrs)


def verify(content, name):
    parser = Beacons()
    parser.feed(content)
    if len(parser.scripts) != 1:
        raise ValueError(f"{name}: expected one Cloudflare beacon, got {len(parser.scripts)}")
    script = parser.scripts[0]
    if (script.get("src") != URL or script.get("type") != "module"
            or json.loads(script.get("data-cf-beacon", "{}")) != {"token": TOKEN}):
        raise ValueError(f"{name}: unexpected Cloudflare beacon configuration")
    if not re.search(r"</script>\s*<!-- End Cloudflare Web Analytics -->\s*</body>", content, re.I):
        raise ValueError(f"{name}: beacon must immediately precede </body>")


def install(path):
    content = path.read_bytes().decode("utf-8")
    parser = Beacons()
    parser.feed(content)
    if parser.scripts:
        verify(content, path)
        return False
    # Some hand-authored documents legally omit the closing body tag.
    if not re.search(r"</body\s*>", content, re.I) and content.lower().count("</html>") == 1:
        content = re.sub(r"</html>", "</body></html>", content, flags=re.I)
    elif not re.search(r"</body\s*>", content, re.I) and "<!doctype html>" in content.lower():
        content = content.rstrip() + "\n</body>\n"
    if len(re.findall(r"</body\s*>", content, re.I)) != 1:
        raise ValueError(f"{path}: expected one closing body tag")
    content = re.sub(r"</body\s*>", lambda _: SNIPPET + "\n</body>", content, flags=re.I)
    verify(content, path)
    path.write_bytes(content.encode("utf-8"))
    return True


if __name__ == "__main__":
    import sys
    for filename in sys.argv[1:]:
        path = Path(filename)
        verify(path.read_text(), path)
        print(f"Verified one Cloudflare beacon: {path}")
