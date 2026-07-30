import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pos_backend.settings')
django.setup()

from store.models import Sale, Shift, StoreUser
from decimal import Decimal

# Print the last shift and user
shift = Shift.objects.last()
cashier = StoreUser.objects.last()
print("Shift:", shift.id, "User:", cashier.id)

try:
    sale = Sale.objects.create(
        shift=shift,
        cashier=cashier,
        subtotal=Decimal('100.00'),
        total=Decimal('100.00'),
        payment_method='Cash',
        amount_tendered=Decimal('100.00'),
        mixed_cash_amount=Decimal('0.00'),
        mixed_mpesa_amount=Decimal('0.00')
    )
    print("Created sale ID:", sale.id)
except Exception as e:
    print("Error creating sale:", str(e))
