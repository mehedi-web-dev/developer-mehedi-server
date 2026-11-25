# developer-mehedi-server

Backend API server for **Developer Mehedi Portfolio**, built with Express 5, Better Auth, Mongoose, and MongoDB Atlas.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express 5
- **Authentication**: Better Auth (`better-auth`, `@better-auth/mongo-adapter`)
- **Database & ODM**: MongoDB Driver (`mongodb`) & Mongoose (`mongoose`)
- **Image Hosting**: ImgBB API (with server-side magic byte validation & size limiting)
- **Environment**: Native Node.js `process.loadEnvFile()` / `.env` support

---

## 📁 Project Structure

```text
developer-mehedi-server/
├── src/
│   ├── config/
│   │   └── db.js                        # Unified MongoDB client + Mongoose connection management
│   ├── models/                          # Mongoose data models
│   │   ├── Service.js                   # Services offered model
│   │   ├── Project.js                   # Portfolio projects model
│   │   ├── Review.js                    # Client testimonials & reviews model
│   │   ├── FAQ.js                       # Frequently asked questions model
│   │   ├── Contact.js                   # Contact inquiries model
│   │   ├── SiteSettings.js              # Personal info, experience & skills model
│   │   └── index.js                     # Unified models export
│   ├── controllers/                     # REST API route controllers
│   │   ├── service.controller.js        # Public services controller
│   │   ├── project.controller.js        # Public projects controller
│   │   ├── review.controller.js         # Public reviews controller
│   │   ├── faq.controller.js            # Public FAQs controller
│   │   ├── siteSettings.controller.js   # Public site settings controller
│   │   ├── contact.controller.js        # Public contact inquiry submission
│   │   ├── admin.service.controller.js  # Admin services CRUD
│   │   ├── admin.project.controller.js  # Admin projects CRUD
│   │   ├── admin.review.controller.js   # Admin reviews CRUD
│   │   ├── admin.faq.controller.js      # Admin FAQs CRUD
│   │   ├── admin.contact.controller.js  # Admin contact inquiries management
│   │   ├── admin.siteSettings.controller.js # Admin site settings management
│   │   └── admin.upload.controller.js   # Admin ImgBB image uploads
│   ├── routes/                          # Express API routers
│   │   ├── service.routes.js            # Public service routes
│   │   ├── project.routes.js            # Public project routes
│   │   ├── review.routes.js             # Public review routes
│   │   ├── faq.routes.js                # Public FAQ routes
│   │   ├── siteSettings.routes.js       # Public site settings routes
│   │   ├── contact.routes.js            # Public contact routes
│   │   ├── admin/                       # Protected admin route modules
│   │   │   ├── service.routes.js
│   │   │   ├── project.routes.js
│   │   │   ├── review.routes.js
│   │   │   ├── faq.routes.js
│   │   │   ├── contact.routes.js
│   │   │   ├── siteSettings.routes.js
│   │   │   ├── upload.routes.js
│   │   │   └── index.js                 # Protected admin router (requireAdmin)
│   │   └── index.js                     # Root API router (/api)
│   ├── middleware/
│   │   ├── auth.middleware.js           # Better Auth session & admin role verification
│   │   └── rateLimiter.js               # Sliding-window in-memory abuse protection
│   ├── services/
│   │   └── imgbb.service.js             # ImgBB image upload client & error sanitizer
│   ├── utils/
│   │   ├── image.validation.js          # Magic byte inspection (JPEG/PNG/WEBP) & size limits
│   │   ├── validation.js                # ObjectId validation helper
│   │   ├── slugify.js                   # URL-safe slug generator
│   │   └── response.js                  # Standard JSON response helpers
│   ├── lib/
│   │   ├── auth.js                      # Better Auth initialization & MongoDB adapter integration
│   │   └── admin.js                     # Server-side admin verification and account initialization
│   ├── app.js                           # Express application, CORS headers, routes & Better Auth handler
│   └── server.js                        # Server listener, database connect & graceful shutdown handling
├── .env                                 # Local environment secrets
├── .env.example                         # Template environment configuration
├── .gitignore                           # Git ignore rules for node_modules, env, logs
├── index.js                             # Entrypoint forwarding to src/server.js
└── package.json                         # NPM package scripts and dependencies
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

# ImgBB Image Hosting Configuration
IMGBB_API_KEY=your_imgbb_api_key_here
MAX_UPLOAD_SIZE_MB=10
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

### Protected Admin APIs (`requireAdmin`)
*All `/api/admin/*` endpoints strictly require a valid Better Auth session with the `admin` role (via session cookie or Authorization header).*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/services` | Retrieve all services (including unpublished) |
| `GET` | `/api/admin/services/:id` | Retrieve service details by ObjectId |
| `POST` | `/api/admin/services` | Create new service (validates title, shortDescription, description, slug) |
| `PATCH` | `/api/admin/services/:id` | Update service by ObjectId |
| `DELETE` | `/api/admin/services/:id` | Delete service by ObjectId |
| `GET` | `/api/admin/projects` | Retrieve all projects |
| `GET` | `/api/admin/projects/:id` | Retrieve project details by ObjectId |
| `POST` | `/api/admin/projects` | Create new project |
| `PATCH` | `/api/admin/projects/:id` | Update project by ObjectId |
| `DELETE` | `/api/admin/projects/:id` | Delete project by ObjectId |
| `GET` | `/api/admin/reviews` | Retrieve all reviews (including pending approval) |
| `GET` | `/api/admin/reviews/:id` | Retrieve review details by ObjectId |
| `POST` | `/api/admin/reviews` | Create review |
| `PATCH` | `/api/admin/reviews/:id` | Update review by ObjectId |
| `DELETE` | `/api/admin/reviews/:id` | Delete review by ObjectId |
| `GET` | `/api/admin/faqs` | Retrieve all FAQs (including inactive) |
| `GET` | `/api/admin/faqs/:id` | Retrieve FAQ details by ObjectId |
| `POST` | `/api/admin/faqs` | Create FAQ |
| `PATCH` | `/api/admin/faqs/:id` | Update FAQ by ObjectId |
| `DELETE` | `/api/admin/faqs/:id` | Delete FAQ by ObjectId |
| `GET` | `/api/admin/contacts` | Retrieve customer inquiries (`?status=new\|read\|replied`) |
| `GET` | `/api/admin/contacts/:id` | Retrieve customer inquiry details by ObjectId |
| `PATCH` | `/api/admin/contacts/:id` | Update inquiry status (`new`, `read`, `replied`) |
| `DELETE` | `/api/admin/contacts/:id` | Delete customer inquiry by ObjectId |
| `GET` | `/api/admin/site-settings` | Retrieve complete site settings |
| `PATCH` | `/api/admin/site-settings` | Update site settings, profile, experience, skills |
| `POST` | `/api/admin/upload/image` | Upload single image (multipart/form-data: `image` or `file`) |
| `POST` | `/api/admin/upload/images` | Upload up to 10 images concurrently (multipart/form-data: `images` or `files`) |

#### ImgBB Image Deletion Policy
ImgBB's public API upload response includes a human-facing `delete_url` for web browser deletion. Because ImgBB does not provide an automated programmatic REST API endpoint for remote deletion, the `deleteUrl` is returned strictly to authenticated admins during upload and is never exposed through public APIs. Programmatic remote deletion is not claimed or mocked.

---

## 🔗 Frontend Integration

For the Next.js frontend (`c:\projects\developer-mehedi`):
- Configure `NEXT_PUBLIC_API_URL=http://localhost:5000`
- Configure `BETTER_AUTH_URL=http://localhost:5000`
