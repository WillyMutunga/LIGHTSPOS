import os
import requests
from pathlib import Path

def get_whatsapp_env():
    env_vars = {}
    env_path = Path(__file__).resolve().parent.parent / '.env'
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env_vars[k.strip()] = v.strip().strip('"' + '')
    
    access_token = env_vars.get('WHATSAPP_ACCESS_TOKEN') or os.getenv('WHATSAPP_ACCESS_TOKEN')
    phone_id = env_vars.get('WHATSAPP_PHONE_ID') or os.getenv('WHATSAPP_PHONE_ID')
    return access_token, phone_id

def send_whatsapp_message(phone: str, message: str) -> dict:
    access_token, phone_id = get_whatsapp_env()
    
    if not access_token or not phone_id:
        return {'status': 'ERROR', 'message': 'WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_ID missing in .env'}
    
    if phone.startswith('+'):
        phone = phone[1:]
    elif phone.startswith('0'):
        phone = '254' + phone[1:]
    
    url = f'https://graph.facebook.com/v19.0/{phone_id}/messages'
    headers = {'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'}
    payload = {'messaging_product': 'whatsapp', 'recipient_type': 'individual', 'to': phone, 'type': 'text', 'text': {'preview_url': False, 'body': message}}
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        res_data = response.json()
        if response.status_code in [200, 201]:
            return {'status': 'SUCCESS', 'data': res_data}
        else:
            return {'status': 'ERROR', 'message': res_data.get('error', {}).get('message', 'Unknown Meta Error')}
    except Exception as e:
        return {'status': 'ERROR', 'message': str(e)}
