from rest_framework import serializers
from .models import (
    StoreUser, Category, Product, Customer, Supplier,
    Shift, Sale, SaleItem, PurchaseOrder, PurchaseOrderItem,
    ReturnRefund, AuditLog, CustomerDebtLedger
)

class StoreUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreUser
        fields = ['id', 'name', 'pin', 'role', 'is_active']
        extra_kwargs = {'pin': {'write_only': True}}


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Product
        fields = [
            'id', 'barcode', 'name', 'description', 'category', 'category_name',
            'cost_price', 'retail_price', 'wholesale_price', 'stock_quantity', 'serial_tracked',
            'serial_numbers'
        ]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'email', 'loyalty_points', 'outstanding_debt']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_name', 'phone', 'email', 'address', 'outstanding_balance']


class ShiftSerializer(serializers.ModelSerializer):
    cashier_name = serializers.ReadOnlyField(source='cashier.name')

    class Meta:
        model = Shift
        fields = [
            'id', 'cashier', 'cashier_name', 'open_time', 'close_time',
            'starting_cash', 'ending_cash', 'actual_cash', 'variance', 'is_open'
        ]


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    barcode = serializers.ReadOnlyField(source='product.barcode')

    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'product_name', 'barcode', 'quantity', 'unit_price', 'total_price', 'serial_numbers']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    customer_name = serializers.ReadOnlyField(source='customer.name')
    cashier_name = serializers.ReadOnlyField(source='cashier.name')

    class Meta:
        model = Sale
        fields = [
            'id', 'shift', 'customer', 'customer_name', 'cashier', 'cashier_name',
            'timestamp', 'subtotal', 'discount', 'tax_amount', 'total',
            'payment_method', 'payment_reference', 'amount_tendered', 'change_due',
            'mixed_cash_amount', 'mixed_mpesa_amount',
            'etims_invoice_number', 'etims_signature', 'etims_qr_code_data', 'items'
        ]


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_cost']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    supplier_name = serializers.ReadOnlyField(source='supplier.name')

    class Meta:
        model = PurchaseOrder
        fields = ['id', 'supplier', 'supplier_name', 'date_ordered', 'date_received', 'status', 'total_amount', 'items']


class ReturnRefundSerializer(serializers.ModelSerializer):
    sale_total = serializers.ReadOnlyField(source='sale.total')
    cashier_name = serializers.ReadOnlyField(source='cashier.name')

    class Meta:
        model = ReturnRefund
        fields = ['id', 'sale', 'sale_total', 'cashier', 'cashier_name', 'reason', 'refund_amount', 'timestamp', 'returned_items']


class AuditLogSerializer(serializers.ModelSerializer):
    cashier_name = serializers.ReadOnlyField(source='cashier.name')

    class Meta:
        model = AuditLog
        fields = ['id', 'action', 'cashier', 'cashier_name', 'timestamp', 'details']


class CustomerDebtLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerDebtLedger
        fields = ['id', 'customer', 'sale', 'amount', 'transaction_type', 'timestamp', 'notes']
