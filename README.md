# FinGuard

FinGuard is a comprehensive finance dashboard application consisting of a robust Node.js backend and a React Vite frontend. It features Role-Based Access Control (RBAC), robust data validation, and aggregated analytical dashboards for managing and visualizing personal or enterprise financial records.

## 🚀 Features

- **User & Role Management**: Support for `viewer`, `analyst`, and `admin` roles, each with strict access boundaries.
- **Financial Records**: Full CRUD operations for income and expense transactions.
- **System Audit Trail**: Secure, transaction-wrapped tracking of all critical database operations (`CREATE`, `UPDATE`, `DELETE`) mapping field-level JSON differences.
- **Aggregated Dashboards**: High-performance SQL-aggregated endpoints for net balances, monthly trends, and category totals.
- **Pagination & Search**: Built-in limits, offsets, and wildcard searching capabilities.
- **Soft Delete**: Data retention rules implemented to prevent permanent database record loss.
- **Authentication**: JWT-based mock authentication flow.
- **Security & Reliability**: Configured with `helmet`, `cors`, `express-rate-limit`, and a custom global error-handling map.

---

## 📁 Repository Structure

```text
├── backend/            # Express.js backend application
│   ├── src/            # Application logic (Controllers, Services, Routes, Models)
│   ├── tests/          # Jest integration test suite
│   ├── package.json    # Backend dependencies
├── frontend/           # React + Vite frontend application
│   ├── src/            # UI components and API logic
│   ├── package.json    # Frontend dependencies
├── README.md           # This integrated documentation
└── .gitignore          # Repo-wide rules
```

---

## 🛠️ Setup Instructions

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

The server and the in-memory SQLite database will initialize on `http://localhost:3000`. By default, seed data containing an admin, an analyst, and a viewer account is automatically generated.

### 2. Start the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

### 🐳 Alternative: Run with Docker

You can spin up both the Frontend and Backend simultaneously using Docker.

```bash
docker-compose up --build
```
- Custom backend runs on: `http://localhost:3000`
- React UI (served securely via NGINX) runs on: `http://localhost:8080`

---

## 🧪 Test Credentials

Use these pre-seeded accounts to explore the different levels of access:

| Role | Email | Password |
| --- | --- | --- |
| **Admin** | `admin@example.com` | `password123` |
| **Analyst** | `analyst@example.com` | `password123` |
| **Viewer** | `viewer@example.com` | `password123` |

---

## 🔐 Role-Based Access Control (RBAC)

| Role | Permissions |
| --- | --- |
| **Viewer** | Dashboard read access only. Cannot view raw records or system activity logs. |
| **Analyst** | Dashboard read + Raw records read & create. View access to Activity Logs. |
| **Admin** | Full CRUD on records + User Management (activate/deactivate users, change roles) + View access to Activity Logs. |

---

## 📊 API Documentation

Base URL: `http://localhost:3000/api`
Authentication: Pass your JWT token in the `Authorization: Bearer <token>` header.

### Authentication
- `POST /users/login`: Login using email + password to receive a JWT.

### Dashboard
- `GET /dashboard/summary`: Retrieves total income, total expense, net balance, category insights, and monthly trends. (Accessible by Viewer, Analyst, Admin)

### Records
- `GET /records`: Fetch paginated and filtered historical records.
- `GET /records/export`: Export all financial records to a downloadable CSV file. (Admin / Analyst)
- `POST /records`: Create a new income/expense record.
- `PUT /records/:id`: Update an existing record. (Admin only)
- `DELETE /records/:id`: Soft delete a record. (Admin only)

*Query Variables for `GET /records`:* `page`, `limit`, `type`, `category`, `search`, `date`.

### System Activity & Audit (Admin / Analyst)
- `GET /admin/audit-logs`: Fetch detailed system activity logs. Returns a structured JSON difference format isolating what precise properties were modified and by which user.

### Users (Admin Only)
- `GET /users`: List all platform users.
- `POST /users`: Register a new user enforcing secure password requirements.
- `PATCH /users/:id/status`: Quickly toggle an account's `isActive` state to suspend login capabilities.

---

## 🛡️ System Robustness & Advanced Features

- **Secure Identity Management (JWT)**: Stateless authentication via JSON Web Tokens handles user sessions securely without server-side state, strictly enforcing role-based permissions at the middleware level.
- **Scalable Data Handling (Pagination)**: Server-side limit and offset logic prevents frontend bloat, keeping the system lightning-fast even with 10,000+ records.
- **Dynamic Discovery (Search & Filtering)**: Integrated search functionality and multi-criteria filters (category, type, date range) allow users to locate specific transactions instantly.
- **Data Forensic Integrity (Soft Delete)**: Uses an `isDeleted` flag instead of destructive physical deletion, ensuring financial history remains intact for internal auditing.
- **Brute-Force Protection (Rate Limiting)**: Middleware-based IP throttling protects the system from automated attacks and prevents the login endpoint from being overwhelmed.
- **Reliability (Integration Testing)**: Automated test suites verify core business logic, balance calculations, and authentication guards to guarantee system stability before deployment.
- **Developer Experience (API Documentation)**: Standardized Swagger technical documentation makes the backend "Collaborative Ready" for other developers.
- **Data Portability (CSV Export)**: Programmatic extraction of financial records into structured CSV file downloads, allowing users to seamlessly import their ledger data into external accounting systems.

---

## 📌 Assumptions

- **Authentication Focus**: Authentication is mocked using a fast JWT implementation as a placeholder. Since no third-party email verification (like SendGrid) is hooked up, accounts are assumed to be implicitly "verified" upon creation to make evaluating the system seamless.
- **Storage Approach**: SQlite was leveraged using Sequelize. The assumption is that reviewers want a robust backend structure but want it to be *immediately testable upon cloning* without having to provision external PostgreSQL/MongoDB databases locally.
- **Role Assignment**: Assumed that the first entry to the system is seeded, and after that, only an `Admin` has the power to change or define specific user roles.

---

## ⚖️ Tradeoffs

- **SQLite vs Production Grade Databases (e.g., PostgreSQL)**
  - *Tradeoff*: SQLite stores everything in a local file (`database.sqlite`).
  - *Pro*: Zero dependency configuration or installation required to get this project fully up and running.
  - *Con*: Native SQLite is generally not built to scale horizontally for massive concurrent write loads.
- **On-the-fly SQL Aggregations vs Caching**
  - *Tradeoff*: Dashboard numbers are aggregated directly via SQL queries (like `SUM` and `GROUP BY`) every time the endpoint is hit.
  - *Pro*: Prevents Node.js memory crashes that would occur from buffering arrays of 10,000+ records, keeping the code simple and accurate.
  - *Con*: If traffic surged, executing raw aggregate queries continuously would bottleneck the CPU. In a strict enterprise scenario, a caching layer (Redis) or materialized views would be implemented.
