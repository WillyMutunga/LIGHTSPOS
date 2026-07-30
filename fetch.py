import urllib.request
import re
try:
    req = urllib.request.Request('https://pos.casamoko.co.ke/')
    html = urllib.request.urlopen(req).read().decode('utf-8')
    match = re.search(r'assets/index-[A-Za-z0-9_-]+\.js', html)
    if match:
        print("FOUND_JS:", match.group(0))
        # Fetch the JS file
        js_url = 'https://pos.casamoko.co.ke/' + match.group(0)
        js_content = urllib.request.urlopen(js_url).read().decode('utf-8')
        if 'My Daily Z-Report' in js_content or 'cashier_daily' in js_content:
            print("Z-REPORT FOUND IN LIVE JS!")
        else:
            print("Z-REPORT MISSING IN LIVE JS!")
    else:
        print("JS BUNDLE NOT FOUND IN HTML")
except Exception as e:
    print("ERROR:", e)
