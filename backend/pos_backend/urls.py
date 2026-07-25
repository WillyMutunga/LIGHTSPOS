from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.core.management import call_command

def run_migrations(request):
    try:
        call_command('migrate')
        return HttpResponse("Database migrations successfully applied!")
    except Exception as e:
        return HttpResponse(f"Migration failed: {str(e)}", status=500)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/run-secret-migrations-willy-123/', run_migrations),
    path('', include('store.urls')),
]
