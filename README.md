# 💰 ExpenseTracker — Full-Stack Financial Management App

A modern, premium expense tracker built with **React 19 + Vite 5** (frontend) and **Node.js + Express + MySQL** (backend). Features multi-user authentication, rich analytics, budget tracking, income management, debt planning, investment portfolio, savings goals, tax planning, recurring expenses, and real-time market data — all wrapped in a glassmorphic dark/light UI.

---

## ✨ Features

### Core Financial Management
- **💳 Expense Tracking** — Full CRUD with categories, payment methods, tags, and notes
- **💵 Income Management** — Track multiple income sources with recurring support
- **🎯 Budget Tracking** — Set monthly budgets per category with animated progress bars
- **🔄 Recurring Expenses** — Auto-generate expenses on daily, weekly, monthly, or yearly schedules
- **💰 Savings Goals** — Create and contribute to financial goals with progress tracking

### Advanced Planning Tools
- **📊 Rich Analytics** — 5+ interactive chart types (pie, bar, area, line) powered by Recharts
- **📈 Financial Projections** — Forecast future spending and income trends
- **🏦 Debt Planner** — Snowball/avalanche repayment strategies with payoff timelines
- **📋 Tax Planner** — Estimate taxes across multiple income brackets and deductions
- **📑 Balance Sheet** — Comprehensive assets vs. liabilities overview
- **🧮 Financial Calculators** — EMI, compound interest, SIP, and more
- **🤝 Bill Splitter** — Split expenses among groups with smart rounding

### Market & Investments
- **📈 Market Dashboard** — Gold/silver prices, stock data, exchange rates, savings rates, financial news
- **💼 Investment Portfolio** — Track stock/crypto/mutual fund holdings and performance
- **💱 Multi-Currency** — Support for multiple currencies with live exchange rates

### User Experience
- **🔐 Multi-User Auth** — JWT-based with access/refresh tokens and httpOnly cookies
- **🌙 Dark/Light Mode** — Premium glassmorphic design with smooth theme toggle
- **📤 Export** — Download expenses as CSV or PDF reports
- **📥 CSV Import** — Bulk import expenses from CSV files with column mapping
- **🏆 Achievements** — Gamified financial milestones and badges
- **⚙️ Settings** — Customizable currency, profile management, and password change
- **📱 Responsive** — Optimized for desktop, tablet, and mobile
- **🤖 AI Insights** — Smart spending pattern analysis and recommendations

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|:---|:---|:---|
| React | 19.2.7 | UI framework |
| Vite | 5.4.21 | Build tool & dev server |
| React Router DOM | 6.30.4 | Client-side routing |
| TanStack React Query | 5.101.2 | Server state management |
| Recharts | 3.9.2 | Data visualization charts |
| Axios | 1.18.1 | HTTP client |
| React Icons | 5.7.0 | Icon library |
| PapaParse | 5.5.4 | CSV parsing |
| jsPDF + AutoTable | 4.2.1 / 5.0.8 | PDF report generation |
| OxLint | 1.71.0 | Linting |

### Backend
| Technology | Version | Purpose |
|:---|:---|:---|
| Node.js | 16+ (20.19+ recommended) | Runtime |
| Express | 4.21.0 | Web framework |
| Sequelize | 6.37.3 | ORM for MySQL |
| MySQL2 | 3.11.0 | Database driver |
| JSON Web Token | 9.0.2 | Authentication |
| Bcrypt.js | 2.4.3 | Password hashing |
| Zod | 3.23.8 | Request validation |
| Helmet | 7.1.0 | Security headers |
| CORS | 2.8.5 | Cross-origin resource sharing |
| Express Rate Limit | 7.4.0 | API rate limiting |
| Node Cron | 3.0.3 | Scheduled jobs |
| Cookie Parser | 1.4.6 | Cookie handling |
| Nodemon | 3.1.4 | Dev auto-restart |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16+ (v20.19+ recommended)
- **MySQL** 5.7+ or 8.0+
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/hariprakash0804/expense-tracker.git
cd expense-tracker
```

### 2. Create MySQL Database

```sql
mysql -u root -p
CREATE DATABASE expense_tracker;
EXIT;
```

### 3. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your credentials:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=expense_tracker
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_ACCESS_SECRET=your_super_secret_access_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLIENT_URL=http://localhost:5173
FINNHUB_API_KEY=your_finnhub_api_key_here
```

> **Note:** The `FINNHUB_API_KEY` is optional. Without it, some live market data features will use fallback/mock data.

