# Arc Analytical ERP System

A complete, production-ready ERP system for Arc Analytical — built with React.js, Node.js, Express, and MongoDB.

---

## Features

| Module | Features |
|--------|----------|
| **Dashboard** | Stats overview, revenue charts, visit status, recent quotations |
| **Clients** | Full CRUD, search, pagination, linked contracts & quotations |
| **AMC/CMC Contracts** | Create/manage contracts, expiry alerts (30d & 7d), status tracking |
| **Service Visits** | Schedule visits, assign engineers, track PM/breakdown/installation |
| **Quotations** | Line-item editor, GST calc, PDF generation, email sending |
| **Invoices** | Generate from quotations, GST, PDF export, payment status |
| **Purchase Orders** | Record POs, dispatch tracking with progress bar, courier details |
| **Follow-ups** | Track pending quotations, urgency highlights, mark done |
| **Excel** | Export clients/contracts, import clients from Excel |
| **Settings** | Company info, logo upload, bank details, user management, terms |
| **Auth** | JWT login, role-based access (Admin / Sales / Engineer) |

---

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone / Extract the project
```bash
cd arc-analytical-erp
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env .env.local   # Edit with your values
```

Edit `.env`:
```env
MONGO_URI=mongodb://localhost:27017/arc-analytical-erp
JWT_SECRET=your_super_secret_key_change_this
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:3000
```

#### Seed sample data:
```bash
npm run seed
```

#### Start backend:
```bash
npm run dev      # Development (with nodemon)
npm start        # Production
```
Backend runs on: `http://localhost:5000`

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm start
```
Frontend runs on: `http://localhost:3000`

---

## Login Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@arcanalytical.com | admin123 |
| Engineer | rajesh@arcanalytical.com | engineer123 |
| Sales | priya@arcanalytical.com | sales123 |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register user (admin) |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/change-password | Change password |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/clients | List with pagination & search |
| GET | /api/clients/all | All clients (for dropdowns) |
| POST | /api/clients | Create client |
| GET | /api/clients/:id | Get with contracts & quotations |
| PUT | /api/clients/:id | Update |
| DELETE | /api/clients/:id | Deactivate |

### Contracts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/contracts | List with filters |
| GET | /api/contracts/expiring | Expiring in 30 days |
| POST | /api/contracts | Create |
| PUT | /api/contracts/:id | Update |

### Quotations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/quotations | List |
| POST | /api/quotations | Create |
| PUT | /api/quotations/:id | Update |
| POST | /api/quotations/:id/generate-pdf | Generate PDF |
| POST | /api/quotations/:id/send-email | Email quotation |

### Invoices, Visits, POs, Follow-ups
All follow the same REST pattern: GET / POST / PUT /:id

### Excel
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/excel/export/clients | Download clients.xlsx |
| GET | /api/excel/export/contracts | Download contracts.xlsx |
| POST | /api/excel/import/clients | Import from xlsx |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/stats | All dashboard stats |

---

## Project Structure

```
arc-analytical-erp/
├── backend/
│   ├── config/          # DB connection, email config
│   ├── controllers/     # Business logic (auth, client, contract, quotation, combined)
│   ├── models/          # MongoDB schemas (index.js has all models)
│   ├── routes/          # Express routes per module
│   ├── middleware/       # Auth (JWT), upload (Multer)
│   ├── services/        # PDF (Puppeteer), Email (Nodemailer), Reminders (node-cron), WhatsApp
│   ├── utils/           # Helpers, seed data
│   ├── uploads/         # File storage (pdfs/, logos/, attachments/)
│   └── server.js        # Entry point
│
└── frontend/
    └── src/
        ├── api/          # Axios instances per module
        ├── components/
        │   ├── layout/   # Sidebar, Topbar, Layout
        │   └── ui/       # Modal, Table, Pagination, StatCard, EmptyState, SearchFilter
        ├── context/      # AuthContext (JWT state)
        ├── pages/        # Dashboard, Clients, Contracts, Visits, Quotations,
        │                 # Invoices, PurchaseOrders, FollowUps, Settings, Login
        └── utils/        # formatCurrency, formatDate, statusBadge, downloadBlob
```

---

## Email Configuration (Gmail)

1. Enable 2-Step Verification in your Google Account
2. Go to **Security → App Passwords**
3. Generate an app password for "Mail"
4. Use that 16-character password as `EMAIL_PASS` in `.env`

---

## WhatsApp Integration

The WhatsApp module uses Twilio's API. To enable:

1. Create a Twilio account at twilio.com
2. Get a WhatsApp-enabled number
3. Add credentials to `.env`
4. Uncomment the code in `backend/services/whatsapp.service.js`

---

## Auto Reminders

The system runs a daily cron job at 9 AM that:
- Sends email reminders for contracts expiring in 30 days
- Sends email reminders for contracts expiring in 7 days
- Marks expired contracts as "expired"

---

## PDF Generation

PDFs are generated using Puppeteer (headless Chrome). They are:
- Stored in `backend/uploads/pdfs/`
- Named `quotation-{QT-XXXX}-{timestamp}.pdf` / `invoice-{INV-XXXX}-{timestamp}.pdf`
- Accessible at `http://localhost:5000/uploads/pdfs/filename.pdf`

---

## Production Deployment

### Backend (Node.js)
```bash
cd backend
npm install --production
NODE_ENV=production node server.js
```
Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name arc-erp-backend
pm2 save && pm2 startup
```

### Frontend (React build)
```bash
cd frontend
npm run build
# Serve the build/ folder with nginx or any static server
```

### Environment Variables (Production)
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/arc-erp
JWT_SECRET=<very-long-random-string>
FRONTEND_URL=https://yourdomain.com
```

---

## Role Permissions

| Feature | Admin | Sales | Engineer |
|---------|-------|-------|----------|
| View all modules | ✅ | ✅ | ✅ |
| Create/Edit clients | ✅ | ✅ | ❌ |
| Create quotations | ✅ | ✅ | ❌ |
| Manage visits | ✅ | ✅ | ✅ |
| Delete clients | ✅ | ❌ | ❌ |
| Settings / Users | ✅ | ❌ | ❌ |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Tailwind CSS, Chart.js |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| PDF | Puppeteer (headless Chrome) |
| Email | Nodemailer |
| Excel | ExcelJS |
| File Upload | Multer |
| Reminders | node-cron |
| WhatsApp | Twilio (placeholder) |

---

## Support & Customization

- To add new modules: follow the MVC pattern (model → controller → route → page)
- To customize PDF templates: edit `backend/services/pdf.service.js`
- To change company details: use the Settings → Company page in the UI
- To add more instrument types: edit the INSTRUMENTS array in `frontend/src/pages/Contracts.jsx`
