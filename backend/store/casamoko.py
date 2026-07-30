import os
import urllib.request
import urllib.error
import json
import ssl
from pathlib import Path

# Fallback .env parser in case python-dotenv is not installed
env_path = Path(__file__).resolve().parent.parent / '.env'
if env_path.exists():
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

CASAMOKO_API_KEY = os.getenv("CASAMOKO_API_KEY")
CASAMOKO_API_URL = os.getenv("CASAMOKO_API_URL", "https://casamoko.co.ke/api/v1/sms/send")
DEFAULT_SENDER = os.getenv("CASAMOKO_DEFAULT_SENDER", "CASAMOKO")

def send_sms(phone: str, message: str, sender_id: str = None) -> dict:
    """
    Dispatches SMS via Casamoko REST API using urllib and manual env parsing
    """
    if sender_id is None:
        sender_id = DEFAULT_SENDER
        
    if not CASAMOKO_API_KEY or CASAMOKO_API_KEY == 'YOUR_API_KEY_HERE':
        return {
            "status": "ERROR", 
            "message": "API Key is missing. Please set CASAMOKO_API_KEY in .env"
        }
        
    payload = {
        "phone": phone,
        "message": message,
        "sender_id": sender_id
    }
    
    headers = {
        "Authorization": f"Bearer {CASAMOKO_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    req = urllib.request.Request(
        CASAMOKO_API_URL, 
        data=json.dumps(payload).encode('utf-8'), 
        headers=headers, 
        method='POST'
    )
    
    context = ssl._create_unverified_context()
    
    try:
        with urllib.request.urlopen(req, context=context) as response:
            res_body = response.read().decode('utf-8')
            return json.loads(res_body)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            return json.loads(error_body)
        except json.JSONDecodeError:
            return {"status": "ERROR", "message": f"HTTP Error {e.code}: {e.reason}"}
    except Exception as e:
        return {"status": "ERROR", "message": str(e)}