### 4. Install Dependencies & Start

**Terminal 1 — Backend:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm install
npm run dev
```

### 5. Open the App

Navigate to **http://localhost:5173** in your browser. The Vite dev server proxies `/api` requests to the Express backend on port 5000.

---

## 📁 Project Structure

```
expense-tracker/
├── client/                          # React + Vite frontend
│   ├── public/                      # Static assets (favicon, icons)
│   ├── src/
│   │   ├── assets/                  # Images (hero.png, react.svg, vite.svg)
│   │   ├── components/
│   │   │   ├── dashboard/           # InsightsCard (AI spending insights)
│   │   │   ├── expenses/            # CSVImporter (bulk CSV import)
│   │   │   └── layout/              # AppLayout, Header, Sidebar
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx      # JWT auth state & token refresh
│   │   │   ├── ThemeContext.jsx      # Dark/light mode toggle
│   │   │   └── ToastContext.jsx      # Global toast notifications
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Overview with stats & insights
│   │   │   ├── Expenses.jsx         # Expense CRUD with filters
│   │   │   ├── Income.jsx           # Income tracking & management
│   │   │   ├── Budget.jsx           # Category budgets with progress
│   │   │   ├── Analytics.jsx        # Charts & spending analysis
│   │   │   ├── Recurring.jsx        # Recurring expense manager
│   │   │   ├── Savings.jsx          # Savings goals & contributions
│   │   │   ├── Market.jsx           # Live market data dashboard
│   │   │   ├── Portfolio.jsx        # Investment portfolio tracker
│   │   │   ├── Projections.jsx      # Financial forecasting
│   │   │   ├── DebtPlanner.jsx      # Debt repayment strategies
│   │   │   ├── TaxPlanner.jsx       # Tax estimation tool
│   │   │   ├── BalanceSheet.jsx     # Assets vs. liabilities view
│   │   │   ├── BillSplitter.jsx     # Group expense splitting
│   │   │   ├── Calculators.jsx      # Financial calculators
│   │   │   ├── Achievements.jsx     # Gamified milestones
│   │   │   ├── Settings.jsx         # User preferences & profile
│   │   │   ├── Login.jsx            # Login page
│   │   │   └── Register.jsx         # Registration page
│   │   ├── services/
│   │   │   ├── api.js               # Axios instance with interceptors
│   │   │   └── dataService.js       # API service layer
│   │   ├── utils/
│   │   │   ├── helpers.js           # Formatting & utility functions
│   │   │   └── pdfExporter.js       # PDF report generation
│   │   ├── App.jsx                  # Root component with routes
│   │   ├── main.jsx                 # React entry point
│   │   ├── index.css                # Complete design system
│   │   └── App.css                  # App-level styles
│   ├── index.html                   # HTML entry point
│   ├── vite.config.js               # Vite config + API proxy
│   ├── vercel.json                  # SPA rewrite rules for Vercel
│   └── package.json
├── server/                          # Node.js + Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                # Sequelize database connection
│   │   ├── controllers/
│   │   │   ├── authController.js    # Register, login, token refresh, profile
│   │   │   ├── expenseController.js # CRUD, stats, insights, bulk ops
│   │   │   ├── budgetController.js  # Budget CRUD & status tracking
│   │   │   ├── recurringController.js # Recurring expense management
│   │   │   ├── incomeController.js  # Income CRUD
│   │   │   ├── savingsController.js # Savings goals & contributions
│   │   │   ├── debtController.js    # Debt tracking CRUD
│   │   │   ├── portfolioController.js # Investment holdings CRUD
│   │   │   └── marketController.js  # Market data & news APIs
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authentication middleware
│   │   │   ├── errorHandler.js      # Global error handler
│   │   │   ├── rateLimiter.js       # API & auth rate limiting
│   │   │   └── validate.js          # Zod schema validation
│   │   ├── models/
│   │   │   ├── User.js              # User model
│   │   │   ├── Expense.js           # Expense model
│   │   │   ├── Budget.js            # Budget model
│   │   │   ├── RecurringExpense.js   # Recurring expense model
│   │   │   ├── Income.js            # Income model
│   │   │   ├── SavingsGoal.js       # Savings goal model
│   │   │   ├── Debt.js              # Debt model
│   │   │   ├── PortfolioItem.js     # Portfolio holding model
│   │   │   └── index.js             # Model associations
│   │   ├── routes/
│   │   │   ├── authRoutes.js        # Auth endpoints
│   │   │   ├── expenseRoutes.js     # Expense endpoints
│   │   │   ├── budgetRoutes.js      # Budget endpoints
│   │   │   ├── recurringRoutes.js   # Recurring expense endpoints
│   │   │   ├── incomeRoutes.js      # Income endpoints
│   │   │   ├── savingsRoutes.js     # Savings goal endpoints
│   │   │   ├── debtRoutes.js        # Debt endpoints
│   │   │   ├── portfolioRoutes.js   # Portfolio endpoints
│   │   │   └── marketRoutes.js      # Market data endpoints
│   │   ├── schemas/
│   │   │   └── index.js             # Zod validation schemas
│   │   ├── jobs/
│   │   │   └── processRecurring.js  # Cron job for recurring expenses
│   │   ├── utils/
│   │   │   └── tokenHelpers.js      # JWT token generation helpers
│   │   └── app.js                   # Express app setup & middleware
│   ├── server.js                    # Entry point (DB connect, cron start)
│   ├── .env.example                 # Environment variable template
│   └── package.json
├── docs/
│   └── deployment_guide.md          # Production deployment manual
├── .gitignore
└── README.md
```

---

## 🔑 API Endpoints

All endpoints are prefixed with `/api`. Protected routes require a valid JWT access token.

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| POST | `/api/auth/register` | ❌ | Register a new user |
| POST | `/api/auth/login` | ❌ | Login and receive tokens |
| POST | `/api/auth/refresh` | ❌ | Refresh access token |
| POST | `/api/auth/logout` | ❌ | Logout and clear cookies |
| GET | `/api/auth/me` | ✅ | Get current user profile |
| PUT | `/api/auth/profile` | ✅ | Update user profile |
| PUT | `/api/auth/change-password` | ✅ | Change password |

### Expenses (`/api/expenses`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/expenses` | ✅ | List expenses (with filters & pagination) |
| POST | `/api/expenses` | ✅ | Create a new expense |
| GET | `/api/expenses/stats` | ✅ | Get expense analytics & statistics |
| GET | `/api/expenses/insights` | ✅ | Get AI-powered spending insights |
| POST | `/api/expenses/bulk-import` | ✅ | Bulk import expenses from CSV |
| POST | `/api/expenses/bulk-delete` | ✅ | Bulk delete multiple expenses |
| GET | `/api/expenses/:id` | ✅ | Get a single expense |
| PUT | `/api/expenses/:id` | ✅ | Update an expense |
| DELETE | `/api/expenses/:id` | ✅ | Delete an expense |

