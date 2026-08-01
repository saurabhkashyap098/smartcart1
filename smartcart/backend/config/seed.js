require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected for seeding...');
};

const sampleProducts = [
  // ── Electronics ─────────────────────────────────────────────────────────────
  {
    name: 'Apple iPhone 15 Pro Max 256GB',
    description: 'iPhone 15 Pro Max with A17 Pro chip, 48MP camera system, Titanium design, USB-C, Dynamic Island and up to 29hr battery life.',
    price: 134900, originalPrice: 159900, discount: 16, category: 'Electronics', brand: 'Apple',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&h=500&fit=crop'],
    stock: 45, featured: true, rating: 4.8, numReviews: 12406,
    tags: ['smartphone', 'apple', '5g', 'iphone'],
    specifications: new Map([['Display', '6.7" Super Retina XDR'], ['Chip', 'A17 Pro'], ['Storage', '256GB'], ['Camera', '48MP Main + 12MP Ultra Wide + 12MP 5x Tele'], ['Battery', '4422 mAh']]),
  },
  {
    name: 'Samsung Galaxy S24 Ultra 5G',
    description: 'Galaxy S24 Ultra with Snapdragon 8 Gen 3, 200MP camera, built-in S Pen, 12GB RAM, 256GB storage.',
    price: 129999, originalPrice: 149999, discount: 13, category: 'Electronics', brand: 'Samsung',
    images: ['https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=500&h=500&fit=crop'],
    stock: 30, featured: true, rating: 4.6, numReviews: 8934,
    tags: ['smartphone', 'samsung', '5g', 'android'],
    specifications: new Map([['Display', '6.8" Dynamic AMOLED 2X'], ['RAM', '12GB'], ['Storage', '256GB'], ['Camera', '200MP + 12MP + 50MP + 10MP'], ['Battery', '5000 mAh']]),
  },
  {
    name: 'OnePlus 12 5G 256GB',
    description: 'Snapdragon 8 Gen 3, Hasselblad camera, 100W SUPERVOOC fast charging, 16GB RAM, 256GB UFS 4.0.',
    price: 64999, originalPrice: 79999, discount: 19, category: 'Electronics', brand: 'OnePlus',
    images: ['https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=500&h=500&fit=crop'],
    stock: 80, featured: true, rating: 4.5, numReviews: 5612,
    tags: ['smartphone', 'oneplus', '5g', 'android'],
    specifications: new Map([['Display', '6.82" LTPO AMOLED'], ['RAM', '16GB'], ['Storage', '256GB'], ['Camera', '50MP + 48MP + 64MP'], ['Battery', '5400 mAh']]),
  },
  {
    name: 'Sony WH-1000XM5 Wireless Headphones',
    description: 'Industry-leading noise cancelling headphones with 30hr battery, multi-point connection, quick charge (3min = 3hr).',
    price: 24990, originalPrice: 34990, discount: 29, category: 'Electronics', brand: 'Sony',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'],
    stock: 120, featured: true, rating: 4.7, numReviews: 9870,
    tags: ['headphones', 'sony', 'wireless', 'noise-cancelling'],
    specifications: new Map([['Driver', '30mm'], ['Battery', '30 Hours'], ['Connectivity', 'Bluetooth 5.2'], ['Weight', '250g']]),
  },
  {
    name: 'Apple MacBook Air M3 13"',
    description: 'MacBook Air with M3 chip, 8GB RAM, 256GB SSD, 18hr battery, Liquid Retina display, fanless design.',
    price: 114900, originalPrice: 124900, discount: 8, category: 'Electronics', brand: 'Apple',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop'],
    stock: 25, featured: true, rating: 4.9, numReviews: 4321,
    tags: ['laptop', 'apple', 'macbook', 'm3'],
    specifications: new Map([['Chip', 'Apple M3'], ['RAM', '8GB'], ['Storage', '256GB SSD'], ['Display', '13.6" Liquid Retina'], ['Battery', '18 Hours']]),
  },
  {
    name: 'Dell XPS 15 Intel Core i7',
    description: 'Dell XPS 15 with Intel Core i7-13700H, 16GB DDR5, 512GB NVMe SSD, NVIDIA RTX 4060, 15.6" 4K OLED.',
    price: 149990, originalPrice: 179990, discount: 17, category: 'Electronics', brand: 'Dell',
    images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&h=500&fit=crop'],
    stock: 15, featured: false, rating: 4.5, numReviews: 2134,
    tags: ['laptop', 'dell', 'xps', 'windows'],
    specifications: new Map([['Processor', 'Intel Core i7-13700H'], ['RAM', '16GB DDR5'], ['Storage', '512GB NVMe SSD'], ['GPU', 'NVIDIA RTX 4060'], ['Display', '15.6" 4K OLED']]),
  },
  {
    name: 'Samsung 65" 4K QLED Smart TV',
    description: 'Quantum HDR, Neo QLED, Object Tracking Sound, Tizen OS with voice assistant, 4K upscaling.',
    price: 84999, originalPrice: 129999, discount: 35, category: 'Electronics', brand: 'Samsung',
    images: ['https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&h=500&fit=crop'],
    stock: 18, featured: true, rating: 4.6, numReviews: 3421,
    tags: ['tv', '4k', 'qled', 'smart-tv'],
    specifications: new Map([['Screen Size', '65 inch'], ['Resolution', '4K UHD (3840x2160)'], ['Panel', 'QLED'], ['Smart OS', 'Tizen'], ['Refresh Rate', '120Hz']]),
  },
  {
    name: 'boAt Airdopes 141 True Wireless Earbuds',
    description: 'True wireless earbuds with 42hr total playback, ASAP charge, IPX4 water resistance, low latency gaming mode.',
    price: 999, originalPrice: 2990, discount: 67, category: 'Electronics', brand: 'boAt',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop'],
    stock: 500, featured: false, rating: 4.1, numReviews: 45321,
    tags: ['earbuds', 'boat', 'tws', 'wireless'],
    specifications: new Map([['Battery', '7hr + 35hr case'], ['Driver', '8mm'], ['Connectivity', 'Bluetooth 5.0'], ['Water Resistance', 'IPX4']]),
  },
  {
    name: 'Canon EOS R50 Mirrorless Camera',
    description: '24.2MP APS-C sensor, RF-S 18-45mm lens, DIGIC X processor, 4K uncropped video, Dual Pixel CMOS AF.',
    price: 74995, originalPrice: 89995, discount: 17, category: 'Electronics', brand: 'Canon',
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=500&fit=crop'],
    stock: 22, featured: false, rating: 4.5, numReviews: 1876,
    tags: ['camera', 'canon', 'mirrorless', 'dslr'],
    specifications: new Map([['Sensor', '24.2MP APS-C CMOS'], ['Video', '4K 30fps'], ['AF', 'Dual Pixel CMOS AF II'], ['Display', '3" Fully Articulated Touch LCD']]),
  },

  // ── Fashion ──────────────────────────────────────────────────────────────────
  {
    name: 'Nike Air Max 270 Running Shoes',
    description: "Nike's largest Air unit for all-day cushioning. Mesh upper, foam midsole, durable rubber outsole.",
    price: 7495, originalPrice: 11995, discount: 37, category: 'Fashion', brand: 'Nike',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop'],
    stock: 200, featured: true, rating: 4.5, numReviews: 18763,
    tags: ['shoes', 'nike', 'running', 'sports'],
    specifications: new Map([['Upper', 'Mesh & synthetic'], ['Sole', 'Rubber'], ['Closure', 'Lace-up'], ['Fit', 'True to size']]),
  },
  {
    name: "Levi's 511 Slim Fit Jeans",
    description: "Classic slim fit jeans in stretch denim for all-day comfort. Mid-rise waist, tapered leg, signature Levi's styling.",
    price: 2249, originalPrice: 3999, discount: 44, category: 'Fashion', brand: "Levi's",
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop'],
    stock: 350, featured: false, rating: 4.4, numReviews: 23456,
    tags: ['jeans', 'levis', 'denim', 'bottom'],
    specifications: new Map([['Fit', 'Slim'], ['Rise', 'Mid-Rise'], ['Fabric', '99% Cotton 1% Elastane'], ['Closure', 'Button fly']]),
  },
  {
    name: 'Puma Men\'s Sports T-Shirt',
    description: 'dryCELL moisture-wicking technology, anti-odor finish, ergonomic seams for full range of motion.',
    price: 699, originalPrice: 1499, discount: 53, category: 'Fashion', brand: 'Puma',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop'],
    stock: 450, featured: false, rating: 4.2, numReviews: 8765,
    tags: ['tshirt', 'puma', 'sports', 'men'],
    specifications: new Map([['Fabric', '100% Polyester'], ['Fit', 'Regular'], ['Wash', 'Machine washable']]),
  },
  {
    name: "Allen Solly Women's Formal Blazer",
    description: 'Premium blazer in stretch fabric for all-day comfort. Single-button closure, notched lapel, slim fit.',
    price: 2699, originalPrice: 4999, discount: 46, category: 'Fashion', brand: 'Allen Solly',
    images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=500&fit=crop'],
    stock: 90, featured: false, rating: 4.3, numReviews: 3421,
    tags: ['blazer', 'women', 'formal', 'office'],
    specifications: new Map([['Fit', 'Slim'], ['Closure', 'Single Button'], ['Fabric', 'Viscose blend']]),
  },
  {
    name: 'Fastrack Analog Watch for Men',
    description: 'Stainless steel case, mineral glass, quartz movement, 50m water resistance. Day-date display.',
    price: 1495, originalPrice: 2995, discount: 50, category: 'Fashion', brand: 'Fastrack',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop'],
    stock: 180, featured: false, rating: 4.0, numReviews: 12345,
    tags: ['watch', 'fastrack', 'men', 'analog'],
    specifications: new Map([['Case', 'Stainless Steel'], ['Glass', 'Mineral'], ['Movement', 'Quartz'], ['Water Resistance', '50m']]),
  },

  // ── Home & Kitchen ────────────────────────────────────────────────────────────
  {
    name: 'Philips Air Fryer HD9200',
    description: 'Rapid Air technology fries with up to 90% less fat. 4.1L capacity, digital display, 7 presets, dishwasher safe.',
    price: 7995, originalPrice: 12995, discount: 38, category: 'Home', brand: 'Philips',
    images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&h=500&fit=crop'],
    stock: 65, featured: true, rating: 4.5, numReviews: 14832,
    tags: ['airfryer', 'philips', 'kitchen', 'appliance'],
    specifications: new Map([['Capacity', '4.1L'], ['Power', '1400W'], ['Temperature Range', '80–200°C'], ['Timer', '0–60 min']]),
  },
  {
    name: 'Prestige Pressure Cooker 5L',
    description: 'Alpha deluxe stainless steel pressure cooker with gasket release system. ISI certified, 5 year warranty.',
    price: 1799, originalPrice: 2799, discount: 36, category: 'Home', brand: 'Prestige',
    images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=500&fit=crop'],
    stock: 200, featured: false, rating: 4.6, numReviews: 31234,
    tags: ['cooker', 'prestige', 'kitchen', 'stainless-steel'],
    specifications: new Map([['Capacity', '5 Litres'], ['Material', 'Stainless Steel'], ['Warranty', '5 Years'], ['Certification', 'ISI']]),
  },
  {
    name: 'Dyson V12 Detect Slim Vacuum',
    description: 'Laser Slim Fluffy nozzle reveals invisible dust. LCD screen, HEPA filtration, 45-min battery, 3 cleaning modes.',
    price: 52900, originalPrice: 62900, discount: 16, category: 'Home', brand: 'Dyson',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop'],
    stock: 20, featured: false, rating: 4.7, numReviews: 2341,
    tags: ['vacuum', 'dyson', 'cordless', 'cleaner'],
    specifications: new Map([['Battery', '45 min'], ['Filtration', 'HEPA'], ['Weight', '2.2 kg'], ['Bin Volume', '0.35L']]),
  },
  {
    name: 'Amazon Echo Dot (5th Gen)',
    description: 'Compact smart speaker with Alexa. Eero Built-in, improved audio, motion detection, LED ring.',
    price: 3999, originalPrice: 5499, discount: 27, category: 'Electronics', brand: 'Amazon',
    images: ['https://images.unsplash.com/photo-1512446816042-444d641267d4?w=500&h=500&fit=crop'],
    stock: 300, featured: false, rating: 4.3, numReviews: 27890,
    tags: ['smart-speaker', 'amazon', 'alexa', 'echo'],
    specifications: new Map([['Speaker', '1.73" front-firing'], ['Connectivity', 'Wi-Fi, Bluetooth 5.2'], ['Smart Home', 'Zigbee, Matter built-in']]),
  },
  {
    name: 'IKEA KALLAX Shelving Unit 4-Cube',
    description: 'Versatile shelving unit, can be used standing or lying down. Fits standard boxes and baskets. Easy assembly.',
    price: 4499, originalPrice: 5999, discount: 25, category: 'Home', brand: 'IKEA',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=500&fit=crop'],
    stock: 45, featured: false, rating: 4.4, numReviews: 5432,
    tags: ['furniture', 'shelf', 'storage', 'ikea'],
    specifications: new Map([['Dimensions', '77x147cm'], ['Material', 'Particleboard'], ['Weight Capacity', '13kg/shelf']]),
  },

  // ── Books ─────────────────────────────────────────────────────────────────────
  {
    name: 'Atomic Habits — James Clear',
    description: 'No.1 bestseller. Tiny Changes, Remarkable Results. Learn how small habits compound into extraordinary results.',
    price: 349, originalPrice: 599, discount: 42, category: 'Books', brand: 'Penguin Random House',
    images: ['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&h=500&fit=crop'],
    stock: 500, featured: true, rating: 4.9, numReviews: 78234,
    tags: ['self-help', 'habits', 'bestseller', 'non-fiction'],
    specifications: new Map([['Author', 'James Clear'], ['Pages', '320'], ['Language', 'English'], ['Publisher', 'Random House']]),
  },
  {
    name: 'The Psychology of Money — Morgan Housel',
    description: 'Timeless lessons on wealth, greed, and happiness. How your financial decisions are driven by psychology.',
    price: 299, originalPrice: 499, discount: 40, category: 'Books', brand: 'Jaico Publishing',
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&h=500&fit=crop'],
    stock: 400, featured: false, rating: 4.8, numReviews: 45123,
    tags: ['finance', 'investing', 'psychology', 'money'],
    specifications: new Map([['Author', 'Morgan Housel'], ['Pages', '256'], ['Language', 'English']]),
  },
  {
    name: 'Rich Dad Poor Dad — Robert Kiyosaki',
    description: 'The #1 personal finance book of all time. What the rich teach their kids about money that the poor do not.',
    price: 249, originalPrice: 399, discount: 38, category: 'Books', brand: 'Manjul Publishing',
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&h=500&fit=crop'],
    stock: 600, featured: false, rating: 4.7, numReviews: 92345,
    tags: ['finance', 'wealth', 'bestseller', 'personal-finance'],
    specifications: new Map([['Author', 'Robert Kiyosaki'], ['Pages', '207'], ['Language', 'English']]),
  },

  // ── Sports ────────────────────────────────────────────────────────────────────
  {
    name: 'Decathlon Domyos Yoga Mat 8mm',
    description: 'Extra-thick 8mm mat for comfort. Non-slip surface, eco-friendly NBR foam, includes carry strap.',
    price: 799, originalPrice: 1299, discount: 38, category: 'Sports', brand: 'Decathlon',
    images: ['https://images.unsplash.com/photo-1601925228194-0b1de1a98a4e?w=500&h=500&fit=crop'],
    stock: 300, featured: false, rating: 4.4, numReviews: 12876,
    tags: ['yoga', 'fitness', 'exercise', 'mat'],
    specifications: new Map([['Thickness', '8mm'], ['Material', 'NBR Foam'], ['Dimensions', '185x61cm'], ['Weight', '700g']]),
  },
  {
    name: 'Boldfit Resistance Bands Set of 5',
    description: 'Professional exercise bands with 5 resistance levels. Ideal for yoga, pilates, physical therapy, home workouts.',
    price: 499, originalPrice: 999, discount: 50, category: 'Sports', brand: 'Boldfit',
    images: ['https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=500&h=500&fit=crop'],
    stock: 400, featured: false, rating: 4.2, numReviews: 21340,
    tags: ['resistance-band', 'gym', 'fitness', 'workout'],
    specifications: new Map([['Material', 'Natural Latex'], ['Levels', '5 resistance levels'], ['Length', '30cm each']]),
  },
  {
    name: 'Nivia Football (Size 5)',
    description: 'Hand-stitched football for professional match play. 32-panel construction, bladder: butyl 4.0mm, water-resistant.',
    price: 649, originalPrice: 999, discount: 35, category: 'Sports', brand: 'Nivia',
    images: ['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500&h=500&fit=crop'],
    stock: 250, featured: false, rating: 4.3, numReviews: 8903,
    tags: ['football', 'soccer', 'sports', 'outdoor'],
    specifications: new Map([['Size', '5'], ['Construction', '32 panels hand-stitched'], ['Bladder', 'Butyl 4.0mm'], ['Surface', 'Synthetic PU']]),
  },

  // ── Beauty ────────────────────────────────────────────────────────────────────
  {
    name: "L'Oreal Paris Revitalift Serum",
    description: '1.5% Pure Hyaluronic Acid, 0.3% Vitamin C. Reduces wrinkles, firms skin, brightens complexion in 4 weeks.',
    price: 899, originalPrice: 1399, discount: 36, category: 'Beauty', brand: "L'Oreal",
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&h=500&fit=crop'],
    stock: 180, featured: false, rating: 4.4, numReviews: 14230,
    tags: ['serum', 'skincare', 'hyaluronic-acid', 'anti-aging'],
    specifications: new Map([['Key Ingredients', '1.5% Hyaluronic Acid, 0.3% Vitamin C'], ['Volume', '30ml'], ['Skin Type', 'All skin types']]),
  },
  {
    name: 'Mamaearth Vitamin C Face Wash',
    description: 'With Vitamin C and Turmeric, brightens skin, removes tan, gentle daily cleanser. Toxin-free, dermatologically tested.',
    price: 299, originalPrice: 399, discount: 25, category: 'Beauty', brand: 'Mamaearth',
    images: ['https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500&h=500&fit=crop'],
    stock: 300, featured: false, rating: 4.3, numReviews: 34561,
    tags: ['face-wash', 'skincare', 'vitamin-c', 'natural'],
    specifications: new Map([['Volume', '100ml'], ['Key Ingredient', 'Vitamin C & Turmeric'], ['Skin Type', 'All types'], ['Certification', 'MADE SAFE']]),
  },

  // ── Grocery ───────────────────────────────────────────────────────────────────
  {
    name: 'Tata Sampann Chana Dal 1kg',
    description: 'Premium quality split chickpeas. Rich in protein and fiber. No artificial color or preservatives.',
    price: 119, originalPrice: 149, discount: 20, category: 'Grocery', brand: 'Tata',
    images: ['https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=500&h=500&fit=crop'],
    stock: 800, featured: false, rating: 4.5, numReviews: 8934,
    tags: ['dal', 'pulses', 'grocery', 'tata'],
    specifications: new Map([['Weight', '1kg'], ['Type', 'Split chickpeas'], ['Origin', 'India']]),
  },
  {
    name: 'Fortune Sunflower Oil 5L',
    description: 'Refined sunflower oil with natural Vitamin E. Light and nutritious, ideal for everyday cooking, frying.',
    price: 699, originalPrice: 899, discount: 22, category: 'Grocery', brand: 'Fortune',
    images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&h=500&fit=crop'],
    stock: 500, featured: false, rating: 4.4, numReviews: 21345,
    tags: ['oil', 'cooking', 'grocery', 'sunflower'],
    specifications: new Map([['Volume', '5L'], ['Type', 'Refined Sunflower Oil'], ['Vitamin', 'Natural Vitamin E']]),
  },

  // ── Toys ──────────────────────────────────────────────────────────────────────
  {
    name: 'LEGO Classic Creative Bricks 484pcs',
    description: '484 bricks in 33 bright colors. Build cars, houses, animals—everything you imagine! Suitable for ages 4+.',
    price: 1799, originalPrice: 2499, discount: 28, category: 'Toys', brand: 'LEGO',
    images: ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&h=500&fit=crop'],
    stock: 90, featured: false, rating: 4.8, numReviews: 6543,
    tags: ['lego', 'kids', 'building', 'creative'],
    specifications: new Map([['Pieces', '484'], ['Age', '4+ years'], ['Set Number', '11013']]),
  },
];

const seedDB = async () => {
  try {
    await connectDB();

    // Clear existing
    await User.deleteMany();
    await Product.deleteMany();
    console.log('Cleared existing data...');

    // Create admin
    const admin = await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@smartcart.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
    });
    console.log(`Admin created: ${admin.email}`);

    // Create sample user
    await User.create({
      name: 'Test User',
      email: 'user@smartcart.com',
      password: 'User@123',
      role: 'user',
    });
    console.log('Test user created: user@smartcart.com / User@123');

    // Create products
    await Product.insertMany(sampleProducts);
    console.log(`${sampleProducts.length} products seeded`);

    console.log('\n✅ Seeding complete!');
    console.log('Admin:', process.env.ADMIN_EMAIL || 'admin@smartcart.com', '/', process.env.ADMIN_PASSWORD || 'Admin@123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedDB();
