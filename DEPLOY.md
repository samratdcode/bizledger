# BizLedger — Complete Deployment Guide

## What you have
```
bizledger/
├── backend/          ← Node.js API (deploy to Railway)
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── seed.js
│   │   ├── middleware/auth.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── businesses.js
│   │       ├── transactions.js
│   │       ├── transfers.js
│   │       ├── partners.js
│   │       ├── reports.js
│   │       └── dashboard.js
│   ├── prisma/schema.prisma
│   ├── package.json
│   └── .env.example
└── frontend/         ← React app (deploy to Vercel)
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── api.js
    │   ├── store.js
    │   ├── styles.js
    │   ├── screens/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── BizDetail.jsx
    │   │   ├── Transactions.jsx
    │   │   ├── Reports.jsx
    │   │   └── Partners.jsx
    │   └── components/
    │       ├── NavBar.jsx
    │       ├── AddEntryModal.jsx
    │       └── TransferModal.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## STEP 1 — Create a Supabase Database (Free)

1. Go to https://supabase.com → click **Start your project** → sign up free
2. Click **New Project**
   - Name: `bizledger`
   - Database password: choose a strong one, **save it**
   - Region: pick closest (e.g. Singapore for India)
3. Wait ~2 minutes for it to provision
4. Go to **Settings → Database → Connection string → URI**
5. Copy the URI — it looks like:
   ```
   postgresql://postgres:YOUR_PASSWORD@db.XXXX.supabase.co:5432/postgres
   ```
   Replace `[YOUR-PASSWORD]` with the password you saved.

---

## STEP 2 — Push your code to GitHub

1. Go to https://github.com → create a **new repository** called `bizledger`
2. On your computer, open terminal in the `bizledger/` folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial BizLedger codebase"
   git remote add origin https://github.com/YOUR_USERNAME/bizledger.git
   git push -u origin main
   ```

---

## STEP 3 — Deploy Backend on Railway (Free tier)

1. Go to https://railway.app → sign up with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your `bizledger` repo
4. Railway will detect it. When asked: **set the root directory to `backend`**
5. Click **Add Variables** and add these environment variables:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | (your Supabase URI from Step 1) |
   | `JWT_SECRET` | (run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` and paste output) |
   | `JWT_REFRESH_SECRET` | (run same command again for a different value) |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `30d` |
   | `PORT` | `4000` |
   | `ADMIN_PHONE` | `9999999999` (your phone number) |
   | `ADMIN_PASSWORD` | (pick a strong password) |
   | `ADMIN_NAME` | `Samrat Dutta` |

6. Railway will deploy. Once green, copy your **Railway URL** (looks like `bizledger-production.up.railway.app`)

7. **Run database setup** — in Railway dashboard, open the **Shell** tab and run:
   ```bash
   npm run db:push
   npm run db:seed
   ```
   You'll see: `✅ BizLedger seeded successfully`

---

## STEP 4 — Deploy Frontend on Vercel (Free)

1. Go to https://vercel.com → sign up with GitHub
2. Click **New Project → Import** your `bizledger` repo
3. Set **Root Directory** to `frontend`
4. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://YOUR_RAILWAY_URL/api` |

5. Click **Deploy** — takes about 1 minute
6. Copy your **Vercel URL** (e.g. `bizledger.vercel.app`)

7. Go back to Railway → add one more variable:

   | Key | Value |
   |-----|-------|
   | `FRONTEND_URL` | `https://your-app.vercel.app` |

   Then redeploy backend (Railway does this automatically).

---

## STEP 5 — First Login

1. Open your Vercel URL on your phone
2. Login with:
   - Phone: `9999999999` (or whatever you set in ADMIN_PHONE)
   - Password: whatever you set in ADMIN_PASSWORD
3. **Immediately go to Settings → Change Password**
4. Add it to your phone's home screen (Chrome → Share → Add to Home Screen) for app-like experience

---

## STEP 6 — Add Staff Users

Since there's no UI for this yet, add users directly via the Railway shell:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function addUser() {
  const hash = await bcrypt.hash('staff123', 12);
  await prisma.user.create({
    data: {
      name: 'Staff Name',
      phone: '9876543210',
      passwordHash: hash,
      role: 'staff',
    }
  });
  console.log('User created');
  await prisma.\$disconnect();
}
addUser();
"
```

---

## COSTS (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Free | ₹0 |
| Railway | Hobby | ~₹400/month |
| Vercel | Free | ₹0 |
| **Total** | | **~₹400/month** |

For zero cost: use Railway's free trial (500 hours/month — enough for personal use).

---

## LOCAL DEVELOPMENT (Testing on your computer)

### Backend
```bash
cd backend
cp .env.example .env
# Fill in .env with your Supabase URL and generated JWT secrets
npm install
npm run db:push
npm run db:seed
npm run dev
# API runs at http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

---

## TROUBLESHOOTING

**"Cannot connect to database"**
→ Check DATABASE_URL in Railway variables. Make sure Supabase password has no special characters or is URL-encoded.

**"Invalid token" on login**
→ Make sure JWT_SECRET is set in Railway and matches between deploys.

**Frontend shows blank page**
→ Check VITE_API_URL is set correctly in Vercel. Must include `/api` at the end.

**Staff can't login**
→ Make sure their `isActive` is true in the database.

**Balances look wrong**
→ The shared cash pool starts at ₹0. Add your opening balance as a "Cash IN" entry from the dashboard.

---

## ADDING OPENING BALANCES (Day 1 Setup)

When you first log in, all balances will be ₹0. Add your actual balances:

1. **Cash pool**: Add a "Cash IN" entry for each business, mode = "Cash Pool", description = "Opening balance"
2. **Bank accounts**: Go to Transfer → Fund Business Bank → enter each business's actual bank balance
3. After this, all future entries will flow correctly

---

*BizLedger v1.0 — Built for Chanchal Haldar, Monidipa Haldar, Suchismita Haldar,*
*Susmita Haldar, Shubham Roy, Samrat Dutta*
