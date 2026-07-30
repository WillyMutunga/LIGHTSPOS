import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pos_backend.settings')
django.setup()

from store.models import Sale
print("Total sales:", Sale.objects.count())
for s in Sale.objects.all().order_by('-id')[:2]:
    print(s.id, s.timestamp, s.cashier.id if s.cashier else 'None', s.total)
