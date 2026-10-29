/**
 * Integration Test Suite for MakhzounTech Cloud API
 */

const assert = require('assert');
const app = require('../server/server.js');
const http = require('http');

let server;
const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': 'tenant_oran_01',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting MakhzounTech API Integration Tests...');

  server = app.listen(PORT, async () => {
    try {
      // Test 1: Health Check
      console.log('Test 1: Health Check Endpoint');
      const health = await makeRequest('/api/health');
      assert.strictEqual(health.status, 200);
      assert.strictEqual(health.body.status, 'ONLINE');
      console.log('  ✅ Health check passed.');

      // Test 2: Get Articles
      console.log('Test 2: Fetch Articles for Tenant');
      const articles = await makeRequest('/api/articles');
      assert.strictEqual(articles.status, 200);
      assert.strictEqual(articles.body.success, true);
      assert.strictEqual(Array.isArray(articles.body.articles), true);
      console.log(`  ✅ Articles fetched: count = ${articles.body.count}`);

      // Test 3: Add New Article
      console.log('Test 3: Add New Article');
      const newArtRes = await makeRequest('/api/articles', 'POST', {
        title: 'كسكس بن حمادي 1 كغ',
        barcode: '613111222333',
        buying_price: 90,
        selling_price: 115,
        quantity: 50
      });
      assert.strictEqual(newArtRes.status, 201);
      assert.strictEqual(newArtRes.body.success, true);
      assert.strictEqual(newArtRes.body.article.title, 'كسكس بن حمادي 1 كغ');
      console.log('  ✅ New article added successfully.');

      // Test 4: POS Checkout
      console.log('Test 4: POS Checkout & Inventory Deduct');
      const checkoutRes = await makeRequest('/api/pos/checkout', 'POST', {
        items: [
          { title: 'حليب كانديا 1 لتر', price: 135, qty: 2 }
        ],
        contact_id: 'contact_001',
        payment_method: 'CASH',
        is_credit: false
      });
      assert.strictEqual(checkoutRes.status, 201);
      assert.strictEqual(checkoutRes.body.success, true);
      assert.strictEqual(checkoutRes.body.document.total_amount, 270);
      console.log('  ✅ POS Checkout executed successfully.');

      // Test 5: CRM Debt Payment
      console.log('Test 5: Pay Client Debt');
      const payRes = await makeRequest('/api/contacts/contact_001/pay-debt', 'POST', {
        amount: 4000,
        note: 'دفعة صائفة'
      });
      assert.strictEqual(payRes.status, 200);
      assert.strictEqual(payRes.body.success, true);
      console.log('  ✅ Debt payment recorded successfully.');

      // Test 6: Super-Admin Toggle Tenant Status
      console.log('Test 6: Super-Admin Tenant Toggle');
      const toggleRes = await makeRequest('/api/admin/tenants/tenant_oran_01/status', 'PATCH', {
        status: 'ACTIVE'
      });
      assert.strictEqual(toggleRes.status, 200);
      assert.strictEqual(toggleRes.body.tenant.status, 'ACTIVE');
      console.log('  ✅ Super-Admin tenant switch tested.');

      console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('❌ Test failed:', err);
      if (server) server.close();
      process.exit(1);
    }
  });
}

runTests();
