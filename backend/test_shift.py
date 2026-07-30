import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pos_backend.settings')
django.setup()

from store.models import Shift
s = Shift.objects.last()
print("Shift", s.id, "Open:", s.is_open, "Open Time:", s.open_time)
