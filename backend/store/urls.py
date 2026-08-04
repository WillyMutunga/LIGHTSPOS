from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    handle_send_sms,
    StoreUserViewSet, CategoryViewSet, ProductViewSet,
    CustomerViewSet, SupplierViewSet, ShiftViewSet,
    SaleViewSet, PurchaseOrderViewSet, ReturnRefundViewSet,
    AuditLogViewSet, AnalyticsViewSet, run_secret_migrations,
    factory_reset_view
)

router = DefaultRouter()
router.register(r'users', StoreUserViewSet, basename='user')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'shifts', ShiftViewSet, basename='shift')
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'purchases', PurchaseOrderViewSet, basename='purchase')
router.register(r'returns', ReturnRefundViewSet, basename='return')
router.register(r'audit', AuditLogViewSet, basename='audit')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('run-secret-migrations-willy-123/', run_secret_migrations, name='secret_migrations'),
    path('send-sms/', handle_send_sms, name='send_sms'),
    path('factory-reset/', factory_reset_view, name='factory_reset'),
    path('', include(router.urls)),
]
