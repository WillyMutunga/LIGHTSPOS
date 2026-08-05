import os
import sys
import django
from django.core.management import call_command

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lightspos_backend.settings')
django.setup()

print("Running database migrations...")
call_command('migrate')
print("Migrations completed successfully!")
