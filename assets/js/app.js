/**
 * MakhzounTech SaaS Main Frontend App Controller
 * Router, Dynamic UI Binders, Modal Controllers, and SaaS Tenant Switcher
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
  loadTenantHeader();
});

function loadTenantHeader() {
  const storeBadge = document.getElementById('store-name-display');
  if (storeBadge) {
    const tenantId = window.MakhzounAPI.getTenantId();
    storeBadge.innerText = tenantId === 'tenant_algiers_02' ? 'سوبرماركت القصبة' : 'محل وهران المركزي';
  }
}

function switchTenant(tenantId) {
  window.MakhzounAPI.setTenantId(tenantId);
  loadTenantHeader();
  alert(`تم التحويل إلى المتجر: ${tenantId}`);
  window.location.reload();
}

// Global Tab Switcher Engine
function switchTab(tabId) {
  const tabs = ['dashboard', 'pos', 'inventory', 'documents', 'crm', 'stocktaking', 'subscription'];
  const titles = {
    'dashboard': 'لوحة التحكم الرئيسية',
    'pos': 'نقطة البيع السريع (Caisse / POS)',
    'inventory': 'إدارة السلع والمخزون (Articles & Stock)',
    'documents': 'سندات التسليم والاستلام والفواتير (Documents)',
    'crm': 'إدارة الزبائن، الموردين والديون (Clients & Dettes)',
    'stocktaking': 'جلسات الجرد الدوري ومطابقة الرفوف (Inventaire)',
    'subscription': 'إدارة الاشتراك والترقية (SaaS Subscription)'
  };

  tabs.forEach(id => {
    const el = document.getElementById('tab-' + id);
    if (el) el.classList.add('hidden');
  });

  const current = document.getElementById('tab-' + tabId);
  if (current) current.classList.remove('hidden');

  const titleEl = document.getElementById('section-title');
  if (titleEl) titleEl.innerText = titles[tabId] || 'MakhzounTech';

  // Update sidebar navigation active highlight
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.className = "tab-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition bg-teal-500/10 text-teal-400 border border-teal-500/20";
    } else {
      btn.className = "tab-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition text-slate-400 hover:bg-slate-900 hover:text-slate-200";
    }
  });

  if (window.lucide) window.lucide.createIcons();
}

// Open / Close General Modals
function openModal(modalId) {
  const el = document.getElementById('modal-' + modalId);
  if (el) el.classList.remove('hidden');
}

function closeModal(modalId) {
  const el = document.getElementById('modal-' + modalId);
  if (el) el.classList.add('hidden');
}

window.switchTab = switchTab;
window.switchTenant = switchTenant;
window.openModal = openModal;
window.closeModal = closeModal;