### Income (`/api/incomes`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/incomes` | ✅ | List all income entries |
| POST | `/api/incomes` | ✅ | Create an income entry |
| GET | `/api/incomes/:id` | ✅ | Get a single income entry |
| PUT | `/api/incomes/:id` | ✅ | Update an income entry |
| DELETE | `/api/incomes/:id` | ✅ | Delete an income entry |

### Budgets (`/api/budgets`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/budgets` | ✅ | List all budgets |
| GET | `/api/budgets/status` | ✅ | Get budget vs. actual spending |
| POST | `/api/budgets` | ✅ | Create or update a budget |
| DELETE | `/api/budgets/:id` | ✅ | Delete a budget |

### Recurring Expenses (`/api/recurring`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/recurring` | ✅ | List recurring expenses |
| POST | `/api/recurring` | ✅ | Create a recurring expense |
| PUT | `/api/recurring/:id` | ✅ | Update a recurring expense |
| PATCH | `/api/recurring/:id/toggle` | ✅ | Toggle active/inactive status |
| DELETE | `/api/recurring/:id` | ✅ | Delete a recurring expense |

### Savings Goals (`/api/savings`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/savings` | ✅ | List all savings goals |
| POST | `/api/savings` | ✅ | Create a savings goal |
| PUT | `/api/savings/:id` | ✅ | Update a savings goal |
| POST | `/api/savings/:id/contribute` | ✅ | Contribute to a savings goal |
| DELETE | `/api/savings/:id` | ✅ | Delete a savings goal |

### Debt Management (`/api/debts`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/debts` | ✅ | List all debts |
| POST | `/api/debts` | ✅ | Create a debt entry |
| PUT | `/api/debts/:id` | ✅ | Update a debt entry |
| DELETE | `/api/debts/:id` | ✅ | Delete a debt entry |

