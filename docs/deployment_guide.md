# 🚀 Production Deployment Manual

This guide walks you through deploying your full-stack Expense Tracker application using **Render** (backend database and Express server) and **Vercel** (frontend Vite SPA).

---

## 💾 1. Backend Database Setup (Render MySQL)

1. Sign in to your **Render** dashboard.
2. Click **New +** and select **PostgreSQL** or choose to link an external MySQL database service (e.g., Aiven, PlanetScale, or hosting providers like Railway/AWS RDS).
   > [!IMPORTANT]
   > Since Render does not host a native MySQL instance directly as a one-click server, you can create a **MySQL Database** on providers like **Aiven** (free tier available) or **Railway** and capture its connection URI.
3. Obtain your database credentials:
   - Hostname (e.g. `mysql-instance.aivencloud.com`)
   - Port (e.g. `25433`)
   - Database Name
   - User Name
   - Database Password

---

## ⚡ 2. Backend API Deployment (Render Web Service)

1. Click **New +** on the Render dashboard and choose **Web Service**.
2. Link your GitHub repository.
3. Configure the following service settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js` (Ensure your database synchronization triggers are active).
4. Go to **Advanced** and declare the following **Environment Variables**:
   - `PORT`: `10000` (or leave default Render auto-port)
   - `NODE_ENV`: `production`
   - `DB_HOST`: *[Your MySQL host URL]*
   - `DB_PORT`: *[Your MySQL port, e.g. 3306]*
   - `DB_NAME`: *[Your database name]*
   - `DB_USER`: *[Your database user]*
   - `DB_PASS`: *[Your database password]*
   - `JWT_SECRET`: *[A long, secure random string]*
   - `JWT_REFRESH_SECRET`: *[Another secure random string]*
   - `CLIENT_URL`: *[Your Vercel deployment URL, e.g. https://my-expense-tracker.vercel.app]*
5. Click **Create Web Service**. Render will build and deploy the backend! Note your backend URL (e.g. `https://expense-tracker-backend.onrender.com`).

---

## 🎨 3. Frontend Deployment (Vercel)

1. Sign in to your **Vercel** dashboard.
2. Click **Add New** and select **Project**.
3. Import your GitHub repository.
4. Select the `client` directory as the project root.
5. In **Framework Preset**, select **Vite**.
6. Set the **Build Command** to `npm run build` and **Output Directory** to `dist`.
7. Expand **Environment Variables** and add:
   - `VITE_API_BASE_URL`: `https://expense-tracker-backend.onrender.com/api` (Verify this matches your Render Web Service URL with `/api` appended).
8. Click **Deploy**. Vercel will bundle the Vite app and launch it!

---

## ⚙️ Routing Refreshes & SPA Support
* The [vercel.json](file:///e:/expense%20tracker/client/vercel.json) file at the root of the client folder handles redirection of sub-pages back to `index.html` to avoid 404 errors during client-side React Router navigations.
