# Database Setup Guide

The application requires a PostgreSQL database.

## 1. Create the Database

Since the automatic setup script may encounter authentication issues depending on your local environment, please follow these steps:

### Option A: Command Line (Linux/Mac)

If you have a default PostgreSQL installation:

```bash
sudo -u postgres createdb inventory_demand
```

Then run the schema setup:

```bash
cd backend
npm run init-db
```

_(Note: I've added a script to package.json for this)_

### Option B: Manual Setup

1. Open your PostgreSQL tool (pgAdmin, DBeaver, or psql).
2. Create a database named `inventory_demand`.
3. Check `backend/.env` and update the credentials to match your local setup:
   ```
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   ```

## 2. Start the Backend

```bash
cd backend
npm start
```

The server will run on port **5000**.

## 3. Start the Frontend

```bash
cd frontend
npm run dev
```

The app will open at the URL shown in the terminal (usually http://localhost:5173).
