# SME ERP System

A full-stack ERP dashboard built for a real SME client, replacing manual, spreadsheet-based operations with a single system for sales billing, inventory management, and financial reporting.

🔗 **Live:** [kapis-admin.vercel.app](https://kapis-admin.vercel.app)
🛠️ **Status:** Deployed and in active use by the client

---

## Overview

[2-4 sentences: What was the client's problem before this existed? e.g. "The client previously tracked billing, stock, and daily financials manually across spreadsheets, causing delays and reconciliation errors. This system consolidates those workflows into one dashboard used daily by staff for billing, inventory checks, and financial reporting."]

**Who uses it:** [e.g. "Sales staff for billing, inventory managers for stock tracking, owner/accountant for financial daybook review"]

---

## Key Modules

### 🧾 Sales Billing
- [Describe: How is an invoice created? Line items, tax calculation, customer records, PDF/print output?]
- [Any validation, discount rules, or payment status tracking?]

### 📦 Inventory Management
- Real-time stock level tracking
- [Low-stock alerts? Stock-in/stock-out logging? Batch/SKU tracking?]
- [How does inventory update when a sale is billed — automatic deduction?]

### 📊 Financial Daybook & Analytics
- Real-time dashboards for [daily sales, revenue trends, expense tracking — specify what's actually shown]
- [Chart library used — Recharts? Any date-range filtering?]

### 🔐 Access Control
- [If implemented: role-based access — e.g. admin vs. staff views. If not implemented, remove this section.]

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React.js |
| Backend / Data | MongoDB |
| Deployment | Vercel |
| Styling | [Tailwind CSS / CSS Modules — confirm which] |

---

## Architecture

[Optional but strong for a full-stack story: a short paragraph or simple diagram of how frontend talks to MongoDB — direct API routes in Next.js? Separate backend service? This is a good spot to show full-stack thinking, not just UI work.]

---

## Screenshots

<!-- This section matters a lot for recruiters skimming — add 3-4 real screenshots -->
<!-- ![Dashboard Overview](./screenshots/dashboard.png) -->
<!-- ![Billing Screen](./screenshots/billing.png) -->
<!-- ![Inventory View](./screenshots/inventory.png) -->

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB instance (local or Atlas)

### Installation

```bash
git clone https://github.com/Pvekariya/SME_ERP.git
cd SME_ERP
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```
MONGODB_URI=your_mongodb_connection_string
[list any other required env vars — auth secrets, API keys, etc.]
```

### Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Challenges & Learnings

[Optional but valuable — 2-3 bullets on real technical decisions, e.g. "Handling real-time inventory sync without over-fetching," "Structuring MongoDB schemas for fast daybook aggregation queries." This is what separates a tutorial project from real engineering in a recruiter's eyes.]

---

## Roadmap

- [ ] [Any planned features — multi-branch support, GST invoicing, export to Excel, etc.]

---

## Author

**Pratik Vekariya**
Full Stack Developer
[LinkedIn](https://www.linkedin.com/in/pratik-vekariya-95a319246) · [GitHub](https://github.com/Pvekariya) · [Portfolio](#)
