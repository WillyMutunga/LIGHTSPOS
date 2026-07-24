from django.db import models

class StoreUser(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Administrator'),
        ('manager', 'Manager'),
        ('cashier', 'Cashier'),
    )
    name = models.CharField(max_length=100)
    pin = models.CharField(max_length=10, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='cashier')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    barcode = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    retail_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.IntegerField(default=0)
    serial_tracked = models.BooleanField(default=False)
    serial_numbers = models.TextField(blank=True, help_text="Comma-separated list of active serial numbers in stock")

    def get_serials_list(self):
        if not self.serial_numbers:
            return []
        return [s.strip() for s in self.serial_numbers.split(',') if s.strip()]

    def set_serials_list(self, serials):
        self.serial_numbers = ','.join([s.strip() for s in serials if s.strip()])

    def __str__(self):
        return f"{self.name} ({self.barcode})"


class Customer(models.Model):
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=50, unique=True, db_index=True)
    email = models.CharField(max_length=100, blank=True)
    loyalty_points = models.IntegerField(default=0)
    outstanding_debt = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name


class CustomerDebtLedger(models.Model):
    TRANSACTION_TYPES = (
        ('charge', 'Debt Charge'),
        ('payment', 'Payment Received'),
    )
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='ledger_entries')
    sale = models.ForeignKey('Sale', null=True, blank=True, on_delete=models.SET_NULL, related_name='debt_ledger')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.customer.name} - {self.get_transaction_type_display()}: KES {self.amount}"


class Supplier(models.Model):
    name = models.CharField(max_length=150)
    contact_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name


class Shift(models.Model):
    cashier = models.ForeignKey(StoreUser, on_delete=models.PROTECT)
    open_time = models.DateTimeField(auto_now_add=True)
    close_time = models.DateTimeField(null=True, blank=True)
    starting_cash = models.DecimalField(max_digits=10, decimal_places=2)
    ending_cash = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    actual_cash = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    variance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_open = models.BooleanField(default=True)

    def __str__(self):
        status = "Open" if self.is_open else "Closed"
        return f"Shift #{self.id} - {self.cashier.name} ({status})"


class Sale(models.Model):
    shift = models.ForeignKey(Shift, on_delete=models.PROTECT, related_name='sales')
    customer = models.ForeignKey(Customer, null=True, blank=True, on_delete=models.SET_NULL, related_name='sales')
    cashier = models.ForeignKey(StoreUser, on_delete=models.PROTECT, related_name='sales')
    timestamp = models.DateTimeField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50) # M-Pesa, Cash, Card, Credit
    payment_reference = models.CharField(max_length=100, blank=True)
    amount_tendered = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    change_due = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    etims_invoice_number = models.CharField(max_length=100, blank=True)
    etims_signature = models.CharField(max_length=100, blank=True)
    etims_qr_code_data = models.TextField(blank=True)

    def __str__(self):
        return f"Sale #{self.id} - {self.total} ({self.payment_method})"


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    serial_numbers = models.TextField(blank=True, help_text="Comma-separated list of sold serial numbers")

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class PurchaseOrder(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Received', 'Received'),
    )
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='purchase_orders')
    date_ordered = models.DateTimeField(auto_now_add=True)
    date_received = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"PO #{self.id} - {self.supplier.name} ({self.status})"


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.IntegerField()
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class ReturnRefund(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.PROTECT, related_name='returns')
    cashier = models.ForeignKey(StoreUser, on_delete=models.PROTECT)
    reason = models.TextField()
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)
    returned_items = models.TextField(help_text="JSON mapping of product ID to quantity returned and serials")

    def __str__(self):
        return f"Return for Sale #{self.sale.id} ({self.refund_amount})"


class AuditLog(models.Model):
    action = models.CharField(max_length=100)
    cashier = models.ForeignKey(StoreUser, null=True, blank=True, on_delete=models.SET_NULL)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField()

    def __str__(self):
        return f"{self.action} @ {self.timestamp}"
