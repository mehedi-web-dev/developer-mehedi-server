# developer-mehedi-server

Backend API server for **Developer Mehedi Portfolio**, built with Express 5, Better Auth, Mongoose, and MongoDB Atlas.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express 5
- **Authentication**: Better Auth (`better-auth`, `@better-auth/mongo-adapter`)
- **Database & ODM**: MongoDB Driver (`mongodb`) & Mongoose (`mongoose`)
- **Environment**: Native Node.js `process.loadEnvFile()` / `.env` support

---

## 📁 Project Structure

```text
developer-mehedi-server/
├── src/
│   ├── config/
│   │   └── db.js            # Unified MongoDB client + Mongoose connection management
│   ├── models/              # Mongoose data models
│   │   ├── Service.js       # Services offered model
│   │   ├── Project.js       # Portfolio projects model
│   │   ├── Review.js        # Client testimonials & reviews model
│   │   ├── FAQ.js           # Frequently asked questions model
│   │   ├── Contact.js       # Contact inquiries model
│   │   ├── SiteSettings.js  # Personal info, experience & skills model
│   │   └── index.js         # Unified models export
│   ├── controllers/         # REST API route controllers
│   │   ├── service.controller.js
│   │   ├── project.controller.js
│   │   ├── review.controller.js
│   │   ├── faq.controller.js
│   │   ├── siteSettings.controller.js
│   │   └── contact.controller.js
│   ├── routes/              # Express API routers
│   │   ├── service.routes.js
│   │   ├── project.routes.js
│   │   ├── review.routes.js
│   │   ├── faq.routes.js
│   │   ├── siteSettings.routes.js
│   │   ├── contact.routes.js
│   │   └── index.js
│   ├── middleware/
│   │   └── rateLimiter.js   # Sliding-window in-memory abuse protection
│   ├── utils/
│   │   ├── slugify.js       # URL-safe slug generator
│   │   └── response.js      # Standard JSON response helpers
│   ├── lib/
│   │   ├── auth.js          # Better Auth initialization & MongoDB adapter integration
│   │   └── admin.js         # Server-side admin verification and account initialization
│   ├── app.js               # Express application, CORS headers, routes & Better Auth handler
│   └── server.js            # Server listener, database connect & graceful shutdown handling
├── .env                     # Local environment secrets
├── .env.example             # Template environment configuration
├── .gitignore               # Git ignore rules for node_modules, env, logs
├── index.js                 # Entrypoint forwarding to src/server.js
└── package.json             # NPM package scripts and dependencies
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```env
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
DB_NAME=developer_mehedi

# Better Auth Configuration
BETTER_AUTH_SECRET=your_32_character_random_secret_here
BETTER_AUTH_URL=http://localhost:5000

# Client Application / CORS Configuration
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Initial Admin Credentials (Optional)
ADMIN_NAME=Developer Mehedi
ADMIN_EMAIL=admin@developermehedi.com
ADMIN_PASSWORD=your_secure_admin_password
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start in Development Mode (with native watch mode)
```bash
npm run dev
```

### 3. Start in Production Mode
```bash
npm start
```

---

## 📡 API Endpoints

### System & Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status and directory of endpoints |
| `GET` | `/api/health` | Comprehensive database connection and env diagnostics |
| `ALL` | `/api/auth/*` | Better Auth endpoints (sign-in, session, sign-out) |

### Public Portfolio APIs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/services` | Paginated list of published services (`?page=1&limit=10`) |
| `GET` | `/api/services/featured` | Top 3 published and featured services |
| `GET` | `/api/projects` | Paginated list of published projects (`?page=1&limit=9&category=...`) |
| `GET` | `/api/projects/featured` | Top 3 published and featured projects |
| `GET` | `/api/projects/:slug` | Single published project by unique slug |
| `GET` | `/api/reviews` | Paginated list of approved reviews (`?page=1&limit=10&featured=true`) |
| `GET` | `/api/faqs` | Active FAQs ordered by priority |
| `GET` | `/api/site-settings` | Public profile, skills, experience, and site information |
| `POST` | `/api/contact` | Submit contact inquiry (rate limited: 5 req/15 min/IP, honeypot protected) |

---

## 🔗 Frontend Integration

For the Next.js frontend (`c:\projects\developer-mehedi`):
- Configure `NEXT_PUBLIC_API_URL=http://localhost:5000`
- Configure `BETTER_AUTH_URL=http://localhost:5000`
