import sys

with open('backend/store/serializers.py', 'r') as f:
    content = f.read()

content = content.replace('StoreUser, Category, Product', 'Shop, StoreUser, Category, Product')

shop_serializer = '''
class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = '__all__'

'''
content = content.replace('class StoreUserSerializer(serializers.ModelSerializer):', shop_serializer + 'class StoreUserSerializer(serializers.ModelSerializer):')

content = content.replace("fields = ['id', 'name', 'pin', 'role', 'is_active']", "fields = ['id', 'name', 'pin', 'role', 'is_active', 'shop', 'shop_name']")
content = content.replace('class StoreUserSerializer(serializers.ModelSerializer):', "class StoreUserSerializer(serializers.ModelSerializer):\n    shop_name = serializers.ReadOnlyField(source='shop.name')")

with open('backend/store/serializers.py', 'w') as f:
    f.write(content)
