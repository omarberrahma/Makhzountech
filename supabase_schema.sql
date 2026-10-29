-- ====================================================================
-- MakhzounTech - Multi-Tenant Cloud POS & Inventory SaaS Schema
-- Database: Supabase PostgreSQL (Supports Row Level Security - RLS)
-- Developer: Omar Farouk (Oran, Algeria)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS (Shops / Merchants)
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'tenant_' || gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    store_code VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(50),
    city VARCHAR(100) DEFAULT 'وهران',
    address TEXT,
    plan VARCHAR(50) DEFAULT 'PRO_SAAS',
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, TRIAL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days'
);

-- 2. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'usr_' || gen_random_uuid(),
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) DEFAULT 'CAISSIER', -- SUPER_ADMIN, STORE_ADMIN, CAISSIER
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'cat_' || gen_random_uuid(),
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    icon VARCHAR(50) DEFAULT 'folder',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ARTICLES (Stock & Products)
CREATE TABLE IF NOT EXISTS articles (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'art_' || gen_random_uuid(),
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    barcode VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    buying_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    quantity INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 5,
    unit VARCHAR(20) DEFAULT 'pcs',
    supplier_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CUSTOMERS & SUPPLIERS (CRM)
CREATE TABLE IF NOT EXISTS customers_suppliers (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'contact_' || gen_random_uuid(),
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'CLIENT', 'SUPPLIER'
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    max_debt_limit NUMERIC(12, 2) DEFAULT 100000.00,
    current_balance NUMERIC(12, 2) DEFAULT 0.00, -- Positive = owes shop (debt), Negative = shop owes supplier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. COMMERCIAL DOCUMENTS (BL, BR, Factures)
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'doc_' || gen_random_uuid(),
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    doc_number VARCHAR(100) NOT NULL, -- e.g., BL-2026-0042, FAC-2026-0019
    type VARCHAR(20) NOT NULL, -- 'BL' (Bon de Livraison), 'BR' (Bon de Reception), 'FAC' (Facture)
    contact_id VARCHAR(64) REFERENCES customers_suppliers(id) ON DELETE SET NULL,
    contact_name VARCHAR(255),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    remaining_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'PAID', -- 'PAID', 'PARTIAL', 'UNPAID'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. DOCUMENT ITEMS
CREATE TABLE IF NOT EXISTS document_items (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'item_' || gen_random_uuid(),
    document_id VARCHAR(64) REFERENCES documents(id) ON DELETE CASCADE,
    article_id VARCHAR(64) REFERENCES articles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- 8. CAISSE TRANSACTIONS (POS Cash Register Sessions & Sales)
CREATE TABLE IF NOT EXISTS caisse_transactions (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'trx_' || gen_random_uuid(),
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'SALE', 'DEBT_PAYMENT', 'EXPENSE', 'DEPOSIT'
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'CASH', -- 'CASH', 'BARIDIMOB', 'CREDIT'
    description TEXT,
    reference_doc VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. DEBT PAYMENTS LEDGER (Versement / Remboursement)
CREATE TABLE IF NOT EXISTS debt_payments (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'pay_' || gen_random_uuid(),
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id VARCHAR(64) REFERENCES customers_suppliers(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR SPEED AND TENANT ISOLATION
CREATE INDEX IF NOT EXISTS idx_articles_tenant ON articles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_articles_barcode ON articles(barcode);
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_caisse_tenant ON caisse_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_tenant ON customers_suppliers(tenant_id);

-- SEED INITIAL SAMPLE DATA
INSERT INTO tenants (id, name, store_code, phone, city, plan, status)
VALUES ('tenant_oran_01', 'محل وهران المركزي', 'ORAN-STORE-01', '041 00 11 22', 'وهران', 'PRO_SAAS', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, tenant_id, full_name, email, password_hash, role)
VALUES ('usr_admin_01', 'tenant_oran_01', 'عمر فاروق', 'admin@makhzountech.dz', 'hash_admin_123', 'STORE_ADMIN')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, tenant_id, name) VALUES
('cat_food', 'tenant_oran_01', 'مواد غذائية'),
('cat_general', 'tenant_oran_01', 'مستلزمات عامة')
ON CONFLICT (id) DO NOTHING;

INSERT INTO articles (id, tenant_id, category_id, barcode, title, buying_price, selling_price, quantity, min_stock_alert, supplier_name) VALUES
('art_001', 'tenant_oran_01', 'cat_food', '61300012345', 'حليب كانديا 1 لتر', 110.00, 135.00, 48, 10, 'مجمع كانديا الجزائر'),
('art_002', 'tenant_oran_01', 'cat_food', '61300067890', 'زيت عافية 5 لتر', 580.00, 650.00, 12, 5, 'مؤسسة سفينة وهران'),
('art_003', 'tenant_oran_01', 'cat_food', '61300099881', 'قهوة فاميكو 250غ', 220.00, 270.00, 3, 5, 'مطاحن العاصمة')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers_suppliers (id, tenant_id, type, name, phone, max_debt_limit, current_balance) VALUES
('contact_001', 'tenant_oran_01', 'CLIENT', 'مكتبة الوفاء', '0550 12 34 56', 100000.00, 34000.00),
('contact_002', 'tenant_oran_01', 'CLIENT', 'سوبرماركت البركة', '0770 98 76 54', 200000.00, 111000.00),
('contact_003', 'tenant_oran_01', 'SUPPLIER', 'مجمع كانديا الجزائر', '021 99 88 77', 500000.00, 0.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO documents (id, tenant_id, doc_number, type, contact_name, total_amount, paid_amount, remaining_balance, payment_status) VALUES
('doc_001', 'tenant_oran_01', 'BL-2026-0042', 'BL', 'مكتبة الوفاء', 14200.00, 14200.00, 0.00, 'PAID'),
('doc_002', 'tenant_oran_01', 'FAC-2026-0019', 'FAC', 'سوبرماركت البركة', 48000.00, 20000.00, 28000.00, 'PARTIAL')
ON CONFLICT (id) DO NOTHING;
