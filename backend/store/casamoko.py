import os
import requests
from dotenv import load_dotenv

load_dotenv()

CASAMOKO_API_KEY = os.getenv("CASAMOKO_API_KEY")
CASAMOKO_API_URL = os.getenv("CASAMOKO_API_URL", "https://casamoko.co.ke/api/v1/sms/send")
DEFAULT_SENDER = os.getenv("CASAMOKO_DEFAULT_SENDER", "CASAMOKO")

def send_sms(phone: str, message: str, sender_id: str = None) -> dict:
    """
    Dispatches SMS via Casamoko REST API
    """
    if sender_id is None:
        sender_id = DEFAULT_SENDER
        
    headers = {
        "Authorization": f"Bearer {CASAMOKO_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    payload = {
        "to": [phone],
        "message": message,
        "sender_id": sender_id
    }
    
    try:
        response = requests.post(CASAMOKO_API_URL, json=payload, headers=headers, timeout=10)
        
        # Check if the response is JSON
        try:
            response_data = response.json()
        except requests.exceptions.JSONDecodeError:
            response_data = {"message": response.text}
            
        if response.status_code == 200:
            return {"status": "SUCCESS", "data": response_data}
        else:
            return {"status": "ERROR", "code": response.status_code, "message": response_data.get("message", "Unknown error")}
            
    except requests.exceptions.RequestException as e:
        return {"status": "ERROR", "message": str(e)}
