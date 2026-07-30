import re

with open('store/urls.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the import
content = content.replace(
    "from .views import (",
    "from .views import (\n    handle_send_sms,"
)

# Add the path
content = content.replace(
    "path('run-secret-migrations-willy-123/', run_secret_migrations, name='secret_migrations'),",
    "path('run-secret-migrations-willy-123/', run_secret_migrations, name='secret_migrations'),\n    path('send-sms/', handle_send_sms, name='send_sms'),"
)

with open('store/urls.py', 'w', encoding='utf-8') as f:
    f.write(content)
