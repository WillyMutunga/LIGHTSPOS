import sys

with open('backend/store/views.py', 'r') as f:
    content = f.read()

content = content.replace("\\'", "'")

with open('backend/store/views.py', 'w') as f:
    f.write(content)
