from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0007_shop_settings'),
    ]

    operations = [
        migrations.AlterField(
            model_name='returnrefund',
            name='sale',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='returns', to='store.sale'),
        ),
    ]
