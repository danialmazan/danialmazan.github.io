"""Install and verify the shared, browser-opt-out-aware analytics loader."""
from html.parser import HTMLParser
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SNIPPET = (ROOT / "assets/cloudflare-web-analytics.html").read_text().strip()
URL = "https://static.cloudflareinsights.com/beacon.min.js"
TOKEN = "7e557ad432574707b8ba15bdd75c688e"
BLOCK = re.compile(r"<!-- Cloudflare Web Analytics -->.*?<!-- End Cloudflare Web Analytics -->", re.S)
LOADER_BODY = re.search(r'<script id="cf-analytics-loader">(.*?)</script>', SNIPPET, re.S).group(1).strip()


class Beacons(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
        self.loaders = []
        self.in_loader = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script" and attrs.get("id") == "cf-analytics-loader":
            self.loaders.append("")
            self.in_loader = True
        if tag == "script" and ("cloudflareinsights.com" in attrs.get("src", "")
                                or "data-cf-beacon" in attrs):
            self.scripts.append(attrs)

    def handle_data(self, data):
        if self.in_loader:
            self.loaders[-1] += data

    def handle_endtag(self, tag):
        if tag == "script":
            self.in_loader = False


def verify(content, name):
    parser = Beacons()
    parser.feed(content)
    if parser.scripts:
        raise ValueError(f"{name}: unconditional Cloudflare beacon would bypass the opt-out")
    if len(parser.loaders) != 1 or parser.loaders[0].strip() != LOADER_BODY:
        raise ValueError(f"{name}: expected exactly one shared conditional analytics loader")
    if not re.search(r"</script>\s*<!-- End Cloudflare Web Analytics -->\s*</body>", content, re.I):
        raise ValueError(f"{name}: conditional loader must immediately precede </body>")


def install(path):
    content = path.read_bytes().decode("utf-8")
    parser = Beacons()
    parser.feed(content)
    if parser.loaders:
        verify(content, path)
        return False
    if parser.scripts:
        if len(parser.scripts) != 1:
            raise ValueError(f"{path}: conflicting or duplicate Cloudflare beacons")
        script = parser.scripts[0]
        if (script.get("src") != URL or script.get("type") != "module"
                or json.loads(script.get("data-cf-beacon", "{}")) != {"token": TOKEN}
                or len(BLOCK.findall(content)) != 1):
            raise ValueError(f"{path}: unexpected beacon; preserve and review its configuration")
        content = BLOCK.sub(lambda _: SNIPPET, content)
        verify(content, path)
        path.write_bytes(content.encode("utf-8"))
        return True
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
        print(f"Verified one conditional Cloudflare loader: {path}")
