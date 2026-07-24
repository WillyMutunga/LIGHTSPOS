const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  
  // Set JSON headers by default
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMsg = errData.error || errData.detail || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }
    // Return json or true if empty
    if (response.status === 204) return true;
    return await response.json();
  } catch (error) {
    console.error(`API Error on ${url}:`, error);
    throw error;
  }
}

export const api = {
  // Users/Auth
  loginPin: (pin) => request('/users/login_pin/', {
    method: 'POST',
    body: JSON.stringify({ pin })
  }),
  getUsers: () => request('/users/'),
  createUser: (user) => request('/users/', {
    method: 'POST',
    body: JSON.stringify(user)
  }),

  // Categories
  getCategories: () => request('/categories/'),

  // Products
  getProducts: (search = '', category = '') => {
    let query = [];
    if (search) query.push(`search=${encodeURIComponent(search)}`);
    if (category) query.push(`category=${encodeURIComponent(category)}`);
    const queryString = query.length ? `?${query.join('&')}` : '';
    return request(`/products/${queryString}`);
  },
  getProductByBarcode: (barcode) => request(`/products/barcode/?barcode=${encodeURIComponent(barcode)}`),
  createProduct: (product) => request('/products/', {
    method: 'POST',
    body: JSON.stringify(product)
  }),
  updateProduct: (id, product) => request(`/products/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(product)
  }),

  // Customers
  getCustomers: (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/customers/${query}`);
  },
  createCustomer: (customer) => request('/customers/', {
    method: 'POST',
    body: JSON.stringify(customer)
  }),

  // Suppliers
  getSuppliers: (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/suppliers/${query}`);
  },
  createSupplier: (supplier) => request('/suppliers/', {
    method: 'POST',
    body: JSON.stringify(supplier)
  }),
  updateSupplier: (id, supplier) => request(`/suppliers/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(supplier)
  }),

  // Shifts
  getShifts: () => request('/shifts/'),
  openShift: (cashierId, startingCash) => request('/shifts/open_shift/', {
    method: 'POST',
    body: JSON.stringify({ cashier: cashierId, starting_cash: startingCash })
  }),
  closeShift: (shiftId, actualCash) => request(`/shifts/${shiftId}/close_shift/`, {
    method: 'POST',
    body: JSON.stringify({ actual_cash: actualCash })
  }),

  // Sales
  getSales: () => request('/sales/'),
  checkout: (checkoutData) => request('/sales/checkout/', {
    method: 'POST',
    body: JSON.stringify(checkoutData)
  }),

  // Purchases / Procurement
  getPurchases: () => request('/purchases/'),
  placePurchaseOrder: (poData) => request('/purchases/place_order/', {
    method: 'POST',
    body: JSON.stringify(poData)
  }),
  receivePurchaseOrder: (poId, serialNumbers = {}) => request(`/purchases/${poId}/receive_order/`, {
    method: 'POST',
    body: JSON.stringify({ serial_numbers: serialNumbers })
  }),

  // Returns
  getReturns: () => request('/returns/'),
  processReturn: (returnData) => request('/returns/process_return/', {
    method: 'POST',
    body: JSON.stringify(returnData)
  }),

  // Audit Logs
  getAuditLogs: () => request('/audit/'),
  
  // M-Pesa STK Push
  stkPush: (phone, amount) => request('/sales/stk_push/', {
    method: 'POST',
    body: JSON.stringify({ phone, amount })
  }),

  // Serial & Warranty lookup
  lookupSerial: (serial) => request(`/sales/lookup_serial/?serial=${encodeURIComponent(serial)}`),

  // Customer Debt ledger
  getCustomerDebtHistory: (id) => request(`/customers/${id}/debt_history/`),
  payCustomerDebt: (id, amount, notes) => request(`/customers/${id}/pay_debt/`, {
    method: 'POST',
    body: JSON.stringify({ amount, notes })
  }),

  // Analytics
  getAnalyticsSummary: () => request('/analytics/summary/')
};
