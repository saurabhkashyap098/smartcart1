# 🛒 SmartCart — Full-Stack E-Commerce (Flipkart Clone)

A **production-ready** full-stack e-commerce app modelled after Flipkart, rebranded as **SmartCart**.

---

## 📁 Project Structure

```
smartcart/
├── backend/
│   ├── server.js              ← Express entry point
│   ├── .env                   ← Environment variables (edit this!)
│   ├── package.json
│   ├── config/
│   │   ├── db.js              ← MongoDB connection
│   │   └── seed.js            ← DB seeder (20 products + 2 users)
│   ├── controllers/
│   │   ├── authController.js  ← Register/Login/Profile/Wishlist/Password Reset
│   │   ├── cartController.js  ← Cart CRUD
│   │   ├── orderController.js ← Orders + Razorpay
│   │   └── productController.js ← Products + Reviews
│   ├── middleware/
│   │   ├── auth.js            ← JWT protect + admin authorize
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Cart.js / Order.js / Product.js / User.js
│   ├── routes/
│   │   ├── auth.js / cart.js / orders.js / products.js
│   └── utils/
│       └── email.js           ← Nodemailer email service + templates
└── frontend/
    ├── index.html             ← Home page (hero, categories, deals, products)
    ├── css/style.css          ← Global Flipkart-like styles
    ├── js/api.js              ← API client + shared utilities + navbar/footer
    └── pages/
        ├── login.html         ← Login + Register + Forgot Password
        ├── products.html      ← Product listing + filter + sort + search
        ├── product.html       ← Product detail + images + reviews + buy
        ├── cart.html          ← Cart + qty + remove + save for later
        ├── checkout.html      ← Address + Payment (COD + Razorpay)
        ├── order-success.html ← Order confirmation page
        ├── orders.html        ← My orders + filter + cancel + reorder
        ├── order-detail.html  ← Order tracking + status history
        ├── profile.html       ← Profile + addresses + change password
        ├── wishlist.html      ← Wishlist products
        └── admin.html         ← Admin panel (orders, products, users)
```

---

## ⚡ Quick Start (Windows)

### Step 1 — Install Prerequisites
- **MongoDB**: https://www.mongodb.com/try/download/community  
  After installing, start MongoDB: `net start MongoDB` (in CMD as Admin)
- **Node.js**: https://nodejs.org (LTS version)

### Step 2 — Install Dependencies
```cmd
cd smartcart\backend
npm install
```

### Step 3 — Configure .env
Open `backend\.env` and update:
```env
MONGODB_URI=mongodb://localhost:27017/smartcart
JWT_SECRET=change_this_to_something_secret_long

# Razorpay (get free test keys from dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Gmail Email (optional — for order/welcome emails)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → Create one for "Mail"

### Step 4 — Seed Database
```cmd
cd smartcart\backend
npm run seed
```
Creates:
- Admin: `admin@smartcart.com` / `Admin@123`
- Demo User: `user@demo.com` / `User@123`
- 20 sample products across all categories

### Step 5 — Start Server
```cmd
npm run dev     ← development (auto-reload with nodemon)
npm start       ← production
```

### Step 6 — Open App
Visit **http://localhost:5000** in your browser 🎉

---

## 🔑 Features

| Feature | Details |
|---------|---------|
| 🔐 Auth | JWT login/register, forgot password, email verification |
| 📧 Emails | Welcome, order confirmation, status updates, password reset |
| 🛒 Cart | Add/remove/update qty, save for later, price breakdown |
| 💳 Payment | Razorpay (cards, UPI, netbanking, wallets) + Cash on Delivery |
| 📦 Orders | Place, track, cancel, reorder, status history |
| 🔍 Search | Full-text search with MongoDB text index |
| 🏷️ Filters | Price range, rating, brand, category, in-stock |
| ❤️ Wishlist | Add/remove, move to cart |
| ⭐ Reviews | Rating + comment, aggregate score |
| 👤 Profile | Edit info, manage addresses, change password |
| ⚙️ Admin | Dashboard stats, order management, product CRUD, user management |
| 📱 Responsive | Mobile-friendly across all pages |

---

## 🔌 API Endpoints

### Auth
| Method | Route | Auth |
|--------|-------|------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| GET | `/api/auth/me` | ✅ |
| PUT | `/api/auth/profile` | ✅ |
| PUT | `/api/auth/change-password` | ✅ |
| POST | `/api/auth/forgot-password` | — |
| PUT | `/api/auth/reset-password/:token` | — |
| POST | `/api/auth/address` | ✅ |
| PUT | `/api/auth/address/:id` | ✅ |
| DELETE | `/api/auth/address/:id` | ✅ |
| POST | `/api/auth/wishlist/:productId` | ✅ |
| GET | `/api/auth/wishlist` | ✅ |
| GET | `/api/auth/users` | Admin |
| PUT | `/api/auth/users/:id/toggle` | Admin |

### Products
| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/products` | — |
| GET | `/api/products/:id` | — |
| GET | `/api/products/categories` | — |
| POST | `/api/products` | Admin |
| PUT | `/api/products/:id` | Admin |
| DELETE | `/api/products/:id` | Admin |
| POST | `/api/products/:id/review` | ✅ |

### Cart
| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/cart` | ✅ |
| POST | `/api/cart` | ✅ |
| PUT | `/api/cart/:productId` | ✅ |
| DELETE | `/api/cart/:productId` | ✅ |
| DELETE | `/api/cart` | ✅ |

### Orders
| Method | Route | Auth |
|--------|-------|------|
| POST | `/api/orders/create-razorpay-order` | ✅ |
| POST | `/api/orders` | ✅ |
| GET | `/api/orders/my-orders` | ✅ |
| GET | `/api/orders/:id` | ✅ |
| PUT | `/api/orders/:id/cancel` | ✅ |
| GET | `/api/orders` | Admin |
| PUT | `/api/orders/:id/status` | Admin |
| GET | `/api/orders/stats` | Admin |

---

## 💳 Razorpay Setup (Free Test Mode)

1. Sign up at https://dashboard.razorpay.com
2. Go to Settings → API Keys → Generate Test Key
3. Copy `Key ID` and `Key Secret` to your `.env`
4. Use test card: `4111 1111 1111 1111` | Expiry: any future | CVV: any 3 digits

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT (jsonwebtoken) |
| Password | bcryptjs |
| Payment | Razorpay |
| Email | Nodemailer (Gmail SMTP) |
| Frontend | HTML5, CSS3, Vanilla JS |

