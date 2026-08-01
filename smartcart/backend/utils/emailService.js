const nodemailer = require('nodemailer');

// ── Transporter ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
  port:   Number(process.env.EMAIL_PORT) || 587,
  secure: false,                  // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Shared Helpers ────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const statusBadge = (status) => {
  const map = {
    pending:    { bg: '#f59e0b', label: 'Pending' },
    confirmed:  { bg: '#3b82f6', label: 'Confirmed' },
    processing: { bg: '#8b5cf6', label: 'Processing' },
    shipped:    { bg: '#06b6d4', label: 'Shipped' },
    delivered:  { bg: '#10b981', label: 'Delivered' },
    cancelled:  { bg: '#ef4444', label: 'Cancelled' },
  };
  const s = map[status] || { bg: '#6b7280', label: status };
  return `<span style="background:${s.bg};color:#fff;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${s.label}</span>`;
};

// ── Base Email Shell ──────────────────────────────────────────────────────────
const shell = ({ preheader, body }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>SmartCart</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;}
    a{color:#6366f1;text-decoration:none;}
    .wrap{max-width:620px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}
    .header{background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:36px 40px;text-align:center;}
    .header img{width:44px;margin-bottom:12px;}
    .header h1{color:#fff;font-size:26px;font-weight:700;letter-spacing:-0.5px;}
    .header p{color:rgba(255,255,255,.8);font-size:14px;margin-top:4px;}
    .content{padding:36px 40px;}
    .greeting{font-size:18px;font-weight:600;margin-bottom:8px;}
    .sub{color:#64748b;font-size:14px;margin-bottom:28px;line-height:1.6;}
    .info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:24px;}
    .info-box h3{font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:14px;}
    .info-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:14px;}
    .info-row:last-child{border-bottom:none;}
    .info-row .label{color:#64748b;}
    .info-row .value{font-weight:600;color:#1e293b;}
    table.items{width:100%;border-collapse:collapse;margin-bottom:24px;}
    table.items th{background:#f8fafc;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;padding:10px 14px;text-align:left;}
    table.items td{padding:12px 14px;border-bottom:1px solid #f1f5f9;font-size:14px;vertical-align:middle;}
    table.items tr:last-child td{border-bottom:none;}
    .totals{background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:24px;}
    .total-row{display:flex;justify-content:space-between;font-size:14px;padding:4px 0;color:#475569;}
    .total-row.grand{border-top:2px solid #e2e8f0;margin-top:8px;padding-top:10px;font-size:16px;font-weight:700;color:#1e293b;}
    .address-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;font-size:14px;line-height:1.7;margin-bottom:24px;}
    .address-box strong{display:block;margin-bottom:4px;font-size:15px;}
    .cta{text-align:center;margin:28px 0;}
    .btn{display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff!important;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:600;letter-spacing:.3px;box-shadow:0 4px 14px rgba(99,102,241,.35);}
    .divider{height:1px;background:#f1f5f9;margin:24px 0;}
    .footer{background:#f8fafc;padding:24px 40px;text-align:center;font-size:12px;color:#94a3b8;line-height:1.6;}
    .footer strong{color:#64748b;}
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <div class="wrap">
    <div class="header">
      <h1>🛒 SmartCart</h1>
      <p>Your Smart Shopping Partner</p>
    </div>
    <div class="content">${body}</div>
    <div class="footer">
      <strong>SmartCart</strong><br/>
      You're receiving this email because you placed an order on SmartCart.<br/>
      Need help? Contact us at <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>
    </div>
  </div>
</body>
</html>`;

// ── Build Items Table ─────────────────────────────────────────────────────────
const itemsTable = (items) => `
<table class="items">
  <thead>
    <tr>
      <th>Product</th>
      <th style="text-align:center;">Qty</th>
      <th style="text-align:right;">Price</th>
      <th style="text-align:right;">Subtotal</th>
    </tr>
  </thead>
  <tbody>
    ${items.map(i => `
    <tr>
      <td><strong>${i.name}</strong></td>
      <td style="text-align:center;">${i.quantity}</td>
      <td style="text-align:right;">${fmt(i.price)}</td>
      <td style="text-align:right;">${fmt(i.price * i.quantity)}</td>
    </tr>`).join('')}
  </tbody>
</table>`;

// ── Build Totals Block ────────────────────────────────────────────────────────
const totalsBlock = (order) => `
<div class="totals">
  <div class="total-row"><span>Items Total</span><span>${fmt(order.itemsPrice)}</span></div>
  <div class="total-row"><span>Shipping</span><span>${order.shippingPrice === 0 ? '<span style="color:#10b981;font-weight:600;">FREE</span>' : fmt(order.shippingPrice)}</span></div>
  <div class="total-row"><span>Tax (18% GST)</span><span>${fmt(order.taxPrice)}</span></div>
  <div class="total-row grand"><span>Total Paid</span><span>${fmt(order.totalPrice)}</span></div>
</div>`;

// ── Build Address Block ───────────────────────────────────────────────────────
const addressBlock = (addr) => `
<div class="address-box">
  <strong>${addr.name}</strong>
  ${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}<br/>
  ${addr.city}, ${addr.state} - ${addr.pincode}<br/>
  📞 ${addr.phone}
</div>`;

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ORDER CONFIRMATION EMAIL
// ═══════════════════════════════════════════════════════════════════════════════
const sendOrderConfirmationEmail = async ({ email, name, order }) => {
  const orderId = order._id.toString().slice(-8).toUpperCase();
  const payLabel = ['razorpay', 'Razorpay'].includes(order.paymentMethod) ? 'Razorpay (Online)' : 'Cash on Delivery';

  const body = `
    <div class="greeting">Hi ${name} 👋</div>
    <p class="sub">
      Thank you for shopping with SmartCart! Your order has been placed successfully 🎉<br/>
      We'll notify you when your order is confirmed and shipped.
    </p>

    <div class="info-box">
      <h3>Order Details</h3>
      <div class="info-row"><span class="label">Order ID</span><span class="value">#${orderId}</span></div>
      <div class="info-row"><span class="label">Date</span><span class="value">${new Date(order.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</span></div>
      <div class="info-row"><span class="label">Payment</span><span class="value">${payLabel}</span></div>
      <div class="info-row"><span class="label">Status</span><span class="value">${statusBadge(order.status)}</span></div>
    </div>

    <h3 style="font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px;">Items Ordered</h3>
    ${itemsTable(order.items)}
    ${totalsBlock(order)}

    <h3 style="font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px;">Delivery Address</h3>
    ${addressBlock(order.shippingAddress)}

    <div class="cta">
      <a class="btn" href="${process.env.FRONTEND_URL}/pages/orders.html">View My Orders</a>
    </div>`;

  await transporter.sendMail({
    from: `"SmartCart" <${process.env.EMAIL_FROM}>`,
    to:   email,
    subject: `✅ Order Confirmed — #${orderId} | SmartCart`,
    html: shell({ preheader: `Your order #${orderId} has been placed successfully! Total: ${fmt(order.totalPrice)}`, body }),
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ORDER CANCELLATION EMAIL
// ═══════════════════════════════════════════════════════════════════════════════
const sendOrderCancellationEmail = async ({ email, name, order }) => {
  const orderId = order._id.toString().slice(-8).toUpperCase();

  const body = `
    <div class="greeting">Hi ${name},</div>
    <p class="sub">
      Your order <strong>#${orderId}</strong> has been cancelled as requested.<br/>
      ${order.cancelReason ? `Reason: <em>${order.cancelReason}</em><br/>` : ''}
      If you paid online, your refund will be processed within 5–7 business days.
    </p>

    <div class="info-box">
      <h3>Cancelled Order</h3>
      <div class="info-row"><span class="label">Order ID</span><span class="value">#${orderId}</span></div>
      <div class="info-row"><span class="label">Cancelled On</span><span class="value">${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</span></div>
      <div class="info-row"><span class="label">Status</span><span class="value">${statusBadge('cancelled')}</span></div>
    </div>

    <h3 style="font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px;">Items in Cancelled Order</h3>
    ${itemsTable(order.items)}
    ${totalsBlock(order)}

    <div class="divider"></div>
    <p style="font-size:14px;color:#64748b;text-align:center;margin-bottom:20px;">Changed your mind? Browse our latest deals and shop again!</p>
    <div class="cta">
      <a class="btn" href="${process.env.FRONTEND_URL}/pages/products.html">Continue Shopping</a>
    </div>`;

  await transporter.sendMail({
    from: `"SmartCart" <${process.env.EMAIL_FROM}>`,
    to:   email,
    subject: `❌ Order Cancelled — #${orderId} | SmartCart`,
    html: shell({ preheader: `Your order #${orderId} has been cancelled. Total refund: ${fmt(order.totalPrice)}`, body }),
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ORDER STATUS UPDATE EMAIL
// ═══════════════════════════════════════════════════════════════════════════════
const sendOrderStatusUpdateEmail = async ({ email, name, order }) => {
  const orderId = order._id.toString().slice(-8).toUpperCase();

  const statusMessages = {
    confirmed:  { icon: '✅', title: 'Order Confirmed!',    msg: 'Your order has been confirmed and is being prepared for processing.' },
    processing: { icon: '⚙️', title: 'Order Processing',    msg: 'Your order is currently being processed. We\'ll ship it soon!' },
    shipped:    { icon: '🚚', title: 'Order Shipped!',       msg: 'Great news! Your order is on its way. Track it using the link below.' },
    delivered:  { icon: '🎉', title: 'Order Delivered!',    msg: 'Your order has been delivered. We hope you love your purchase!' },
    cancelled:  { icon: '❌', title: 'Order Cancelled',     msg: 'Your order has been cancelled. Refund (if applicable) will be processed within 5–7 days.' },
  };

  const { icon, title, msg } = statusMessages[order.status] || { icon: '📦', title: 'Order Update', msg: `Your order status has been updated to ${order.status}.` };

  const body = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:56px;margin-bottom:12px;">${icon}</div>
      <div class="greeting" style="font-size:22px;">${title}</div>
    </div>

    <p class="sub" style="text-align:center;">${msg}</p>

    <div class="info-box">
      <h3>Order Info</h3>
      <div class="info-row"><span class="label">Order ID</span><span class="value">#${orderId}</span></div>
      <div class="info-row"><span class="label">Updated On</span><span class="value">${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</span></div>
      <div class="info-row"><span class="label">Current Status</span><span class="value">${statusBadge(order.status)}</span></div>
      ${order.isDelivered ? `<div class="info-row"><span class="label">Delivered On</span><span class="value">${new Date(order.deliveredAt).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</span></div>` : ''}
    </div>

    <h3 style="font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px;">Your Items</h3>
    ${itemsTable(order.items)}

    <div class="cta">
      <a class="btn" href="${process.env.FRONTEND_URL}/pages/orders.html">Track My Order</a>
    </div>`;

  await transporter.sendMail({
    from: `"SmartCart" <${process.env.EMAIL_FROM}>`,
    to:   email,
    subject: `${icon} ${title} — #${orderId} | SmartCart`,
    html: shell({ preheader: `${msg} Order ID: #${orderId}`, body }),
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. WELCOME / REGISTRATION EMAIL  (bonus — already useful)
// ═══════════════════════════════════════════════════════════════════════════════
const sendWelcomeEmail = async ({ email, name }) => {
  const body = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:56px;margin-bottom:12px;">🎉</div>
      <div class="greeting" style="font-size:22px;">Welcome to SmartCart, ${name}!</div>
    </div>
    <p class="sub" style="text-align:center;">
      Your account has been created successfully.<br/>
      Start exploring thousands of products at the best prices!
    </p>
    <div class="cta">
      <a class="btn" href="${process.env.FRONTEND_URL}">Start Shopping</a>
    </div>`;

  await transporter.sendMail({
    from: `"SmartCart" <${process.env.EMAIL_FROM}>`,
    to:   email,
    subject: '🎉 Welcome to SmartCart — Happy Shopping!',
    html: shell({ preheader: `Welcome ${name}! Your SmartCart account is ready.`, body }),
  });
};

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
  sendOrderStatusUpdateEmail,
  sendWelcomeEmail,
};
