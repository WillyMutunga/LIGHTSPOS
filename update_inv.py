import re

with open('frontend/src/components/InventoryModule.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add wholesale_price field to formData
old_form_state = '''  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    description: '',
    category: '',
    cost_price: '',
    retail_price: '',
    stock_quantity: '',
    serial_tracked: false,
    serial_numbers: ''
  });'''
new_form_state = '''  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    description: '',
    category: '',
    cost_price: '',
    retail_price: '',
    wholesale_price: '',
    stock_quantity: '',
    serial_tracked: false,
    serial_numbers: ''
  });'''
content = content.replace(old_form_state, new_form_state)

# Add wholesale_price to UI Form
old_form_ui = '''              <div>
                <label className="cyber-label">Retail Price (KES) *</label>
                <input 
                  type="number"
                  className="cyber-input"
                  name="retail_price"
                  value={formData.retail_price}
                  onChange={handleInputChange}
                  required
                />
              </div>'''
new_form_ui = '''              <div>
                <label className="cyber-label">Retail Price (KES) *</label>
                <input 
                  type="number"
                  className="cyber-input"
                  name="retail_price"
                  value={formData.retail_price}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="cyber-label">Wholesale Price (KES)</label>
                <input 
                  type="number"
                  className="cyber-input"
                  name="wholesale_price"
                  value={formData.wholesale_price}
                  onChange={handleInputChange}
                />
              </div>'''
content = content.replace(old_form_ui, new_form_ui)

with open('frontend/src/components/InventoryModule.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated InventoryModule.jsx!")
