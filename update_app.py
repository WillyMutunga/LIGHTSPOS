import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace(
    "import SettingsModule from './components/SettingsModule';",
    "import SettingsModule from './components/SettingsModule';\nimport MessagingModule from './components/MessagingModule';"
)

# Add icon import
content = content.replace(
    "MessageSquare,",
    "" # just in case it's there
)
content = content.replace(
    "const {",
    "const {\n  MessageSquare,"
)

# Add nav item
nav_item = '''          {hasAccess('warranty') && <button className={
av-btn } onClick={() => setActiveView('warranty')}><Shield size={18} /> Warranty</button>}
          {hasAccess('messaging') && <button className={
av-btn } onClick={() => setActiveView('messaging')}><MessageSquare size={18} /> Messaging</button>}'''

content = content.replace(
    "{hasAccess('warranty') && <button className={
av-btn } onClick={() => setActiveView('warranty')}><Shield size={18} /> Warranty</button>}",
    nav_item
)

# Add View
view_comp = '''            {activeView === 'warranty' && (
              <WarrantyModule />
            )}
            {activeView === 'messaging' && (
              <MessagingModule onAddLog={handleAddLog} />
            )}'''
            
content = content.replace(
    '''            {activeView === 'warranty' && (
              <WarrantyModule />
            )}''',
    view_comp
)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
