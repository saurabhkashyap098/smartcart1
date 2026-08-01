/* SmartCart — Checkout Page Logic */

if (!Auth.isLoggedIn()) {
  window.location.href = '/pages/login.html?redirect=/pages/checkout.html';
}

let cart = null, user = null, selectedAddr = null, payMethod = 'cod';

async function loadCheckout() {
  const [cartRes, userRes] = await Promise.all([CartAPI.get(), AuthAPI.getMe()]);
  if (!cartRes?.ok || !cartRes.data.cart?.items?.length) {
    window.location.href = '/pages/cart.html';
    return;
  }
  cart = cartRes.data.cart;
  user = userRes.data.user;
  if (user.addresses?.length) {
    selectedAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
  }
  render();
}

function render() {
  const step1Done = !!selectedAddr;
  document.getElementById('checkoutLayout').innerHTML = `
  <div class="steps">
    <!-- Step 1: Address -->
    <div class="step-panel">
      <div class="step-header" id="stepHeader1">
        <div class="step-num ${step1Done ? 'done' : ''}">1</div>
        <div>
          <div class="step-label ${!step1Done ? 'active' : ''}">DELIVERY ADDRESS</div>
          ${selectedAddr ? `<div class="step-summary">${selectedAddr.name} — ${selectedAddr.addressLine1}, ${selectedAddr.city}</div>` : ''}
        </div>
      </div>
      <div class="step-body ${!step1Done ? 'open' : ''}" id="step1Body">
        <div id="addrList">
          ${user.addresses?.map(a => `
          <div class="address-card ${selectedAddr?._id === a._id ? 'selected' : ''}" data-addr-id="${a._id}" style="margin-bottom:12px;cursor:pointer">
            <div class="address-tag">${a.type || 'Home'}</div>
            <div style="font-weight:600">${a.name} &nbsp;<span style="font-size:12px;color:var(--text-secondary)">${a.phone}</span></div>
            <div style="font-size:13px;color:#555;margin-top:4px">${a.addressLine1}${a.addressLine2 ? ', ' + a.addressLine2 : ''}, ${a.city}, ${a.state} — ${a.pincode}</div>
          </div>`).join('') || '<p style="color:var(--text-secondary);font-size:14px">No saved addresses. Add one below.</p>'}
        </div>
        <button class="btn btn-outline btn-sm" id="toggleAddrBtn" style="margin-top:12px">+ Add New Address</button>
        <div class="add-addr-form" id="addrForm" style="display:none">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" id="aName" placeholder="Recipient name"/></div>
            <div class="form-group"><label class="form-label">Phone *</label><input class="form-control" id="aPhone" placeholder="10-digit mobile"/></div>
          </div>
          <div class="form-group"><label class="form-label">Address Line 1 *</label><input class="form-control" id="aLine1" placeholder="House No, Building, Street"/></div>
          <div class="form-group"><label class="form-label">Address Line 2 (Optional)</label><input class="form-control" id="aLine2" placeholder="Locality, Area"/></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">City *</label><input class="form-control" id="aCity"/></div>
            <div class="form-group"><label class="form-label">State *</label><input class="form-control" id="aState"/></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Pincode *</label><input class="form-control" id="aPin" maxlength="6"/></div>
            <div class="form-group"><label class="form-label">Type</label>
              <select class="form-control" id="aType">
                <option>Home</option><option>Work</option><option>Other</option>
              </select>
            </div>
          </div>
          <div style="display:flex;gap:12px;margin-top:4px">
            <button class="btn btn-primary" id="saveAddrBtn">Save &amp; Deliver Here</button>
            <button class="btn btn-outline" id="cancelAddrBtn">Cancel</button>
          </div>
        </div>
        ${selectedAddr ? `<div style="margin-top:16px"><button class="btn btn-secondary" id="proceedToPayBtn">Deliver to this address →</button></div>` : ''}
      </div>
    </div>

    <!-- Step 2: Payment -->
    <div class="step-panel">
      <div class="step-header" id="stepHeader2">
        <div class="step-num">2</div>
        <div><div class="step-label ${step1Done ? 'active' : ''}">ORDER SUMMARY &amp; PAYMENT</div></div>
      </div>
      <div class="step-body" id="step2Body">
        <div style="font-size:15px;font-weight:700;margin-bottom:12px">Order Items</div>
        <div>
          ${cart.items.map(i => `<div class="order-summary-item">
            <img src="${i.image || 'https://via.placeholder.com/50'}" alt="${i.name}"/>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600">${i.name}</div>
              <div style="font-size:12px;color:var(--text-secondary)">Qty: ${i.quantity}</div>
            </div>
            <div style="font-weight:700">${fmt.price(i.price * i.quantity)}</div>
          </div>`).join('')}
        </div>
        <div style="margin-top:20px;font-size:15px;font-weight:700;margin-bottom:12px">Payment Method</div>
        <div>
          ${renderPayOption('cod', '📦', 'Cash on Delivery', 'Pay when your order arrives')}
          ${renderPayOption('razorpay', '⚡', 'Online Payment (Razorpay)', 'Credit/Debit Card, UPI, Net Banking, Wallets')}
        </div>
        ${payMethod === 'razorpay' ? `<div style="background:var(--primary-light);border-radius:4px;padding:12px;margin-top:8px;font-size:13px;color:var(--primary)">✓ You will be redirected to Razorpay's secure payment gateway</div>` : ''}
        <div style="background:#fff;border-radius:4px;border:1px solid var(--border);padding:16px;margin-top:20px">
          <div style="font-size:13px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">Price Details</div>
          <div class="price-summary">
            <div class="summary-row"><span>Items (${cart.totalItems})</span><span>${fmt.price(cart.itemsTotal)}</span></div>
            <div class="summary-row"><span>Delivery</span><span style="color:var(--green)">${cart.shippingCharge === 0 ? 'FREE' : fmt.price(cart.shippingCharge)}</span></div>
            <div class="summary-row total-row"><span>Total Amount</span><span>${fmt.price(cart.totalAmount)}</span></div>
          </div>
        </div>
        <button class="place-order-btn" id="placeOrderBtn">
          ${payMethod === 'cod' ? `📦 Place Order — ${fmt.price(cart.totalAmount)}` : `⚡ Pay ${fmt.price(cart.totalAmount)}`}
        </button>
        <div style="text-align:center;margin-top:12px;font-size:12px;color:var(--text-secondary)">🔒 100% secure &amp; encrypted checkout</div>
      </div>
    </div>
  </div>

  <!-- Right summary -->
  <div>
    <div class="card" style="position:sticky;top:72px">
      <div class="card-header" style="font-size:14px;color:var(--text-secondary)">PRICE DETAILS</div>
      <div class="card-body price-summary">
        <div class="summary-row"><span>Price (${cart.totalItems} items)</span><span>${fmt.price(cart.itemsTotal)}</span></div>
        <div class="summary-row"><span>Discount</span><span style="color:var(--green)">−${fmt.price(cart.items.reduce((a, i) => a + (i.originalPrice - i.price) * i.quantity, 0))}</span></div>
        <div class="summary-row"><span>Delivery Charges</span><span style="color:var(--green)">${cart.shippingCharge === 0 ? 'FREE' : fmt.price(cart.shippingCharge)}</span></div>
        <div class="summary-row total-row"><span>Total Amount</span><span>${fmt.price(cart.totalAmount)}</span></div>
        <div style="color:var(--green);font-size:13px;font-weight:600;margin-top:8px">You will save ${fmt.price(cart.items.reduce((a, i) => a + (i.originalPrice - i.price) * i.quantity, 0))} on this order!</div>
      </div>
    </div>
    <div style="background:#fff;border-radius:2px;padding:12px;margin-top:12px;font-size:12px;color:var(--text-secondary);text-align:center">
      Safe and Secure Payments. Easy returns.<br/>100% Authentic products.
    </div>
  </div>`;

  // Attach all event listeners after rendering
  attachCheckoutEvents();
}

function attachCheckoutEvents() {
  // Step header toggles
  document.getElementById('stepHeader1')?.addEventListener('click', () => toggleStep(1));
  document.getElementById('stepHeader2')?.addEventListener('click', () => toggleStep(2));

  // Address card selection
  document.querySelectorAll('[data-addr-id]').forEach(card => {
    card.addEventListener('click', () => selectAddr(card.dataset.addrId));
  });

  // Toggle address form
  document.getElementById('toggleAddrBtn')?.addEventListener('click', toggleAddrForm);
  document.getElementById('cancelAddrBtn')?.addEventListener('click', toggleAddrForm);

  // Save address
  document.getElementById('saveAddrBtn')?.addEventListener('click', saveAddress);

  // Proceed to payment
  document.getElementById('proceedToPayBtn')?.addEventListener('click', () => toggleStep(2));

  // Payment method options
  document.querySelectorAll('[data-pay-method]').forEach(el => {
    el.addEventListener('click', () => selectPay(el.dataset.payMethod));
  });

  // Place order
  document.getElementById('placeOrderBtn')?.addEventListener('click', placeOrder);
}

function renderPayOption(val, icon, title, sub) {
  return `<div class="payment-option ${payMethod === val ? 'selected' : ''}" data-pay-method="${val}">
    <input type="radio" name="payMethod" ${payMethod === val ? 'checked' : ''}/>
    <span class="pay-method-icon">${icon}</span>
    <div><div style="font-weight:600;font-size:14px">${title}</div><div style="font-size:12px;color:var(--text-secondary)">${sub}</div></div>
  </div>`;
}

function selectPay(val) { payMethod = val; render(); }

function toggleStep(n) {
  const b = document.getElementById('step' + n + 'Body');
  if (b) b.classList.toggle('open');
}

function toggleAddrForm() {
  const f = document.getElementById('addrForm');
  if (!f) return;
  f.style.display = f.style.display === 'block' ? 'none' : 'block';
  if (f.style.display === 'block') {
    document.getElementById('aName')?.focus();
  }
}

function selectAddr(id) {
  selectedAddr = user.addresses.find(a => a._id === id);
  render();
}

async function saveAddress() {
  const body = {
    name:         document.getElementById('aName').value.trim(),
    phone:        document.getElementById('aPhone').value.trim(),
    addressLine1: document.getElementById('aLine1').value.trim(),
    addressLine2: document.getElementById('aLine2').value.trim(),
    city:         document.getElementById('aCity').value.trim(),
    state:        document.getElementById('aState').value.trim(),
    pincode:      document.getElementById('aPin').value.trim(),
    type:         document.getElementById('aType').value,
  };

  if (!body.name || !body.phone || !body.addressLine1 || !body.city || !body.state || !body.pincode) {
    showToast('Please fill all required fields (*)', 'error');
    return;
  }

  const btn = document.getElementById('saveAddrBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

  const res = await AuthAPI.addAddress(body);
  if (res?.ok) {
    // Backend now returns full user object
    user = res.data.user;
    selectedAddr = user.addresses[user.addresses.length - 1];
    showToast('Address saved! ✅');
    render();
  } else {
    showToast(res?.data?.message || 'Failed to save address', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Save & Deliver Here'; }
  }
}

async function placeOrder() {
  if (!selectedAddr) {
    showToast('Please select a delivery address', 'error');
    toggleStep(1);
    return;
  }
  const btn = document.getElementById('placeOrderBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }

  const shippingAddress = {
    name:         selectedAddr.name,
    phone:        selectedAddr.phone,
    addressLine1: selectedAddr.addressLine1,
    addressLine2: selectedAddr.addressLine2 || '',
    city:         selectedAddr.city,
    state:        selectedAddr.state,
    pincode:      selectedAddr.pincode,
  };

  if (payMethod === 'razorpay') {
    await handleRazorpay(btn, shippingAddress);
  } else {
    const res = await OrderAPI.create({ shippingAddress, paymentMethod: 'COD' });
    if (res?.ok) {
      showToast('Order placed! 🎉');
      setTimeout(() => window.location.href = '/pages/order-success.html?id=' + res.data.order._id, 700);
    } else {
      showToast(res?.data?.message || 'Order failed', 'error');
      if (btn) { btn.disabled = false; btn.textContent = `📦 Place Order — ${fmt.price(cart.totalAmount)}`; }
    }
  }
}

async function handleRazorpay(btn, shippingAddress) {
  const rpRes = await OrderAPI.createRazorpayOrder(cart.totalAmount);
  if (!rpRes?.ok) {
    showToast(rpRes?.data?.message || 'Payment init failed', 'error');
    if (btn) { btn.disabled = false; btn.textContent = `⚡ Pay ${fmt.price(cart.totalAmount)}`; }
    return;
  }
  const options = {
    key:         rpRes.data.keyId,
    amount:      rpRes.data.amount,
    currency:    'INR',
    name:        'SmartCart',
    description: 'Order Payment',
    order_id:    rpRes.data.orderId,
    prefill:     { name: user.name, email: user.email, contact: user.phone || '' },
    theme:       { color: '#2874f0' },
    handler: async function (response) {
      const res = await OrderAPI.create({
        shippingAddress,
        paymentMethod:      'Razorpay',
        razorpayOrderId:    rpRes.data.orderId,
        razorpayPaymentId:  response.razorpay_payment_id,
        razorpaySignature:  response.razorpay_signature,
      });
      if (res?.ok) {
        showToast('Payment successful! 🎉');
        setTimeout(() => window.location.href = '/pages/order-success.html?id=' + res.data.order._id, 700);
      } else {
        showToast(res?.data?.message || 'Order creation failed', 'error');
      }
    },
    modal: {
      ondismiss: function () {
        if (btn) { btn.disabled = false; btn.textContent = `⚡ Pay ${fmt.price(cart.totalAmount)}`; }
      },
    },
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

document.addEventListener('DOMContentLoaded', loadCheckout);
