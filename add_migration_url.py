import re

with open('backend/store/urls.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the new view import
content = content.replace("AnalyticsViewSet", "AnalyticsViewSet, run_secret_migrations")

# Add the path to urlpatterns
urlpatterns_old = '''urlpatterns = [
    path('', include(router.urls)),
]'''

urlpatterns_new = '''urlpatterns = [
    path('run-secret-migrations-willy-123/', run_secret_migrations, name='secret_migrations'),
    path('', include(router.urls)),
]'''

content = content.replace(urlpatterns_old, urlpatterns_new)

with open('backend/store/urls.py', 'w', encoding='utf-8') as f:
    f.write(content)
