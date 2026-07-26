from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StoreUserViewSet, CategoryViewSet, ProductViewSet,
    CustomerViewSet, SupplierViewSet, ShiftViewSet,
    SaleViewSet, PurchaseOrderViewSet, ReturnRefundViewSet,
    AuditLogViewSet, AnalyticsViewSet, run_secret_migrations
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
router.register(r'analytics', AnalyticsViewSet, run_secret_migrations, basename='analytics')

urlpatterns = [
    path('run-secret-migrations-willy-123/', run_secret_migrations, name='secret_migrations'),
    path('', include(router.urls)),
]
