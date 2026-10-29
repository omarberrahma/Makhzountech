/**
 * Database Module for MakhzounTech SaaS
 * Supports PostgreSQL connection pool with an in-memory fallback store
 * when running without a connected PostgreSQL instance.
 */

const { Pool } = require('pg');

let pool = null;
let isPgConnected = false;

// Check if DATABASE_URL is configured
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  pool.connect((err, client, release) => {
    if (err) {
      console.warn('⚠️ Could not connect to PostgreSQL. Falling back to in-memory store:', err.message);
      isPgConnected = false;
    } else {
      console.log('✅ Connected to PostgreSQL database via PG pool.');
      isPgConnected = true;
      release();
    }
  });
}

// In-Memory Data Store (Fallback)
const memoryDb = {
  tenants: [
    {
      id: 'tenant_oran_01',
      name: 'محل وهران المركزي',
      store_code: 'ORAN-STORE-01',
      phone: '041 00 11 22',
      city: 'وهران',
      address: 'شارع العربي بن مهيدي، وهران',
      plan: 'PRO_SAAS',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 3600 * 1000 * 30).toISOString()
    },
    {
      id: 'tenant_algiers_02',
      name: 'سوبرماركت القصبة',
      store_code: 'ALG-STORE-02',
      phone: '021 55 44 33',
      city: 'الجزائر العاصمة',
      address: 'القصبة، الجزائر',
      plan: 'STARTER',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 3600 * 1000 * 15).toISOString()
    }
  ],
  articles: [
    {
      id: 'art_001',
      tenant_id: 'tenant_oran_01',
      category_id: 'cat_food',
      barcode: '61300012345',
      title: 'حليب كانديا 1 لتر',
      buying_price: 110.00,
      selling_price: 135.00,
      quantity: 48,
      min_stock_alert: 10,
      unit: 'pcs',
      supplier_name: 'مجمع كانديا الجزائر',
      created_at: new Date().toISOString()
    },
    {
      id: 'art_002',
      tenant_id: 'tenant_oran_01',
      category_id: 'cat_food',
      barcode: '61300067890',
      title: 'زيت عافية 5 لتر',
      buying_price: 580.00,
      selling_price: 650.00,
      quantity: 12,
      min_stock_alert: 5,
      unit: 'pcs',
      supplier_name: 'مؤسسة سفينة وهران',
      created_at: new Date().toISOString()
    },
    {
      id: 'art_003',
      tenant_id: 'tenant_oran_01',
      category_id: 'cat_food',
      barcode: '61300099881',
      title: 'قهوة فاميكو 250غ',
      buying_price: 220.00,
      selling_price: 270.00,
      quantity: 3,
      min_stock_alert: 5,
      unit: 'pcs',
      supplier_name: 'مطاحن العاصمة',
      created_at: new Date().toISOString()
    }
  ],
  contacts: [
    {
      id: 'contact_001',
      tenant_id: 'tenant_oran_01',
      type: 'CLIENT',
      name: 'مكتبة الوفاء',
      phone: '0550 12 34 56',
      address: 'حي السلام، وهران',
      max_debt_limit: 100000.00,
      current_balance: 34000.00,
      created_at: new Date().toISOString()
    },
    {
      id: 'contact_002',
      tenant_id: 'tenant_oran_01',
      type: 'CLIENT',
      name: 'سوبرماركت البركة',
      phone: '0770 98 76 54',
      address: 'حي الياسمين، وهران',
      max_debt_limit: 200000.00,
      current_balance: 111000.00,
      created_at: new Date().toISOString()
    },
    {
      id: 'contact_003',
      tenant_id: 'tenant_oran_01',
      type: 'SUPPLIER',
      name: 'مجمع كانديا الجزائر',
      phone: '021 99 88 77',
      address: 'المنطقة الصناعية، الجزائر',
      max_debt_limit: 500000.00,
      current_balance: 0.00,
      created_at: new Date().toISOString()
    }
  ],
  documents: [
    {
      id: 'doc_001',
      tenant_id: 'tenant_oran_01',
      doc_number: 'BL-2026-0042',
      type: 'BL',
      contact_id: 'contact_001',
      contact_name: 'مكتبة الوفاء',
      total_amount: 14200.00,
      paid_amount: 14200.00,
      remaining_balance: 0.00,
      payment_status: 'PAID',
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: 'doc_002',
      tenant_id: 'tenant_oran_01',
      doc_number: 'FAC-2026-0019',
      type: 'FAC',
      contact_id: 'contact_002',
      contact_name: 'سوبرماركت البركة',
      total_amount: 48000.00,
      paid_amount: 20000.00,
      remaining_balance: 28000.00,
      payment_status: 'PARTIAL',
      created_at: new Date(Date.now() - 3600 * 1000).toISOString()
    }
  ],
  caisse: [
    {
      id: 'trx_001',
      tenant_id: 'tenant_oran_01',
      type: 'SALE',
      amount: 32400.00,
      payment_method: 'CASH',
      description: 'مبيعات الوردية اليومية',
      reference_doc: 'BL-2026-0042',
      created_at: new Date().toISOString()
    }
  ],
  debtPayments: []
};

// Database Query Wrapper
async function query(text, params = []) {
  if (isPgConnected && pool) {
    return pool.query(text, params);
  } else {
    // In-memory query simulation
    return { rows: [], rowCount: 0 };
  }
}

module.exports = {
  query,
  memoryDb,
  isPgConnected: () => isPgConnected
};
