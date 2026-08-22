import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pos_backend.settings')
django.setup()

from store.models import Shop, StoreUser

def setup_shop_2():
    shop, created = Shop.objects.get_or_create(
        name="Shop 2",
        defaults={'address': "Second Branch Location"}
    )
    print(f"Shop 2 created/retrieved: {shop.id}")

    # Create an admin user for Shop 2
    # Check if we already have one
    if not StoreUser.objects.filter(shop=shop, pin="2222").exists():
        StoreUser.objects.create(
            name="Shop 2 Admin",
            pin="2222",
            role="admin",
            shop=shop
        )
        print("Created 'Shop 2 Admin' with PIN: 2222")
    else:
        print("Shop 2 Admin already exists (PIN: 2222)")

if __name__ == '__main__':
    setup_shop_2()
