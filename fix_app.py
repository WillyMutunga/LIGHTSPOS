import sys

with open('frontend/src/App.jsx', 'r') as f:
    content = f.read()

content = content.replace("import { api } from './api';", "import { api, setShopId } from './api';")

orig_effect = """  // Check active shift on load/login
  useEffect(() => {
    if (currentUser) {
      api.getShifts().then(shifts => {"""
new_effect = """  // Check active shift on load/login
  useEffect(() => {
    if (currentUser) {
      if (currentUser.shop) {
        setShopId(currentUser.shop);
      }
      api.getShifts().then(shifts => {"""
content = content.replace(orig_effect, new_effect)

orig_login = """    try {
      const response = await api.loginPin(pin);
      setCurrentUser(response.user);"""
new_login = """    try {
      const response = await api.loginPin(pin);
      if (response.user.shop) {
        setShopId(response.user.shop);
      }
      setCurrentUser(response.user);"""
content = content.replace(orig_login, new_login)

with open('frontend/src/App.jsx', 'w') as f:
    f.write(content)
