import urllib.request
import json
try:
    req = urllib.request.Request('https://api.github.com/repos/WillyMutunga/LIGHTSPOS/actions/runs')
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    if 'workflow_runs' in data:
        for r in data['workflow_runs'][:5]:
            msg = r.get('head_commit', {}).get('message', 'No commit msg').replace('\n', ' ')
            print(f"Run {r['id']}: status={r['status']} conclusion={r['conclusion']} msg='{msg}'")
    else:
        print(data)
except Exception as e:
    print(e)
