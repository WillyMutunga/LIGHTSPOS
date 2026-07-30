import re

with open('store/urls.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the injected parameter in router.register
content = content.replace(
    "router.register(r'analytics', AnalyticsViewSet, run_secret_migrations, basename='analytics')",
    "router.register(r'analytics', AnalyticsViewSet, basename='analytics')"
)

with open('store/urls.py', 'w', encoding='utf-8') as f:
    f.write(content)
