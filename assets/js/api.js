/**
 * MakhzounTech API Client Library
 * Handles communication with Express API and supports offline fallback
 */

const MakhzounAPI = {
  getTenantId: function() {
    return localStorage.getItem('makhzoun_tenant_id') || 'tenant_oran_01';
  },

  setTenantId: function(id) {
    localStorage.setItem('makhzoun_tenant_id', id);
  },

  request: async function(endpoint, options = {}) {
    const tenantId = this.getTenantId();
    const headers = {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      ...(options.headers || {})
    };

    try {
      const response = await fetch(endpoint, { ...options, headers });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Server error');
      }
      return data;
    } catch (err) {
      console.warn(`API network issue on ${endpoint}:`, err.message);
      // Return fallback response when offline
      return { success: false, offline: true, error: err.message };
    }
  },

  getArticles: async function() {
    return this.request('/api/articles');
  },

  addArticle: async function(articleData) {
    return this.request('/api/articles', {
      method: 'POST',
      body: JSON.stringify(articleData)
    });
  },

  checkoutPOS: async function(checkoutData) {
    return this.request('/api/pos/checkout', {
      method: 'POST',
      body: JSON.stringify(checkoutData)
    });
  },

  getContacts: async function() {
    return this.request('/api/contacts');
  },

  addContact: async function(contactData) {
    return this.request('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData)
    });
  },

  payDebt: async function(contactId, amount, note) {
    return this.request(`/api/contacts/${contactId}/pay-debt`, {
      method: 'POST',
      body: JSON.stringify({ amount, note })
    });
  },

  getDocuments: async function() {
    return this.request('/api/documents');
  },

  getAdminTenants: async function() {
    return this.request('/api/admin/tenants');
  },

  updateTenantStatus: async function(tenantId, status) {
    return this.request(`/api/admin/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
};

window.MakhzounAPI = MakhzounAPI;