### Investment Portfolio (`/api/portfolio`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/portfolio` | ✅ | List all holdings |
| POST | `/api/portfolio` | ✅ | Add a new holding |
| PUT | `/api/portfolio/:id` | ✅ | Update a holding |
| DELETE | `/api/portfolio/:id` | ✅ | Delete a holding |

### Market Data (`/api/market`)

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/market/exchange-rates` | ❌ | Get currency exchange rates |
| GET | `/api/market/currencies` | ❌ | Get supported currencies list |
| GET | `/api/market/metals` | ✅ | Get gold/silver prices |
| GET | `/api/market/stocks` | ✅ | Get stock market data |
| GET | `/api/market/news` | ✅ | Get financial news headlines |
| GET | `/api/market/savings-rates` | ✅ | Get bank savings rates |

### Health Check

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/health` | ❌ | API health status |

---

## 🔧 Environment Variables

Create a `.env` file in the `server/` directory (use `.env.example` as a template):

| Variable | Default | Required | Description |
|:---|:---|:---:|:---|
| `PORT` | `5000` | ❌ | Backend server port |
| `DB_HOST` | `localhost` | ✅ | MySQL host |
| `DB_PORT` | `3306` | ❌ | MySQL port |
| `DB_NAME` | `expense_tracker` | ✅ | MySQL database name |
| `DB_USER` | `root` | ✅ | MySQL username |
| `DB_PASSWORD` | — | ✅ | MySQL password |
| `JWT_ACCESS_SECRET` | — | ✅ | Secret for access tokens |
| `JWT_REFRESH_SECRET` | — | ✅ | Secret for refresh tokens |
| `JWT_ACCESS_EXPIRY` | `15m` | ❌ | Access token TTL |
| `JWT_REFRESH_EXPIRY` | `7d` | ❌ | Refresh token TTL |
| `CLIENT_URL` | `http://localhost:5173` | ❌ | Frontend URL (for CORS) |
| `FINNHUB_API_KEY` | — | ❌ | Finnhub API key (live market data) |

---

## 🔒 Security Features

- **Helmet** — Secure HTTP headers
- **CORS** — Configurable cross-origin policy
- **Rate Limiting** — Separate limits for auth and general API routes
- **Bcrypt** — Salted password hashing
- **JWT** — Dual-token (access + refresh) with httpOnly cookies
- **Zod Validation** — Schema-based request validation on all inputs
- **404 Handler** — Graceful unknown route responses
- **Global Error Handler** — Centralized error processing

---

## 🚢 Deployment

### Frontend → Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Set the **Root Directory** to `client`
4. Set **Framework Preset** to `Vite`
5. **Build Command:** `npm run build`
6. **Output Directory:** `dist`
7. Add environment variable: `VITE_API_BASE_URL` = your Render backend URL + `/api`

> The `vercel.json` file handles SPA rewrites to prevent 404s on client-side routes.

### Backend → Render

1. Import the repository in [Render](https://render.com)
2. Set the **Root Directory** to `server`
3. **Build Command:** `npm install`
4. **Start Command:** `node server.js`
5. Add all environment variables from the table above
6. Use a managed MySQL service (e.g., Aiven, PlanetScale, Railway, or AWS RDS)

> 📖 See the full [deployment guide](docs/deployment_guide.md) for step-by-step instructions.

---

## 📦 Available Scripts

### Client

| Script | Command | Description |
|:---|:---|:---|
| Dev | `npm run dev` | Start Vite dev server on port 5173 |
| Build | `npm run build` | Create production build |
| Preview | `npm run preview` | Preview production build locally |
| Lint | `npm run lint` | Run OxLint |

### Server

| Script | Command | Description |
|:---|:---|:---|
| Dev | `npm run dev` | Start with Nodemon (auto-restart) |
| Start | `npm start` | Start production server |

---

## 🗄️ Database Models

The backend uses **Sequelize ORM** with the following data models, all associated to the `User` model:

| Model | Description |
|:---|:---|
| **User** | Authentication, profile, preferences |
| **Expense** | Individual expense records with category, payment method, tags |
| **Income** | Income entries with source and frequency |
| **Budget** | Monthly category budget limits |
| **RecurringExpense** | Auto-generated expense templates (daily/weekly/monthly/yearly) |
| **SavingsGoal** | Target-based savings with contribution tracking |
| **Debt** | Debt records with balance, interest rate, and minimum payment |
| **PortfolioItem** | Investment holdings (stocks, crypto, mutual funds) |

> Tables are auto-created on first run via Sequelize's `sync({ alter: true })`.

---

## 📄 License

MIT
