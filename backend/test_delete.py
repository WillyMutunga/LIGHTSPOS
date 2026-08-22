import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from store.models import *

try:
    # 1. Setup base data
    user = StoreUser.objects.create(name='Test Cashier', pin='0000', role='cashier')
    shift = Shift.objects.create(cashier=user, starting_cash=1000)
    product = Product.objects.create(
        name='Test Item', 
        category=Category.objects.create(name='Test Cat', code='TC'),
        sku='123',
        buying_price=10,
        selling_price=20,
        current_stock=100,
        minimum_stock=10
    )
    
    # 2. Create sale
    sale = Sale.objects.create(
        shift=shift,
        cashier=user,
        subtotal=20,
        tax_amount=0,
        discount=0,
        total=20,
        payment_method='Cash'
    )
    
    # 3. Create sale item
    SaleItem.objects.create(
        sale=sale,
        product=product,
        quantity=1,
        unit_price=20,
        total_price=20
    )
    
    print(f"Created Sale #{sale.id}")
    
    # 4. Attempt to delete
    print("Attempting to delete sale...")
    sale.delete()
    print("Sale deleted successfully.")

except Exception as e:
    import traceback
    traceback.print_exc()

