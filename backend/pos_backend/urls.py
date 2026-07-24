from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.core.management import call_command
import os
from django.conf import settings

def run_setup(request):
    try:
        # Run database migrations
        call_command('migrate')
        
        # Check if the backup file exists before trying to load it
        backup_path = os.path.join(settings.BASE_DIR, 'databackup.json')
        if os.path.exists(backup_path):
            call_command('loaddata', 'databackup.json')
            return HttpResponse("Success! Migrations ran and data was loaded perfectly.")
        else:
            return HttpResponse("Migrations ran, but databackup.json was not found to load data.")
    except Exception as e:
        return HttpResponse(f"An error occurred: {str(e)}")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('store.urls')),
    path('setup-database-now/', run_setup),
]
