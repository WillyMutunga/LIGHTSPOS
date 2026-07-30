import re

with open('frontend/src/api.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_api = '''  // Casamoko SMS Integration
  sendSms: async (payload) => {
    const response = await fetch(${API_BASE}/send-sms/, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to dispatch SMS');
    }
    return response.json();
  },
'''

content = content.replace(
  "  checkout: async (data) => {",
  new_api + "\n  checkout: async (data) => {"
)

with open('frontend/src/api.js', 'w', encoding='utf-8') as f:
    f.write(content)
