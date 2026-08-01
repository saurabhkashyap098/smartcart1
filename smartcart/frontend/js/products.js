/* SmartCart – Homepage product sections */

document.addEventListener('DOMContentLoaded', async () => {
  await loadHomepage();
});

async function loadHomepage() {
  const container = document.getElementById('products');
  if (!container) return;

  container.innerHTML = '<div class="loading-wrap"><div class="spinner"></div><p>Loading...</p></div>';

  try {
    const [featuredRes, electronicsRes, fashionRes, homeRes, booksRes] = await Promise.all([
      ProductAPI.getAll({ featured: true, limit: 8 }),
      ProductAPI.getAll({ category: 'Electronics', limit: 10 }),
      ProductAPI.getAll({ category: 'Fashion', limit: 10 }),
      ProductAPI.getAll({ category: 'Home', limit: 10 }),
      ProductAPI.getAll({ category: 'Books', limit: 8 }),
    ]);

    container.innerHTML = '';

    if (featuredRes?.ok) renderSection(container, 'Deal of the Day', featuredRes.data.products, '/pages/products.html');
    if (electronicsRes?.ok) renderSection(container, 'Electronics', electronicsRes.data.products, '/pages/products.html?category=Electronics');
    if (fashionRes?.ok) renderSection(container, 'Fashion & Style', fashionRes.data.products, '/pages/products.html?category=Fashion');
    if (homeRes?.ok) renderSection(container, 'Home & Kitchen', homeRes.data.products, '/pages/products.html?category=Home');
    if (booksRes?.ok) renderSection(container, 'Top Books', booksRes.data.products, '/pages/products.html?category=Books');
  } catch (e) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load products</p></div>';
  }
}

function renderSection(parent, title, products, seeAllUrl) {
  if (!products || !products.length) return;
  const sec = document.createElement('div');
  sec.className = 'section-card';
  sec.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">${title}</div>
      </div>
      <a href="${seeAllUrl}" class="see-all">See All ›</a>
    </div>
    <div class="products-scroll">
      ${products.map(p => buildProductCard(p, wishlistSet.has(p._id))).join('')}
    </div>`;
  parent.appendChild(sec);
}