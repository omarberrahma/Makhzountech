/**
 * Express Backend API Server for MakhzounTech SaaS
 * Multi-Tenant SaaS Platform for POS, Inventory, and Debt Management
 * Author: Omar Farouk (Oran, Algeria)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, '..')));

// Middleware: Extract & Validate Tenant Context
const tenantMiddleware = (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] || req.query.tenant_id || 'tenant_oran_01';
  const tenant = db.memoryDb.tenants.find(t => t.id === tenantId);

  if (!tenant) {
    return res.status(404).json({ error: 'Tenant shop not found' });
  }

  if (tenant.status !== 'ACTIVE' && !req.path.startsWith('/api/admin')) {
    return res.status(403).json({
      error: 'Account Suspended',
      message: 'اشتراك المتجر معطل أو منتهي الصلاحية. يرجى التواصل مع الإدارة.'
    });
  }

  req.tenant = tenant;
  next();
};

app.use('/api', tenantMiddleware);

// ==========================================
// 1. HEALTH & TENANT INFO API
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    app: 'MakhzounTech Cloud Platform',
    version: '1.0.0',
    tenant: req.tenant.name,
    dbConnected: db.isPgConnected()
  });
});

app.get('/api/tenant/current', (req, res) => {
  res.json({ success: true, tenant: req.tenant });
});

// ==========================================
// 2. ARTICLES & INVENTORY MANAGEMENT API
// ==========================================
app.get('/api/articles', (req, res) => {
  const tenantId = req.tenant.id;
  const articles = db.memoryDb.articles.filter(a => a.tenant_id === tenantId);
  res.json({ success: true, count: articles.length, articles });
});

app.post('/api/articles', (req, res) => {
  const tenantId = req.tenant.id;
  const { title, barcode, category_id, buying_price, selling_price, quantity, min_stock_alert, unit, supplier_name } = req.body;

  if (!title || selling_price === undefined) {
    return res.status(400).json({ error: 'اسم السلعة وسعر البيع مطلوبان' });
  }

  const newArticle = {
    id: 'art_' + Date.now(),
    tenant_id: tenantId,
    category_id: category_id || 'cat_general',
    barcode: barcode || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
    title,
    buying_price: parseFloat(buying_price || 0),
    selling_price: parseFloat(selling_price || 0),
    quantity: parseInt(quantity || 0, 10),
    min_stock_alert: parseInt(min_stock_alert || 5, 10),
    unit: unit || 'pcs',
    supplier_name: supplier_name || 'غير محدد',
    created_at: new Date().toISOString()
  };

  db.memoryDb.articles.push(newArticle);
  res.status(201).json({ success: true, message: 'تمت إضافة السلعة بنجاح', article: newArticle });
});

app.put('/api/articles/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenant.id;
  const index = db.memoryDb.articles.findIndex(a => a.id === id && a.tenant_id === tenantId);

  if (index === -1) {
    return res.status(404).json({ error: 'السلعة غير موجودة' });
  }

  const existing = db.memoryDb.articles[index];
  const updated = {
    ...existing,
    ...req.body,
    buying_price: req.body.buying_price !== undefined ? parseFloat(req.body.buying_price) : existing.buying_price,
    selling_price: req.body.selling_price !== undefined ? parseFloat(req.body.selling_price) : existing.selling_price,
    quantity: req.body.quantity !== undefined ? parseInt(req.body.quantity, 10) : existing.quantity,
    updated_at: new Date().toISOString()
  };

  db.memoryDb.articles[index] = updated;
  res.json({ success: true, message: 'تم تحديث بيانات السلعة', article: updated });
});

app.delete('/api/articles/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenant.id;
  const index = db.memoryDb.articles.findIndex(a => a.id === id && a.tenant_id === tenantId);

  if (index === -1) {
    return res.status(404).json({ error: 'السلعة غير موجودة' });
  }

  db.memoryDb.articles.splice(index, 1);
  res.json({ success: true, message: 'تم حذف السلعة' });
});

// ==========================================
// 3. POS & CAISSE TRANSACTIONS API
// ==========================================
app.post('/api/pos/checkout', (req, res) => {
  const tenantId = req.tenant.id;
  const { items, contact_id, payment_method, is_credit } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'سلة المبيعات فارغة' });
  }

  let totalAmount = 0;

  // Verify stock & calculate total
  for (const item of items) {
    const article = db.memoryDb.articles.find(a => a.title === item.title && a.tenant_id === tenantId);
    if (article) {
      if (article.quantity < item.qty) {
        return res.status(400).json({ error: `الكمية غير كافية للسلعة: ${article.title}` });
      }
      article.quantity -= item.qty;
    }
    totalAmount += item.price * item.qty;
  }

  // Handle client debt if transaction is credit
  let clientName = 'زبون عابر (Comptoir)';
  if (contact_id) {
    const contact = db.memoryDb.contacts.find(c => c.id === contact_id && c.tenant_id === tenantId);
    if (contact) {
      clientName = contact.name;
      if (is_credit) {
        contact.current_balance = (parseFloat(contact.current_balance) || 0) + totalAmount;
      }
    }
  }

  // Create Document (BL - Bon de Livraison)
  const docNumber = 'BL-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const newDoc = {
    id: 'doc_' + Date.now(),
    tenant_id: tenantId,
    doc_number: docNumber,
    type: 'BL',
    contact_id: contact_id || null,
    contact_name: clientName,
    total_amount: totalAmount,
    paid_amount: is_credit ? 0 : totalAmount,
    remaining_balance: is_credit ? totalAmount : 0,
    payment_status: is_credit ? 'UNPAID' : 'PAID',
    created_at: new Date().toISOString()
  };
  db.memoryDb.documents.unshift(newDoc);

  // Record Caisse Transaction
  const trx = {
    id: 'trx_' + Date.now(),
    tenant_id: tenantId,
    type: 'SALE',
    amount: is_credit ? 0 : totalAmount,
    payment_method: payment_method || 'CASH',
    description: `بيع تجزئة (${items.length} مواد)`,
    reference_doc: docNumber,
    created_at: new Date().toISOString()
  };
  db.memoryDb.caisse.unshift(trx);

  res.status(201).json({
    success: true,
    message: 'تم تسجيل عملية البيع وتحديث المخزون',
    document: newDoc,
    transaction: trx
  });
});

// ==========================================
// 4. COMMERCIAL DOCUMENTS API (BL, BR, Factures)
// ==========================================
app.get('/api/documents', (req, res) => {
  const tenantId = req.tenant.id;
  const docs = db.memoryDb.documents.filter(d => d.tenant_id === tenantId);
  res.json({ success: true, count: docs.length, documents: docs });
});

app.post('/api/documents', (req, res) => {
  const tenantId = req.tenant.id;
  const { type, contact_name, total_amount, paid_amount } = req.body;

  const prefix = type || 'BL';
  const docNumber = prefix + '-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const total = parseFloat(total_amount || 0);
  const paid = parseFloat(paid_amount || 0);
  const remaining = Math.max(0, total - paid);

  const newDoc = {
    id: 'doc_' + Date.now(),
    tenant_id: tenantId,
    doc_number: docNumber,
    type: prefix,
    contact_name: contact_name || 'عميل عام',
    total_amount: total,
    paid_amount: paid,
    remaining_balance: remaining,
    payment_status: remaining === 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID'),
    created_at: new Date().toISOString()
  };

  db.memoryDb.documents.unshift(newDoc);
  res.status(201).json({ success: true, document: newDoc });
});

// ==========================================
// 5. CRM & DEBTS API (Clients, Suppliers, Debts)
// ==========================================
app.get('/api/contacts', (req, res) => {
  const tenantId = req.tenant.id;
  const contacts = db.memoryDb.contacts.filter(c => c.tenant_id === tenantId);
  res.json({ success: true, count: contacts.length, contacts });
});

app.post('/api/contacts', (req, res) => {
  const tenantId = req.tenant.id;
  const { type, name, phone, address, max_debt_limit } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'الاسم مطلوب' });
  }

  const newContact = {
    id: 'contact_' + Date.now(),
    tenant_id: tenantId,
    type: type || 'CLIENT',
    name,
    phone: phone || '',
    address: address || '',
    max_debt_limit: parseFloat(max_debt_limit || 100000),
    current_balance: 0.00,
    created_at: new Date().toISOString()
  };

  db.memoryDb.contacts.push(newContact);
  res.status(201).json({ success: true, message: 'تم إضافة جهة الاتصال بنجاح', contact: newContact });
});

app.post('/api/contacts/:id/pay-debt', (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenant.id;
  const { amount, note } = req.body;

  const contact = db.memoryDb.contacts.find(c => c.id === id && c.tenant_id === tenantId);
  if (!contact) {
    return res.status(404).json({ error: 'الزبون غير موجود' });
  }

  const payVal = parseFloat(amount || 0);
  if (payVal <= 0) {
    return res.status(400).json({ error: 'يرجى إدخال مبلغ تسديد صالح' });
  }

  contact.current_balance = Math.max(0, contact.current_balance - payVal);

  const payment = {
    id: 'pay_' + Date.now(),
    tenant_id: tenantId,
    contact_id: id,
    amount: payVal,
    note: note || 'تسديد دين جزئي/كلي',
    created_at: new Date().toISOString()
  };

  db.memoryDb.debtPayments.push(payment);

  // Record cash input to caisse
  db.memoryDb.caisse.unshift({
    id: 'trx_' + Date.now(),
    tenant_id: tenantId,
    type: 'DEBT_PAYMENT',
    amount: payVal,
    payment_method: 'CASH',
    description: `تحصيل دين من: ${contact.name}`,
    created_at: new Date().toISOString()
  });

  res.json({ success: true, message: 'تم تسديد الدين وتحديث الحساب', current_balance: contact.current_balance });
});

// ==========================================
// 6. SUPER-ADMIN SAAS SUBSCRIPTION API
// ==========================================
app.get('/api/admin/tenants', (req, res) => {
  res.json({ success: true, tenants: db.memoryDb.tenants });
});

app.post('/api/admin/tenants', (req, res) => {
  const { name, store_code, phone, city, plan } = req.body;

  if (!name || !store_code) {
    return res.status(400).json({ error: 'اسم المتجر وكود المتجر مطلوبان' });
  }

  const newTenant = {
    id: 'tenant_' + Date.now(),
    name,
    store_code,
    phone: phone || '',
    city: city || 'وهران',
    plan: plan || 'PRO_SAAS',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
  };

  db.memoryDb.tenants.push(newTenant);
  res.status(201).json({ success: true, message: 'تم إنشاء المحل الجديد وترخيصه', tenant: newTenant });
});

app.patch('/api/admin/tenants/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const tenant = db.memoryDb.tenants.find(t => t.id === id);
  if (!tenant) {
    return res.status(404).json({ error: 'المحل غير موجود' });
  }

  tenant.status = status || 'SUSPENDED';
  res.json({ success: true, message: `تم تعديل حالة الاشتراك إلى: ${tenant.status}`, tenant });
});

// Export app and listen if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 MakhzounTech Cloud API is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
