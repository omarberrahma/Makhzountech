/**
 * MakhzounTech POS & Touch Screen Cashier Module
 * Handles touch cart calculations, barcodes, receipt generation, and thermal printing.
 */

let posCart = [];

function addToPOSCart(title, price, barcode) {
  const existing = posCart.find(item => item.title === title);
  if (existing) {
    existing.qty += 1;
  } else {
    posCart.push({ title, price, qty: 1, barcode: barcode || '' });
  }
  renderPOSCart();
}

function updatePOSQty(index, delta) {
  if (posCart[index]) {
    posCart[index].qty += delta;
    if (posCart[index].qty <= 0) {
      posCart.splice(index, 1);
    }
  }
  renderPOSCart();
}

function removePOSItem(index) {
  posCart.splice(index, 1);
  renderPOSCart();
}

function clearPOSCart() {
  posCart = [];
  renderPOSCart();
}

function renderPOSCart() {
  const listEl = document.getElementById('cart-list');
  const totalEl = document.getElementById('pos-total');

  if (!listEl || !totalEl) return;

  if (posCart.length === 0) {
    listEl.innerHTML = `<p class="text-xs text-slate-500 text-center py-8">السلة فارغة، انقر على السلع لإضافتها.</p>`;
    totalEl.innerText = "0 دج";
    return;
  }

  let total = 0;
  listEl.innerHTML = posCart.map((item, idx) => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    return `
      <div class="flex items-center justify-between bg-slate-900/70 border border-slate-800/80 p-2.5 rounded-lg text-xs">
        <div>
          <p class="font-bold text-slate-200">${item.title}</p>
          <p class="text-[10px] text-slate-400">${item.price} دج × ${item.qty}</p>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center bg-slate-800 rounded px-1">
            <button onclick="updatePOSQty(${idx}, -1)" class="px-1.5 py-0.5 text-slate-300 hover:text-white font-bold">-</button>
            <span class="px-2 font-bold text-teal-400 text-xs">${item.qty}</span>
            <button onclick="updatePOSQty(${idx}, 1)" class="px-1.5 py-0.5 text-slate-300 hover:text-white font-bold">+</button>
          </div>
          <span class="font-bold text-teal-400 w-16 text-left">${subtotal} دج</span>
          <button onclick="removePOSItem(${idx})" class="text-rose-400 hover:text-rose-300 font-bold px-1">✕</button>
        </div>
      </div>
    `;
  }).join('');

  totalEl.innerText = total.toLocaleString() + " دج";
}

async function handlePOSCheckout(paymentMethod = 'CASH', isCredit = false) {
  if (posCart.length === 0) {
    alert("السلة فارغة! أضف سلعاً أولاً.");
    return;
  }

  const clientSelect = document.getElementById('pos-client-select');
  const contactId = clientSelect ? clientSelect.value : null;

  const res = await window.MakhzounAPI.checkoutPOS({
    items: posCart,
    contact_id: contactId,
    payment_method: paymentMethod,
    is_credit: isCredit
  });

  if (res.success || res.offline) {
    generateThermalReceipt(res.document || { doc_number: 'BL-LOCAL-01', total_amount: posCart.reduce((a, b) => a + b.price * b.qty, 0) });
    alert("تم تسجيل العملية بنجاح في الصندوق!");
    clearPOSCart();
    if (window.loadDashboardStats) window.loadDashboardStats();
  } else {
    alert("خطأ أثناء تسجيل البيع: " + (res.error || 'يرجى التثبت من البيانات'));
  }
}

function generateThermalReceipt(doc) {
  let receiptModal = document.getElementById('thermal-receipt-modal');
  if (!receiptModal) {
    receiptModal = document.createElement('div');
    receiptModal.id = 'thermal-receipt-modal';
    receiptModal.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    document.body.appendChild(receiptModal);
  }

  const dateStr = new Date().toLocaleString('ar-DZ');
  const total = doc.total_amount || posCart.reduce((a, b) => a + (b.price * b.qty), 0);

  receiptModal.innerHTML = `
    <div class="bg-white text-slate-950 p-6 rounded-2xl max-w-sm w-full font-mono text-xs shadow-2xl">
      <div id="thermal-receipt" class="text-center space-y-2">
        <h2 class="font-black text-base uppercase">MakhzounTech POS</h2>
        <p class="text-[10px]">محل وهران المركزي - الجزائر</p>
        <p class="text-[10px]">هاتف: 041 00 11 22</p>
        <div class="border-b border-dashed border-slate-400 my-2"></div>
        <div class="flex justify-between text-[11px]">
          <span>رقم السند: ${doc.doc_number || 'BL-2026-0001'}</span>
          <span>${dateStr}</span>
        </div>
        <div class="border-b border-dashed border-slate-400 my-2"></div>
        <table class="w-full text-right text-[11px]">
          <thead>
            <tr class="border-b border-slate-300">
              <th>السلعة</th>
              <th>الكمية</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${posCart.map(i => `
              <tr>
                <td>${i.title}</td>
                <td>${i.qty}</td>
                <td>${i.price * i.qty} دج</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="border-b border-dashed border-slate-400 my-2"></div>
        <div class="flex justify-between font-extrabold text-sm">
          <span>المجموع الصافي:</span>
          <span>${total.toLocaleString()} دج</span>
        </div>
        <p class="text-[10px] mt-4 text-center">شكراً لزيارتكم! مرحباً بكم دائماً</p>
      </div>

      <div class="mt-6 flex gap-2 no-print">
        <button onclick="window.print()" class="flex-1 bg-teal-500 text-slate-950 font-bold py-2 rounded-lg">طباعة التذكرة</button>
        <button onclick="document.getElementById('thermal-receipt-modal').remove()" class="bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-lg">إغلاق</button>
      </div>
    </div>
  `;
}

window.addToPOSCart = addToPOSCart;
window.updatePOSQty = updatePOSQty;
window.removePOSItem = removePOSItem;
window.clearPOSCart = clearPOSCart;
window.renderPOSCart = renderPOSCart;
window.handlePOSCheckout = handlePOSCheckout;
