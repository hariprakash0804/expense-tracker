# 💰 ExpenseTracker — Full-Stack Financial Management App

A modern, premium expense tracker built with **React + Vite** (frontend) and **Node.js + Express + MySQL** (backend). Features multi-user authentication, rich analytics, budget tracking, recurring expenses, and real-time market data.

## ✨ Features

- **🔐 Multi-User Auth** — JWT-based with access/refresh tokens, httpOnly cookies
- **💳 Expense CRUD** — Add, edit, delete with categories, payment methods, and tags
- **🎯 Budget Tracking** — Set monthly budgets per category with animated progress bars
- **📊 Rich Analytics** — 5+ chart types (pie, bar, area, line) powered by Recharts
- **🔄 Recurring Expenses** — Auto-generate expenses daily, weekly, monthly, or yearly
- **📈 Market & News** — Gold/silver prices, stock data, exchange rates, savings rates, financial news
- **💱 Multi-Currency** — Support for multiple currencies with live exchange rates
- **🌙 Dark/Light Mode** — Premium glassmorphic design with smooth theme toggle
- **📤 Export** — Download expenses as CSV
- **📱 Responsive** — Works on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16+ (v20.19+ recommended)
- **MySQL** 5.7+ or 8.0+
- **npm** or **yarn**

### 1. Clone & Setup

```bash
cd "e:\expense tracker"
```

### 2. Create MySQL Database

```sql
mysql -u root -p
CREATE DATABASE expense_tracker;
EXIT;
```

### 3. Configure Environment

```bash
# Edit server/.env with your MySQL credentials
cd server
# Update DB_PASSWORD with your MySQL root password
```

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

Navigate to **http://localhost:5173** in your browser.

## 📁 Project Structure

```
expense-tracker/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Layout, common UI components
│   │   ├── contexts/          # Auth, Theme, Toast contexts
│   │   ├── pages/             # All app pages
│   │   ├── services/          # API service layer
│   │   ├── utils/             # Helpers and formatters
│   │   └── index.css          # Complete design system
│   └── vite.config.js         # Vite + API proxy config
├── server/                    # Node.js + Express backend
│   ├── src/
│   │   ├── config/            # Database connection
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Auth, rate limiter, error handler
│   │   ├── models/            # Sequelize models
│   │   ├── routes/            # API routes
│   │   ├── schemas/           # Zod validation
│   │   ├── jobs/              # Cron jobs
│   │   └── app.js             # Express setup
│   └── server.js              # Entry point
└── .gitignore
```

## 🔑 API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get profile |
| GET | `/api/expenses` | List expenses (filtered) |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/stats` | Analytics data |
| GET | `/api/budgets` | List budgets |
| POST | `/api/budgets` | Create/update budget |
| GET | `/api/budgets/status` | Budget vs actual |
| GET | `/api/recurring` | List recurring |
| POST | `/api/recurring` | Create recurring |
| GET | `/api/market/exchange-rates` | Exchange rates |
| GET | `/api/market/metals` | Gold/silver prices |
| GET | `/api/market/stocks` | Stock data |
| GET | `/api/market/news` | Financial news |
| GET | `/api/market/savings-rates` | Bank savings rates |

## 🔧 Environment Variables

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=expense_tracker
DB_USER=root
DB_PASSWORD=your_password
JWT_ACCESS_SECRET=your_secret
JWT_REFRESH_SECRET=your_secret
CLIENT_URL=http://localhost:5173
FINNHUB_API_KEY=optional_for_live_data
```

## 🚢 Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Set root directory to `client`
4. Build command: `npm run build`
5. Output directory: `dist`

### Backend (Render)
1. Import repo in [Render](https://render.com)
2. Set root directory to `server`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all environment variables
6. Use a managed MySQL service (PlanetScale, Railway, etc.)

## 📄 License

MIT
