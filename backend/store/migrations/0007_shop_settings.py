from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0006_shop_alter_category_name_alter_customer_phone_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='shop',
            name='phone',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='shop',
            name='receipt_footer',
            field=models.TextField(blank=True, default='Thank you for shopping with us!'),
        ),
        migrations.AddField(
            model_name='shop',
            name='tax_rate',
            field=models.DecimalField(decimal_places=2, default=16.0, max_digits=5),
        ),
        migrations.AddField(
            model_name='shop',
            name='vat_pin',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
