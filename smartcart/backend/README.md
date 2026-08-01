# 🛒 SmartCart Backend API

A production-ready **Node.js + Express + MongoDB** REST API for a Flipkart-style e-commerce platform, following clean **MVC architecture**.

---

## 📁 Project Structure

```
smartcart-backend/
├── config/
│   ├── db.js              # MongoDB connection
│   ├── logger.js          # Winston logger setup
│   └── seed.js            # Database seeder
├── controllers/
│   ├── authController.js
│   ├── cartController.js
│   ├── orderController.js
│   └── productController.js
├── middleware/
│   ├── auth.js            # JWT protect + role authorize
│   ├── errorHandler.js    # Centralized error handler
│   ├── notFound.js        # 404 handler
│   └── validate.js        # express-validator rules
├── models/
│   ├── Cart.js
│   ├── Order.js
│   ├── Product.js
│   └── User.js
├── routes/
│   ├── auth.js
│   ├── cart.js
│   ├── orders.js
│   └── products.js
├── logs/                  # Auto-created at runtime
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── SmartCart.postman_collection.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js >= 18.x
- MongoDB (local or Atlas)

### Steps

```bash
# 1. Clone / extract the project
cd smartcart-backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values (MongoDB URI, JWT secret, Razorpay keys, etc.)

# 4. (Optional) Seed sample data
npm run seed

# 5. Start development server
npm run dev

# 6. Start production server
npm start
```

Server runs at: `http://localhost:5000`

---

## 🔐 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` / `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/smartcart` |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) | `your_long_random_secret` |
| `JWT_EXPIRE` | Token expiry duration | `7d` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5500` |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID | `rzp_test_xxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay API Secret | `xxxxx` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username / email | `you@gmail.com` |
| `EMAIL_PASS` | SMTP password (App Password for Gmail) | `abcd efgh ijkl mnop` |
| `EMAIL_FROM` | From address shown in emails | `SmartCart <you@gmail.com>` |
| `FRONTEND_URL` | Frontend base URL | `http://localhost:5000` |
| `ADMIN_EMAIL` | Seed admin email | `admin@smartcart.com` |
| `ADMIN_PASSWORD` | Seed admin password | `Admin@123` |

---

## 🚀 API Endpoints

### Auth  `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login & receive JWT |
| GET | `/me` | ✅ | Get current user profile |
| PUT | `/profile` | ✅ | Update profile (name, phone, avatar) |
| PUT | `/change-password` | ✅ | Change password |
| POST | `/address` | ✅ | Add shipping address |
| DELETE | `/address/:id` | ✅ | Remove a shipping address |
| GET | `/users` | 🔑 Admin | List all users |
| PUT | `/users/:id/toggle` | 🔑 Admin | Activate / deactivate user |

### Products  `/api/products`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | List products (search, filter, paginate) |
| GET | `/:id` | ❌ | Get single product |
| GET | `/categories` | ❌ | Get all categories |
| GET | `/brands` | ❌ | Get all brands |
| GET | `/featured` | ❌ | Get featured products |
| GET | `/admin/stats` | 🔑 Admin | Dashboard product stats |
| POST | `/` | 🔑 Admin | Create product |
| PUT | `/:id` | 🔑 Admin | Update product |
| DELETE | `/:id` | 🔑 Admin | Soft-delete product |
| POST | `/:id/review` | ✅ | Add product review |

**Query params for `GET /api/products`:**
`keyword`, `category`, `brand`, `minPrice`, `maxPrice`, `rating`, `sort` (`price-asc`, `price-desc`, `rating`, `newest`, `popular`), `page`, `limit`

### Cart  `/api/cart`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | Get user's cart |
| POST | `/` | ✅ | Add / update item in cart |
| DELETE | `/:productId` | ✅ | Remove item from cart |
| DELETE | `/` | ✅ | Clear entire cart |

### Orders  `/api/orders`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Create order from cart |
| POST | `/razorpay` | ✅ | Create Razorpay payment order |
| GET | `/myorders` | ✅ | Get logged-in user's orders |
| GET | `/:id` | ✅ | Get single order (owner or admin) |
| POST | `/:id/pay` | ✅ | Verify Razorpay payment |
| GET | `/` | 🔑 Admin | List all orders (paginated) |
| PUT | `/:id/status` | 🔑 Admin | Update order status |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health check |

---

## 🔒 Authentication

All protected routes require:

```
Authorization: Bearer <your_jwt_token>
```

Obtain the token from `/api/auth/login` or `/api/auth/register`.

---

## 🛡️ Security Features

- **Helmet** – Secure HTTP response headers
- **CORS** – Configurable allowed origins via `ALLOWED_ORIGINS`
- **express-mongo-sanitize** – Prevents NoSQL injection attacks
- **express-rate-limit** – 300 req/15min globally; 20 req/15min on auth endpoints
- **bcryptjs** – Passwords hashed with salt rounds = 12
- **JWT** – Stateless authentication with configurable expiry
- **express-validator** – Input validation on all write endpoints

---

## 📋 Response Format

All responses follow a consistent shape:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "message": "Human-readable error" }

// Validation failure (422)
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Please provide a valid email" }]
}
```

---

## 📦 Testing with Postman

Import `SmartCart.postman_collection.json` into Postman.

1. Run **Register** or **Login** — the collection auto-saves the token to `{{token}}`.
2. All authenticated requests use `{{token}}` automatically.
3. Set `{{baseUrl}}` to `http://localhost:5000` in your Postman environment.

---

## 📝 Logs

Logs are written to the `logs/` directory (auto-created):
- `app-YYYY-MM-DD.log` — all levels, rotated daily, kept 14 days
- `error-YYYY-MM-DD.log` — errors only, kept 30 days

Console output is colorized in development mode.

---

## 🗄️ Data Seeding

```bash
npm run seed
```

Clears existing data and inserts sample products + an admin user (credentials from `.env`).

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Production server (`node server.js`) |
| `npm run dev` | Development server with auto-reload (`nodemon`) |
| `npm run seed` | Seed database with sample data |
