import re

with open('backend/pos_backend/settings.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "'django_filters.rest_framework.DjangoFilterBackend',",
    "'django_filters.rest_framework.DjangoFilterBackend',\n        'rest_framework.filters.SearchFilter',"
)

with open('backend/pos_backend/settings.py', 'w', encoding='utf-8') as f:
    f.write(content)
