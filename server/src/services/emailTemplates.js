import fs from 'fs';
import path from 'path';

function loadTemplate(filename) {
  // Try server/email, process.cwd()/email, or relative to src/services
  const pathsToTry = [
    path.resolve(process.cwd(), 'email', filename),
    path.resolve(process.cwd(), 'server', 'email', filename),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'email', filename),
  ];

  for (const p of pathsToTry) {
    // Sanitize path for Windows if file URL path formatting leads to leading slash
    const cleanPath = p.replace(/^\/([A-Z]:)/, '$1');
    if (fs.existsSync(cleanPath)) {
      return fs.readFileSync(cleanPath, 'utf8');
    }
  }
  return '';
}

function formatCurrency(amount, currency = 'INR') {
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency + ' ';
  return `${symbol}${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function buildOrderConfirmationEmail({ store_name = 'Acme Store', customer_name, order }) {
  const subject = `Order #${order.id} confirmed — ${store_name}`;
  const title = store_name;

  let html = loadTemplate('order-confirmation.html');
  if (html) {
    // Remove preview bar if present
    html = html.replace(/<div class="preview-bar">[\s\S]*?<\/div>/i, '');
    
    // Build summary rows
    const itemsRows = (order.items || []).map(item => `
      <tr>
        <td>${item.quantity}</td>
        <td>${item.product_name || item.name}</td>
        <td class="right">${formatCurrency(item.price * item.quantity, order.currency)}</td>
      </tr>
    `).join('');

    const subtotalRow = `<tr><td></td><td>Subtotal</td><td class="right">${formatCurrency(order.subtotal, order.currency)}</td></tr>`;
    const shippingRow = Number(order.shipping_fee) ? `<tr><td></td><td>Shipping</td><td class="right">${formatCurrency(order.shipping_fee, order.currency)}</td></tr>` : '';
    const taxRow = Number(order.tax_amount || order.tax_fee) ? `<tr><td></td><td>Tax</td><td class="right">${formatCurrency(order.tax_amount || order.tax_fee, order.currency)}</td></tr>` : '';
    const discountRow = Number(order.discount_amount || order.discount) ? `<tr><td></td><td>Discount</td><td class="right">-${formatCurrency(order.discount_amount || order.discount, order.currency)}</td></tr>` : '';
    const totalRow = `<tr class="total-row"><td></td><td>Total</td><td class="right">${formatCurrency(order.total, order.currency)}</td></tr>`;

    const summaryTableBody = itemsRows + subtotalRow + shippingRow + taxRow + discountRow + totalRow;

    // Replace table tbody
    html = html.replace(/<tbody>[\s\S]*?<\/tbody>/i, `<tbody>${summaryTableBody}</tbody>`);

    // Shipping address
    const shippingAddr = order.shipping_address ? (
      typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address
    ) : {};
    const addrText = `
      <div class="label">Shipping to</div>
      ${shippingAddr.full_name || customer_name}<br />
      ${shippingAddr.address_line1 || ''}${shippingAddr.address_line2 ? ', ' + shippingAddr.address_line2 : ''}<br />
      ${shippingAddr.city || ''}${shippingAddr.state ? ', ' + shippingAddr.state : ''} ${shippingAddr.postal_code || ''}${shippingAddr.country ? ', ' + shippingAddr.country : ''}
    `;
    html = html.replace(/<div class="address-box">[\s\S]*?<\/div>/i, `<div class="address-box">${addrText}</div>`);

    // Customer name & Store name
    html = html.replace(/Rahul Sharma/g, customer_name);
    html = html.replace(/Acme Store/g, store_name);
    html = html.replace(/#10234/g, `#${order.id}`);

    // ETA
    if (order.estimated_delivery) {
      html = html.replace(/<div class="eta">[\s\S]*?<\/div>/i, `<div class="eta">🚚 Estimated delivery: <strong>${formatDate(order.estimated_delivery)}</strong></div>`);
    }

    return { subject, title, bodyHtml: html };
  }

  return { subject, title, bodyHtml: `<p>Thank you for your order #${order.id}, ${customer_name}!</p>` };
}

export function buildShipmentCreatedEmail({ store_name = 'Acme Store', customer_name, order, shipment }) {
  const subject = `Your order #${order.id} has been shipped!`;
  const title = store_name;

  let html = loadTemplate('shipment-created.html');
  if (html) {
    html = html.replace(/<div class="preview-bar">[\s\S]*?<\/div>/i, '');
    html = html.replace(/Rahul Sharma/g, customer_name);
    html = html.replace(/Acme Store/g, store_name);
    html = html.replace(/#10234/g, `#${order.id}`);
    if (shipment.carrier) html = html.replace(/Express Courier/g, shipment.carrier);
    if (shipment.tracking_number) html = html.replace(/EXP-987654321-IN/g, shipment.tracking_number);
    if (shipment.estimated_delivery) html = html.replace(/Aug 14, 2026/g, formatDate(shipment.estimated_delivery));
    if (shipment.tracking_url) html = html.replace(/href="#"/g, `href="${shipment.tracking_url}"`);
    return { subject, title, bodyHtml: html };
  }

  return { subject, title, bodyHtml: `<p>Your order #${order.id} has been shipped!</p>` };
}

export function buildInTransitEmail({ store_name = 'Acme Store', customer_name, order, event }) {
  const subject = `Your order #${order.id} is on the move`;
  const title = store_name;

  let html = loadTemplate('in-transit.html');
  if (html) {
    html = html.replace(/<div class="preview-bar">[\s\S]*?<\/div>/i, '');
    html = html.replace(/Rahul Sharma/g, customer_name);
    html = html.replace(/Acme Store/g, store_name);
    html = html.replace(/#10234/g, `#${order.id}`);
    if (event.description || event.event) html = html.replace(/Arrived at regional sorting facility/g, event.description || event.event);
    if (event.location) html = html.replace(/Bengaluru Hub, KA/g, event.location);
    if (event.timestamp) html = html.replace(/Aug 11, 2026 · 09:15 AM/g, formatDate(event.timestamp));
    return { subject, title, bodyHtml: html };
  }

  return { subject, title, bodyHtml: `<p>Your order #${order.id} is in transit.</p>` };
}

export function buildOutForDeliveryEmail({ store_name = 'Acme Store', customer_name, order, shipment }) {
  const subject = `Out for delivery — order #${order.id} arrives today`;
  const title = store_name;

  let html = loadTemplate('out-for-delivery.html');
  if (html) {
    html = html.replace(/<div class="preview-bar">[\s\S]*?<\/div>/i, '');
    html = html.replace(/Rahul Sharma/g, customer_name);
    html = html.replace(/Acme Store/g, store_name);
    html = html.replace(/#10234/g, `#${order.id}`);
    if (shipment.carrier) html = html.replace(/Express Courier/g, shipment.carrier);
    if (shipment.tracking_number) html = html.replace(/EXP-987654321-IN/g, shipment.tracking_number);
    return { subject, title, bodyHtml: html };
  }

  return { subject, title, bodyHtml: `<p>Your order #${order.id} is out for delivery today!</p>` };
}

export function buildDeliveredEmail({ store_name = 'Acme Store', customer_name, order, delivered_date }) {
  const subject = `Your order #${order.id} has been delivered 🎉`;
  const title = store_name;

  let html = loadTemplate('delivered.html');
  if (html) {
    html = html.replace(/<div class="preview-bar">[\s\S]*?<\/div>/i, '');
    html = html.replace(/Rahul Sharma/g, customer_name);
    html = html.replace(/Acme Store/g, store_name);
    html = html.replace(/#10234/g, `#${order.id}`);
    if (delivered_date) html = html.replace(/Aug 12, 2026/g, formatDate(delivered_date));
    return { subject, title, bodyHtml: html };
  }

  return { subject, title, bodyHtml: `<p>Your order #${order.id} has been delivered!</p>` };
}

export function buildDeliveryExceptionEmail({ store_name = 'Acme Store', customer_name, order, exception_reason, new_eta }) {
  const subject = `Update on your order #${order.id} — delayed`;
  const title = store_name;

  let html = loadTemplate('delivery-exception.html');
  if (html) {
    html = html.replace(/<div class="preview-bar">[\s\S]*?<\/div>/i, '');
    html = html.replace(/Rahul Sharma/g, customer_name);
    html = html.replace(/Acme Store/g, store_name);
    html = html.replace(/#10234/g, `#${order.id}`);
    if (exception_reason) html = html.replace(/Severe weather condition in transit region causing 1–2 days delay\./g, exception_reason);
    if (new_eta) html = html.replace(/Aug 14, 2026/g, formatDate(new_eta));
    return { subject, title, bodyHtml: html };
  }

  return { subject, title, bodyHtml: `<p>There is an update / delay with your order #${order.id}.</p>` };
}

export function buildPaymentReceiptEmail({ store_name = 'Acme Store', customer_name, order, payment }) {
  const subject = `Payment confirmed — order #${order.id}`;
  const title = store_name;

  let html = loadTemplate('payment-receipt.html');
  if (html) {
    html = html.replace(/<div class="preview-bar">[\s\S]*?<\/div>/i, '');
    html = html.replace(/Rahul Sharma/g, customer_name);
    html = html.replace(/Acme Store/g, store_name);
    html = html.replace(/10234/g, order.id);
    if (payment.amount || order.total) html = html.replace(/₹10,292/g, formatCurrency(payment.amount || order.total, order.currency));
    if (payment.gateway) html = html.replace(/Razorpay · UPI •••• 2741/g, payment.gateway);
    if (payment.transaction_id || payment.txn_id) html = html.replace(/pay_ABC123XYZ789/g, payment.transaction_id || payment.txn_id);
    if (payment.created_at) html = html.replace(/Aug 10, 2026 · 3:28 PM IST/g, formatDate(payment.created_at));
    return { subject, title, bodyHtml: html };
  }

  return { subject, title, bodyHtml: `<p>Payment receipt for order #${order.id}.</p>` };
}

export function buildPaymentFailedEmail({ store_name = 'Acme Store', customer_name, order, failure_reason }) {
  const subject = `Payment failed — order #${order.id}`;
  const title = store_name;

  let html = loadTemplate('payment-failed.html');
  if (html) {
    html = html.replace(/<div class="preview-bar">[\s\S]*?<\/div>/i, '');
    html = html.replace(/Rahul Sharma/g, customer_name);
    html = html.replace(/Acme Store/g, store_name);
    html = html.replace(/#10234/g, `#${order.id}`);
    if (failure_reason) html = html.replace(/Card payment declined by issuing bank \(Insufficient funds\)/g, failure_reason);
    return { subject, title, bodyHtml: html };
  }

  return { subject, title, bodyHtml: `<p>Payment failed for order #${order.id}.</p>` };
}

export function buildRefundProcessedEmail({ store_name = 'Acme Store', customer_name, order, refund }) {
  const subject = `Refund processed for order #${order.id}`;
  const title = store_name;

  let html = loadTemplate('refund-processed.html');
  if (html) {
    html = html.replace(/<div class="preview-bar">[\s\S]*?<\/div>/i, '');
    html = html.replace(/Rahul Sharma/g, customer_name);
    html = html.replace(/Acme Store/g, store_name);
    html = html.replace(/#10234/g, `#${order.id}`);
    if (refund.amount || order.total) html = html.replace(/₹10,292/g, formatCurrency(refund.amount || order.total, order.currency));
    if (refund.gateway) html = html.replace(/Razorpay/g, refund.gateway);
    if (refund.created_at) html = html.replace(/Aug 11, 2026/g, formatDate(refund.created_at));
    return { subject, title, bodyHtml: html };
  }

  return { subject, title, bodyHtml: `<p>Refund processed for order #${order.id}.</p>` };
}

export function buildOrderCancelledEmail({ store_name = 'Acme Store', customer_name, order }) {
  const subject = `Order #${order.id} cancelled`;
  const title = store_name;

  let html = loadTemplate('order-cancelled.html');
  if (html) {
    html = html.replace(/<div class="preview-bar">[\s\S]*?<\/div>/i, '');
    html = html.replace(/Rahul Sharma/g, customer_name);
    html = html.replace(/Acme Store/g, store_name);
    html = html.replace(/#10234/g, `#${order.id}`);
    if (order.total) html = html.replace(/₹10,292/g, formatCurrency(order.total, order.currency));
    return { subject, title, bodyHtml: html };
  }

  return { subject, title, bodyHtml: `<p>Order #${order.id} cancelled.</p>` };
}

export function buildAdminPaymentAlertEmail({ store_name = 'Acme Store', customer_name, email, order, payment }) {
  const subject = `[Admin] Payment received — order #${order.id}`;
  const title = `${store_name} — Admin`;

  let html = loadTemplate('admin-payment-alert.html');
  if (html) {
    html = html.replace(/<div class="preview-bar">[\s\S]*?<\/div>/i, '');
    html = html.replace(/Rahul Sharma/g, customer_name);
    html = html.replace(/rahul@example\.com/g, email);
    html = html.replace(/Acme Store/g, store_name);
    html = html.replace(/#10234/g, `#${order.id}`);
    if (payment.amount || order.total) html = html.replace(/₹10,292/g, formatCurrency(payment.amount || order.total, order.currency));
    if (payment.gateway) html = html.replace(/Razorpay · UPI/g, payment.gateway);
    if (payment.transaction_id || payment.txn_id) html = html.replace(/pay_ABC123XYZ789/g, payment.transaction_id || payment.txn_id);
    return { subject, title, bodyHtml: html };
  }

  return { subject, title, bodyHtml: `<p>Admin payment alert for order #${order.id}.</p>` };
}