import os
import django
from django.core.management import call_command

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lightspos_backend.settings')
django.setup()

print("Running database migrations...")
call_command('migrate')
print("Migrations completed successfully!")
