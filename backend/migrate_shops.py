import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pos_backend.settings')
django.setup()

from store.models import (
    Shop, StoreUser, Category, Product, Customer, Supplier,
    Shift, Sale, PurchaseOrder, ReturnRefund, CustomerDebtLedger, 
    Expense, StockAdjustment
)

def migrate_data():
    # 1. Create default shop
    shop, created = Shop.objects.get_or_create(
        name="Main Shop",
        defaults={'address': "Default HQ Location"}
    )
    print(f"Main Shop created/retrieved: {shop.name}")

    # 2. Update models
    models_to_update = [
        StoreUser, Category, Product, Customer, Supplier,
        Shift, Sale, PurchaseOrder, ReturnRefund, CustomerDebtLedger, 
        Expense, StockAdjustment
    ]

    for model in models_to_update:
        count = model.objects.filter(shop__isnull=True).update(shop=shop)
        print(f"Updated {count} records in {model.__name__}")

if __name__ == '__main__':
    migrate_data()
