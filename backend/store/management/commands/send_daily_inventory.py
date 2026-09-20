import os
from django.core.management.base import BaseCommand
from django.core.mail import EmailMessage
from django.conf import settings
from store.models import Shop, Product
from django.utils import timezone
import io

class Command(BaseCommand):
    help = 'Generates an inventory valuation PDF and sends it to the shop manager(s)'

    def handle(self, *args, **kwargs):
        shops = Shop.objects.filter(is_active=True).exclude(alert_email__isnull=True).exclude(alert_email__exact='')
        if not shops.exists():
            self.stdout.write(self.style.WARNING('No shops with alert_email found.'))
            return

        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import letter, landscape
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet
        except ImportError:
            self.stdout.write(self.style.ERROR('reportlab is not installed.'))
            return

        for shop in shops:
            self.stdout.write(f'Generating PDF for {shop.name}...')
            products = Product.objects.filter(shop=shop, is_active=True).order_by('name')
            
            # Create PDF in memory
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
            elements = []
            
            styles = getSampleStyleSheet()
            title = Paragraph(f'Inventory Valuation Report - {shop.name}', styles['Title'])
            elements.append(title)
            
            subtitle = Paragraph(f'Generated on {timezone.now().strftime("%Y-%m-%d %H:%M")}', styles['Normal'])
            elements.append(subtitle)
            elements.append(Spacer(1, 20))
            
            # Table data
            data = [['SKU', 'Product Name', 'Category', 'Stock Qty', 'Low Stock Threshold', 'Unit Cost', 'Total Value']]
            
            total_valuation = 0
            for p in products:
                val = float(p.cost_price or 0) * p.stock_quantity
                total_valuation += val
                data.append([
                    p.barcode or '-',
                    p.name,
                    p.category.name if p.category else '-',
                    str(p.stock_quantity),
                    str(shop.low_stock_threshold),
                    f'{float(p.cost_price or 0):.2f}',
                    f'{val:.2f}'
                ])
                
            data.append(['', '', '', '', '', 'TOTAL VALUATION:', f'{total_valuation:.2f}'])
            
            table = Table(data, repeatRows=1)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#00ffff')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.black),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0,0), (-1,0), 12),
                ('BACKGROUND', (0,-1), (-1,-1), colors.lightgrey),
                ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
                ('GRID', (0,0), (-1,-1), 1, colors.black)
            ]))
            
            elements.append(table)
            doc.build(elements)
            
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            # Send Email
            self.stdout.write(f'Sending email to {shop.alert_email}...')
            email = EmailMessage(
                subject=f'Daily Inventory Valuation Report - {shop.name}',
                body=f'Hello Manager,\n\nPlease find attached the daily inventory valuation report for {shop.name}.\n\nTotal Inventory Value: {total_valuation:,.2f}\n\nLights POS System',
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[shop.alert_email],
            )
            email.attach(f'Inventory_Report_{shop.name}_{timezone.now().strftime("%Y%m%d")}.pdf', pdf_bytes, 'application/pdf')
            
            try:
                email.send(fail_silently=False)
                self.stdout.write(self.style.SUCCESS(f'Successfully sent report to {shop.alert_email}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to send email: {str(e)}'))
