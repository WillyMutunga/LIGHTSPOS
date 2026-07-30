import re

with open('backend/store/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

migration_view = '''
from django.core.management import call_command
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def run_secret_migrations(request):
    try:
        call_command('makemigrations')
        call_command('migrate')
        return JsonResponse({'status': 'success', 'message': 'Database migrations completed successfully on the live server.'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})
'''

# Insert it at the end of the file
with open('backend/store/views.py', 'w', encoding='utf-8') as f:
    f.write(content + "\n" + migration_view)
