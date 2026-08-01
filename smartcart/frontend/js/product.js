/* SmartCart – Product Detail Page Logic */

const productId = new URLSearchParams(window.location.search).get('id');
if (!productId) window.location.href = '/pages/products.html';
let product = null;

async function loadProduct() {
  const res = await ProductAPI.getOne(productId);
  if (!res?.ok) {
    document.getElementById('productContent').innerHTML = '<div class="empty-state"><div class="empty-icon">😕</div><h3>Product not found</h3><a href="/pages/products.html" class="btn btn-primary" style="margin-top:16px">Browse Products</a></div>';
    return;
  }
  product = res.data.product;
  const isInWishlist = wishlistSet.has(product._id);
  const discount = product.originalPrice > product.price
    ? Math.round((product.originalPrice - product.price) / product.originalPrice * 100)
    : 0;
  document.title = `${product.name} — SmartCart`;

  document.getElementById('breadcrumb').innerHTML =
    `<a href="/index.html">Home</a><span class="sep">›</span><a href="/pages/products.html?category=${product.category}">${product.category}</a><span class="sep">›</span><span>${product.name.slice(0, 40)}${product.name.length > 40 ? '...' : ''}</span>`;

  const avgRatings = [5, 4, 3, 2, 1].map(n => ({
    star: n,
    count: product.reviews?.filter(r => Math.round(r.rating) === n).length || 0,
  }));

  // Build specifications table
  let specsHtml = '';
  if (product.specifications && product.specifications instanceof Object) {
    const entries = product.specifications instanceof Map
      ? [...product.specifications.entries()]
      : Object.entries(product.specifications);
    if (entries.length > 0) {
      specsHtml = `
      <div style="margin-top:20px">
        <div style="font-size:16px;font-weight:700;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)">Specifications</div>
        <table class="spec-table">
          ${entries.map(([k, v], i) => `<tr ${i % 2 === 1 ? 'style="background:var(--bg)"' : ''}><td>${k}</td><td style="font-weight:500">${v}</td></tr>`).join('')}
        </table>
      </div>`;
    }
  }

  // Build highlights
  let highlightsHtml = '';
  if (product.highlights?.length) {
    highlightsHtml = `
    <div style="margin:16px 0">
      <div style="font-size:14px;font-weight:700;margin-bottom:8px">Highlights</div>
      <ul style="padding-left:18px;margin:0">
        ${product.highlights.map(h => `<li style="font-size:13px;color:var(--text);margin-bottom:4px">${h}</li>`).join('')}
      </ul>
    </div>`;
  }

  document.getElementById('productContent').innerHTML = `
  <div class="product-detail-layout">
    <div class="product-images">
      <div class="main-image"><img id="mainImg" src="${product.images[0] || 'https://via.placeholder.com/300?text=No+Image'}" alt="${product.name}"/></div>
      <div class="thumbnails">
        ${product.images.map((img, i) => `<div class="thumb ${i === 0 ? 'active' : ''}" data-url="${img}"><img src="${img}" alt="img"/></div>`).join('')}
      </div>
      <div style="display:flex;gap:12px;margin-top:20px">
        <button class="btn btn-primary btn-lg" style="flex:1" id="addCartBtn">🛒 Add to Cart</button>
        <button class="btn btn-secondary btn-lg" style="flex:1" id="buyNowBtn">⚡ Buy Now</button>
      </div>
      <div style="margin-top:12px;text-align:center">
        <button class="btn btn-outline btn-sm" id="wishBtn" style="gap:6px">
          ${isInWishlist ? '❤️ Wishlisted' : '🤍 Add to Wishlist'}
        </button>
      </div>
    </div>
    <div class="product-info-panel">
      <h1 class="product-detail-name">${product.name}</h1>
      <div class="product-detail-rating">
        ${product.rating > 0
          ? `<span class="rating-badge">${product.rating.toFixed(1)} ★</span><span style="color:var(--text-secondary);font-size:13px">${(product.numReviews || 0).toLocaleString('en-IN')} ratings</span>`
          : '<span style="color:var(--text-secondary);font-size:13px">No ratings yet</span>'}
        <span style="color:var(--border)">|</span>
        <span class="stock-badge ${product.stock > 0 ? 'stock-in' : 'stock-out'}">${product.stock > 0 ? '● In Stock' : '● Out of Stock'}</span>
      </div>
      ${product.stock > 0 && product.stock < 10 ? `<div style="color:var(--red);font-size:13px;margin:-8px 0 12px">⚠ Only ${product.stock} left!</div>` : ''}
      <div class="price-box">
        <span class="price-main">${fmt.price(product.price)}</span>
        ${discount > 0 ? `<span class="price-strike">${fmt.price(product.originalPrice)}</span><span class="price-off">${discount}% off</span>` : ''}
      </div>
      <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:4px;padding:12px;margin:16px 0">
        <div style="font-size:14px;font-weight:700;color:#f57c00;margin-bottom:8px">Available Offers</div>
        <ul class="offer-list">
          <li><strong>Bank Offer</strong> 10% off on HDFC Bank Credit/Debit Cards</li>
          <li><strong>Special Price</strong> Get extra ${discount > 5 ? discount : 5}% off (price inclusive of discount)</li>
          ${product.price >= 500 ? '<li><strong>Free Delivery</strong> On this order</li>' : ''}
          <li><strong>No Cost EMI</strong> Available on select cards</li>
        </ul>
      </div>
      <div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">Delivery</div>
        <div class="pincode-row">
          <input type="text" id="pinInput" placeholder="Enter Pincode" maxlength="6"/>
          <button id="checkDeliveryBtn">Check</button>
        </div>
        <div id="deliveryInfo" style="font-size:13px;color:var(--green)">
          ✅ Free Delivery by ${getDeliveryDate(product.deliveryDays || 5)}
        </div>
      </div>
      <div style="margin:20px 0">
        <div class="spec-table-wrap">
          <table style="width:100%;font-size:14px;margin-bottom:0">
            <tr><td style="padding:8px 12px;color:var(--text-secondary);width:120px">Seller</td><td style="padding:8px 12px;font-weight:600;color:var(--primary)">${product.seller || 'SmartCart Official'}</td></tr>
            <tr style="background:var(--bg)"><td style="padding:8px 12px;color:var(--text-secondary)">Brand</td><td style="padding:8px 12px">${product.brand}</td></tr>
            <tr><td style="padding:8px 12px;color:var(--text-secondary)">Category</td><td style="padding:8px 12px">${product.category}</td></tr>
            ${product.warranty ? `<tr style="background:var(--bg)"><td style="padding:8px 12px;color:var(--text-secondary)">Warranty</td><td style="padding:8px 12px">${product.warranty}</td></tr>` : ''}
          </table>
        </div>
      </div>
      ${highlightsHtml}
      <div>
        <div style="font-size:16px;font-weight:700;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)">Description</div>
        <p style="font-size:14px;color:#555;line-height:1.8">${product.description}</p>
      </div>
      ${specsHtml}
    </div>
  </div>

  <!-- Reviews -->
  <div style="background:#fff;border-radius:var(--radius);box-shadow:var(--shadow);padding:24px;margin-top:12px">
    <div style="font-size:20px;font-weight:700;margin-bottom:20px">Ratings &amp; Reviews</div>
    <div class="rating-overview">
      <div style="text-align:center">
        <div class="rating-big">${(product.rating || 0).toFixed(1)}</div>
        <div style="color:var(--text-secondary);font-size:13px;margin-top:4px">out of 5</div>
      </div>
      <div class="rating-bars">
        ${avgRatings.map(r => `
        <div class="rating-bar-row">
          <span style="min-width:12px">${r.star}</span><span>★</span>
          <div class="rating-bar"><div class="rating-bar-fill" style="width:${product.numReviews ? (r.count / product.numReviews * 100) : 0}%"></div></div>
          <span style="min-width:24px">${r.count}</span>
        </div>`).join('')}
      </div>
    </div>
    ${Auth.isLoggedIn() ? `
    <div style="border:1px solid var(--border);border-radius:4px;padding:20px;margin-bottom:20px">
      <div style="font-size:16px;font-weight:700;margin-bottom:16px">Write a Review</div>
      <div class="form-group">
        <label class="form-label">Your Rating</label>
        <div id="starPicker" style="display:flex;gap:4px;font-size:28px;cursor:pointer">
          ${[1, 2, 3, 4, 5].map(n => `<span data-val="${n}" id="star-${n}" style="color:#ddd;transition:color 0.1s">★</span>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Your Comment</label>
        <textarea class="form-control" id="reviewComment" rows="3" placeholder="Share your experience with this product..."></textarea>
      </div>
      <button class="btn btn-primary" id="submitReviewBtn">Submit Review</button>
    </div>` : `<div style="padding:16px;background:var(--bg);border-radius:4px;margin-bottom:20px;font-size:14px;color:var(--text-secondary)"><a href="/pages/login.html" style="color:var(--primary);font-weight:600">Login</a> to write a review</div>`}
    <div id="reviewsList">
      ${product.reviews?.length ? product.reviews.slice().reverse().map(r => `
      <div class="review-card">
        <div class="review-header">
          <span class="rating-badge${r.rating >= 4 ? '' : r.rating >= 3 ? ' low' : ' poor'}">${r.rating}★</span>
          <span class="review-name">${r.user?.name || r.name || 'User'}</span>
          <span class="review-date">${fmt.date(r.createdAt)}</span>
        </div>
        <p class="review-text">${r.comment}</p>
      </div>`).join('') : '<div class="empty-state" style="padding:32px"><div class="empty-icon" style="font-size:40px">💬</div><h3>No reviews yet</h3><p>Be the first to review this product!</p></div>'}
    </div>
  </div>`;

  // Attach event listeners (no inline onclick needed)
  attachProductEvents();

  // Load related products
  const relRes = await ProductAPI.getAll({ category: product.category, limit: 10 });
  if (relRes?.ok && relRes.data.products?.length > 1) {
    const related = relRes.data.products.filter(p => p._id !== productId);
    if (related.length) {
      document.getElementById('relatedSection').style.display = '';
      document.getElementById('relatedProducts').innerHTML = related.map(p => buildProductCard(p)).join('');
    }
  }
}

function attachProductEvents() {
  // Thumbnail clicks
  document.querySelectorAll('.thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      document.getElementById('mainImg').src = thumb.dataset.url;
    });
  });

  // Add to Cart
  document.getElementById('addCartBtn')?.addEventListener('click', addToCartDirect);

  // Buy Now
  document.getElementById('buyNowBtn')?.addEventListener('click', buyNow);

  // Wishlist
  document.getElementById('wishBtn')?.addEventListener('click', toggleWishDirect);

  // Delivery check
  document.getElementById('checkDeliveryBtn')?.addEventListener('click', checkDelivery);

  // Star rating picker
  let selectedRating = 0;
  document.querySelectorAll('#starPicker span').forEach(star => {
    const val = parseInt(star.dataset.val);
    star.addEventListener('mouseover', () => {
      document.querySelectorAll('#starPicker span').forEach((s, i) => s.style.color = i < val ? '#ffe500' : '#ddd');
    });
    star.addEventListener('mouseout', () => {
      document.querySelectorAll('#starPicker span').forEach((s, i) => s.style.color = i < selectedRating ? '#ffe500' : '#ddd');
    });
    star.addEventListener('click', () => {
      selectedRating = val;
      document.querySelectorAll('#starPicker span').forEach((s, i) => s.style.color = i < selectedRating ? '#ffe500' : '#ddd');
    });
  });

  // Submit review
  document.getElementById('submitReviewBtn')?.addEventListener('click', async () => {
    if (!selectedRating) { showToast('Please select a rating', 'error'); return; }
    const comment = document.getElementById('reviewComment')?.value.trim();
    if (!comment) { showToast('Please write a comment', 'error'); return; }
    const res = await ProductAPI.addReview(productId, { rating: selectedRating, comment });
    if (res?.ok) { showToast('Review submitted! ✨'); setTimeout(() => location.reload(), 1000); }
    else showToast(res?.data?.message || 'Failed to submit review', 'error');
  });
}

async function addToCartDirect() {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/pages/login.html?redirect=' + encodeURIComponent(window.location.href);
    return;
  }
  const btn = document.getElementById('addCartBtn');
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = 'Adding...';
  const res = await CartAPI.add(productId);
  if (res?.ok) {
    showToast('Added to Cart! 🛒');
    updateCartBadge();
    btn.textContent = '✓ Added to Cart';
    setTimeout(() => { btn.disabled = false; btn.innerHTML = '🛒 Add to Cart'; }, 2000);
  } else {
    showToast(res?.data?.message || 'Failed', 'error');
    btn.disabled = false;
    btn.innerHTML = '🛒 Add to Cart';
  }
}

async function buyNow() {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/pages/login.html?redirect=' + encodeURIComponent(window.location.href);
    return;
  }
  const res = await CartAPI.add(productId);
  if (res?.ok) window.location.href = '/pages/checkout.html';
  else showToast(res?.data?.message || 'Failed', 'error');
}

async function toggleWishDirect() {
  if (!Auth.isLoggedIn()) { window.location.href = '/pages/login.html'; return; }
  const res = await AuthAPI.toggleWishlist(productId);
  if (res?.ok) {
    const btn = document.getElementById('wishBtn');
    const added = res.data.added;
    if (added) { wishlistSet.add(productId); btn.textContent = '❤️ Wishlisted'; showToast('Added to Wishlist ❤️'); }
    else { wishlistSet.delete(productId); btn.textContent = '🤍 Add to Wishlist'; showToast('Removed from Wishlist'); }
  }
}

function checkDelivery() {
  const pin = document.getElementById('pinInput')?.value;
  if (!/^\d{6}$/.test(pin)) { showToast('Enter a valid 6-digit pincode', 'error'); return; }
  const days = Math.floor(Math.random() * 3) + 2;
  document.getElementById('deliveryInfo').innerHTML =
    `✅ Delivery by <strong>${getDeliveryDate(days)}</strong> for pincode ${pin}`;
}

document.addEventListener('DOMContentLoaded', loadProduct);
