import { useState, useMemo, useEffect } from "react";
import { apiFetch } from "./api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard,
  FileText,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Shield,
  Eye,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Activity,
  Tag,
  Calendar,
  AlignLeft,
  Filter,
  RefreshCw,
} from "lucide-react";

// Mock data removed, fetching from backend now.

const CATEGORIES = [
  "Salary",
  "Freelance",
  "Consulting",
  "Rent",
  "Utilities",
  "Marketing",
  "Travel",
  "Other",
];
const fmtCurrency = (v) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(v);
const fmtDate = (d) => {
  if (!d) return "—";
  const str = String(d).includes("T") ? d : d + "T00:00:00";
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ── PALETTE ────────────────────────────────────────────────────────────────
const C = {
  income: "#10b981",
  expense: "#f59e0b",
  net: "#6366f1",
  admin: { bg: "#ede9fe", text: "#5b21b6" },
  analyst: { bg: "#dbeafe", text: "#1d4ed8" },
  viewer: { bg: "#f3f4f6", text: "#374151" },
  active: { bg: "#d1fae5", text: "#065f46" },
  inactive: { bg: "#fee2e2", text: "#991b1b" },
  PIE: ["#10b981", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6", "#f97316"],
};

// ── ROLE PERMISSIONS ───────────────────────────────────────────────────────
const CAN = {
  admin: {
    createRecord: true,
    editRecord: true,
    deleteRecord: true,
    manageUsers: true,
    viewAnalytics: true,
    viewRecords: true,
  },
  analyst: {
    createRecord: false,
    editRecord: false,
    deleteRecord: false,
    manageUsers: false,
    viewAnalytics: true,
    viewRecords: true,
  },
  viewer: {
    createRecord: false,
    editRecord: false,
    deleteRecord: false,
    manageUsers: false,
    viewAnalytics: false,
    viewRecords: false,
  },
};

// ── SMALL COMPONENTS ───────────────────────────────────────────────────────
const Badge = ({ children, colors }) => (
  <span
    style={{
      background: colors.bg,
      color: colors.text,
      fontSize: 11,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 99,
      textTransform: "capitalize",
      letterSpacing: 0.3,
    }}
  >
    {children}
  </span>
);

const RoleBadge = ({ role }) => (
  <Badge colors={C[role] || C.viewer}>{role}</Badge>
);
const StatusBadge = ({ status }) => <Badge colors={C[status]}>{status}</Badge>;

const StatCard = ({ label, value, icon: Icon, trend, color, sub }) => (
  <div
    style={{
      background: "#fff",
      border: "0.5px solid #e5e7eb",
      borderRadius: 14,
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
        {label}
      </span>
      <span
        style={{
          background: color + "18",
          color: color,
          padding: 6,
          borderRadius: 8,
          display: "flex",
        }}
      >
        <Icon size={15} />
      </span>
    </div>
    <div
      style={{
        fontSize: 26,
        fontWeight: 700,
        color: "#111827",
        letterSpacing: -0.5,
      }}
    >
      {value}
    </div>
    {sub && (
      <div
        style={{
          fontSize: 12,
          color: trend > 0 ? C.income : C.expense,
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        {trend > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{" "}
        {sub}
      </div>
    )}
  </div>
);

// ── MODAL ──────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        width: "100%",
        maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 22px",
          borderBottom: "0.5px solid #e5e7eb",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>
          {title}
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9ca3af",
            padding: 4,
          }}
        >
          <X size={18} />
        </button>
      </div>
      <div style={{ padding: "22px" }}>{children}</div>
    </div>
  </div>
);

const Input = ({ label, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "#374151",
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {label}
    </label>
    <input
      style={{
        border: "0.5px solid #d1d5db",
        borderRadius: 8,
        padding: "9px 12px",
        fontSize: 14,
        color: "#111827",
        outline: "none",
        background: "#f9fafb",
      }}
      {...props}
    />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "#374151",
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {label}
    </label>
    <select
      style={{
        border: "0.5px solid #d1d5db",
        borderRadius: 8,
        padding: "9px 12px",
        fontSize: 14,
        color: "#111827",
        outline: "none",
        background: "#f9fafb",
      }}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

const Btn = ({ children, onClick, variant = "primary", disabled, small }) => {
  const styles = {
    primary: { background: "#0f172a", color: "#fff", border: "none" },
    danger: {
      background: "#fee2e2",
      color: "#dc2626",
      border: "0.5px solid #fca5a5",
    },
    ghost: {
      background: "#f3f4f6",
      color: "#374151",
      border: "0.5px solid #e5e7eb",
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        borderRadius: 8,
        padding: small ? "6px 12px" : "9px 18px",
        fontSize: small ? 12 : 14,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "opacity 0.15s",
      }}
    >
      {children}
    </button>
  );
};

// ── RECORD FORM ────────────────────────────────────────────────────────────
const RecordForm = ({ initial = {}, onSave, onClose }) => {
  const [form, setForm] = useState({
    amount: initial.amount || "",
    type: initial.type || "income",
    category: initial.category || "Salary",
    date: (initial.date || new Date().toISOString()).slice(0, 10),
    note: initial.note || initial.notes || "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.amount && Number(form.amount) > 0 && form.date;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input
          label="Amount ($)"
          type="number"
          min="0"
          value={form.amount}
          onChange={set("amount")}
          placeholder="0.00"
        />
        <Select
          label="Type"
          value={form.type}
          onChange={set("type")}
          options={[
            { value: "income", label: "Income" },
            { value: "expense", label: "Expense" },
          ]}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Select
          label="Category"
          value={form.category}
          onChange={set("category")}
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={set("date")}
        />
      </div>
      <Input
        label="Notes"
        value={form.note}
        onChange={set("note")}
        placeholder="Optional description..."
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          marginTop: 4,
        }}
      >
        <Btn variant="ghost" onClick={onClose}>
          Cancel
        </Btn>
        <Btn
          disabled={!valid}
          onClick={() =>
            valid && onSave({ ...form, amount: Number(form.amount) })
          }
        >
          <CheckCircle size={14} /> Save Record
        </Btn>
      </div>
    </div>
  );
};

// ── ACCESS DENIED PAGE ─────────────────────────────────────────────────────
const AccessDeniedPage = ({ pageName }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      gap: 16,
      textAlign: "center",
      padding: 40,
    }}
  >
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: "#fee2e2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
      }}
    >
      <Shield size={32} color="#dc2626" />
    </div>
    <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 }}>
      Access Restricted
    </div>
    <div style={{ fontSize: 14, color: "#6b7280", maxWidth: 380, lineHeight: 1.6 }}>
      You don't have permission to view the <strong>{pageName}</strong> section.
      This area requires <strong>Analyst</strong> or <strong>Admin</strong> privileges.
    </div>
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5e7eb",
        borderRadius: 12,
        padding: "16px 24px",
        marginTop: 8,
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 13,
        color: "#92400e",
        background: "#fffbeb",
        border: "0.5px solid #fde68a",
      }}
    >
      <AlertCircle size={16} color="#d97706" />
      Contact your administrator if you need access.
    </div>
  </div>
);

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/users/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 40, borderRadius: 14, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', width: 400 }}>
        <h1 style={{ marginBottom: 20, fontSize: 24, fontWeight: 800 }}>FinFlow Login</h1>
        {error && <div style={{ color: '#ef4444', marginBottom: 15, fontSize: 13, background: '#fef2f2', padding: 10, borderRadius: 8 }}>{error}</div>}
        <div style={{ marginBottom: 15 }}>
          <Input label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" />
        </div>
        <div style={{ marginBottom: 25 }}>
          <Input label="Password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="password123" />
        </div>
        <Btn type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? "Logging in..." : "Login"}
        </Btn>
        <p style={{ marginTop: 20, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>Try: admin@example.com / password123</p>
      </form>
    </div>
  );
};

// ── PAGES ──────────────────────────────────────────────────────────────────
const DashboardPage = ({ role }) => {
  const can = CAN[role];
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch("/dashboard/summary")
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div style={{ padding: 20, color: "#ef4444" }}>Error loading dashboard: {error}</div>;
  if (!data) return <div style={{ padding: 20 }}>Loading dashboard data...</div>;

  const { totalIncome, totalExpense, netBalance, categoryTotals, recentTransactions, monthlyTrends, totalRecords } = data;

  const catArray = Object.entries(categoryTotals)
    .map(([name, vals]) => ({ name, value: vals.income + vals.expense }))
    .sort((a, b) => b.value - a.value);

  const trendArray = Object.entries(monthlyTrends)
    .map(([month, vals]) => ({ month, ...vals }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPI Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
        }}
      >
        <StatCard
          label="Total Income"
          value={fmtCurrency(totalIncome)}
          icon={TrendingUp}
          color={C.income}
          trend={1}
          sub="+8.2% vs last period"
        />
        <StatCard
          label="Total Expenses"
          value={fmtCurrency(totalExpense)}
          icon={TrendingDown}
          color={C.expense}
          trend={-1}
          sub="+3.1% vs last period"
        />
        <StatCard
          label="Net Balance"
          value={fmtCurrency(netBalance)}
          icon={DollarSign}
          color={C.net}
          trend={1}
          sub="Positive cash flow"
        />
        <StatCard
          label="Total Records"
          value={totalRecords}
          icon={Activity}
          color="#6366f1"
        />
      </div>

      {/* Charts Row */}
      {can.viewAnalytics ? (
        <div
          style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}
        >
          {/* Area Chart */}
          <div
            style={{
              background: "#fff",
              border: "0.5px solid #e5e7eb",
              borderRadius: 14,
              padding: "20px 22px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}
                >
                  Monthly Trends
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                  Income vs Expenses · 2024
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  fontSize: 12,
                  color: "#6b7280",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: C.income,
                      display: "inline-block",
                    }}
                  />{" "}
                  Income
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: C.expense,
                      display: "inline-block",
                    }}
                  />{" "}
                  Expenses
                </span>
              </div>
            </div>
            <div style={{ height: 230 }}>
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                  data={trendArray}
                  margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={C.income}
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor={C.income} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={C.expense}
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor={C.expense}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => "$" + v / 1000 + "k"}
                  />
                  <Tooltip
                    formatter={(v) => fmtCurrency(v)}
                    contentStyle={{
                      borderRadius: 10,
                      border: "0.5px solid #e5e7eb",
                      fontSize: 13,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke={C.income}
                    strokeWidth={2}
                    fill="url(#inc)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke={C.expense}
                    strokeWidth={2}
                    fill="url(#exp)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div
            style={{
              background: "#fff",
              border: "0.5px solid #e5e7eb",
              borderRadius: 14,
              padding: "20px 22px",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#111827",
                marginBottom: 4,
              }}
            >
              By Category
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>
              Spending distribution
            </div>
            <div style={{ height: 165 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={catArray.slice(0, 6)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={38}
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {catArray.slice(0, 6).map((_, i) => (
                      <Cell key={i} fill={C.PIE[i % C.PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => fmtCurrency(v)}
                    contentStyle={{
                      borderRadius: 10,
                      border: "0.5px solid #e5e7eb",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 5,
                marginTop: 8,
              }}
            >
              {catArray.slice(0, 5).map((c, i) => (
                <div
                  key={c.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: "#6b7280",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: C.PIE[i],
                        display: "inline-block",
                      }}
                    />
                    {c.name}
                  </span>
                  <span style={{ fontWeight: 600, color: "#374151" }}>
                    {fmtCurrency(c.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#fffbeb",
            border: "0.5px solid #fde68a",
            borderRadius: 14,
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <AlertCircle size={18} color="#d97706" />
          <span style={{ fontSize: 14, color: "#92400e" }}>
            Analytics charts are available for Analyst and Admin roles only.
          </span>
        </div>
      )}

      {/* Recent Activity */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e7eb",
          borderRadius: 14,
          padding: "20px 22px",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "#111827",
            marginBottom: 16,
          }}
        >
          Recent Activity
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Date", "Category", "Notes", "Type", "Amount"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: h === "Amount" ? "right" : "left",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    paddingBottom: 10,
                    borderBottom: "0.5px solid #f3f4f6",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((r, i) => (
              <tr
                key={r.id}
                style={{
                  borderBottom:
                    i < recentTransactions.length - 1 ? "0.5px solid #f9fafb" : "none",
                }}
              >
                <td
                  style={{ padding: "12px 0", fontSize: 13, color: "#6b7280" }}
                >
                  {fmtDate(r.date)}
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13 }}>
                  <span
                    style={{
                      background: "#f3f4f6",
                      color: "#374151",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    {r.category}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    fontSize: 13,
                    color: "#374151",
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.note || r.notes || "—"}
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <Badge
                    colors={
                      r.type === "income"
                        ? { bg: "#d1fae5", text: "#065f46" }
                        : { bg: "#fef3c7", text: "#92400e" }
                    }
                  >
                    {r.type}
                  </Badge>
                </td>
                <td
                  style={{
                    padding: "12px 0",
                    textAlign: "right",
                    fontSize: 13,
                    fontWeight: 700,
                    color: r.type === "income" ? C.income : C.expense,
                  }}
                >
                  {r.type === "income" ? "+" : "−"}
                  {fmtCurrency(r.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── RECORDS PAGE ───────────────────────────────────────────────────────────
const RecordsPage = ({ role }) => {
  const can = CAN[role];
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [modal, setModal] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    apiFetch("/records")
      .then(data => setRecords(data.records || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const filtered = useMemo(
    () =>
      records
        .filter((r) => {
          if (typeFilter !== "all" && r.type !== typeFilter) return false;
          if (catFilter !== "all" && r.category !== catFilter) return false;
          if (
            search &&
            typeof r.note === "string" &&
            !r.note.toLowerCase().includes(search.toLowerCase()) &&
            !r.category?.toLowerCase().includes(search.toLowerCase())
          )
            return false;
          return true;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [records, typeFilter, catFilter, search],
  );

  const saveRecord = async (form) => {
    try {
      if (modal.type === "add") {
        await apiFetch("/records", {
          method: "POST",
          body: JSON.stringify(form)
        });
      } else {
        await apiFetch(`/records/${modal.data.id}`, {
          method: "PUT",
          body: JSON.stringify(form)
        });
      }
      setModal(null);
      fetchRecords();
    } catch (e) {
      alert("Failed to save record: " + e.message);
    }
  };

  const deleteRecord = async (id) => {
    try {
      await apiFetch(`/records/${id}`, { method: "DELETE" });
      setModal(null);
      fetchRecords();
    } catch (e) {
      alert("Failed to delete record: " + e.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records..."
            style={{
              width: "100%",
              border: "0.5px solid #d1d5db",
              borderRadius: 8,
              padding: "9px 12px 9px 32px",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              background: "#f9fafb",
              color: "#111827",
            }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            border: "0.5px solid #d1d5db",
            borderRadius: 8,
            padding: "9px 12px",
            fontSize: 13,
            background: "#f9fafb",
            color: "#374151",
            outline: "none",
          }}
        >
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          style={{
            border: "0.5px solid #d1d5db",
            borderRadius: 8,
            padding: "9px 12px",
            fontSize: 13,
            background: "#f9fafb",
            color: "#374151",
            outline: "none",
          }}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {can.createRecord && (
          <Btn onClick={() => setModal({ type: "add" })}>
            <Plus size={14} /> Add Record
          </Btn>
        )}
      </div>

      {/* Summary bar */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          {
            label: "Showing",
            val: filtered.length + " records",
            color: "#6b7280",
          },
          {
            label: "Income",
            val: fmtCurrency(
              filtered
                .filter((r) => r.type === "income")
                .reduce((s, r) => s + r.amount, 0),
            ),
            color: C.income,
          },
          {
            label: "Expenses",
            val: fmtCurrency(
              filtered
                .filter((r) => r.type === "expense")
                .reduce((s, r) => s + r.amount, 0),
            ),
            color: C.expense,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff",
              border: "0.5px solid #e5e7eb",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
            }}
          >
            <span style={{ color: "#9ca3af" }}>{s.label}: </span>
            <span style={{ fontWeight: 700, color: s.color }}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e7eb",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {[
                "Date",
                "Type",
                "Category",
                "Notes",
                "Amount",
                ...(can.editRecord || can.deleteRecord ? ["Actions"] : []),
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign:
                      h === "Amount" || h === "Actions" ? "right" : "left",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    padding: "12px 16px",
                    borderBottom: "0.5px solid #e5e7eb",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>
                  Loading records...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: 32,
                    color: "#9ca3af",
                    fontSize: 14,
                  }}
                >
                  No records match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom:
                      i < filtered.length - 1 ? "0.5px solid #f3f4f6" : "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#fafafa")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      color: "#6b7280",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmtDate(r.date)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge
                      colors={
                        r.type === "income"
                          ? { bg: "#d1fae5", text: "#065f46" }
                          : { bg: "#fef3c7", text: "#92400e" }
                      }
                    >
                      {r.type}
                    </Badge>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    >
                      {r.category}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      color: "#374151",
                      maxWidth: 220,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.note || r.notes || "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontWeight: 700,
                      fontSize: 14,
                      color: r.type === "income" ? C.income : C.expense,
                    }}
                  >
                    {r.type === "income" ? "+" : "−"}
                    {fmtCurrency(r.amount)}
                  </td>
                  {(can.editRecord || can.deleteRecord) && (
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          justifyContent: "flex-end",
                        }}
                      >
                        {can.editRecord && (
                          <button
                            onClick={() => setModal({ type: "edit", data: r })}
                            style={{
                              background: "#f0f9ff",
                              color: "#0369a1",
                              border: "none",
                              borderRadius: 6,
                              padding: "5px 8px",
                              cursor: "pointer",
                              display: "flex",
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {can.deleteRecord && (
                          <button
                            onClick={() =>
                              setModal({ type: "delete", data: r })
                            }
                            style={{
                              background: "#fff1f2",
                              color: "#e11d48",
                              border: "none",
                              borderRadius: 6,
                              padding: "5px 8px",
                              cursor: "pointer",
                              display: "flex",
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal && modal.type === "add" && (
        <Modal title="Add Financial Record" onClose={() => setModal(null)}>
          <RecordForm onSave={saveRecord} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal && modal.type === "edit" && (
        <Modal title="Edit Record" onClose={() => setModal(null)}>
          <RecordForm
            initial={modal.data}
            onSave={saveRecord}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal && modal.type === "delete" && (
        <Modal title="Delete Record" onClose={() => setModal(null)}>
          <div style={{ fontSize: 14, color: "#374151", marginBottom: 20 }}>
            Are you sure you want to delete this record? This action cannot be
            undone.
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 8,
                padding: 12,
                marginTop: 14,
                fontSize: 13,
                color: "#6b7280",
              }}
            >
              <strong style={{ color: "#111827" }}>
                {modal.data.category}
              </strong>{" "}
              — {fmtCurrency(modal.data.amount)} on {fmtDate(modal.data.date)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Btn>
            <Btn variant="danger" onClick={() => deleteRecord(modal.data.id)}>
              <Trash2 size={13} /> Delete
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── USERS PAGE ─────────────────────────────────────────────────────────────
const UsersPage = ({ role, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const can = CAN[role];

  useEffect(() => {
    if (can.manageUsers) fetchUsers();
  }, [can.manageUsers]);

  const fetchUsers = () => {
    setLoading(true);
    apiFetch("/users")
      .then(data => setUsers(data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  if (!can.manageUsers) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
          background: "#fff",
          borderRadius: 14,
          border: "0.5px solid #e5e7eb",
          gap: 14,
          textAlign: "center",
        }}
      >
        <div style={{ background: "#fef3c7", padding: 16, borderRadius: 50 }}>
          <Shield size={28} color="#d97706" />
        </div>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#111827" }}>
          Access Restricted
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", maxWidth: 320 }}>
          User management is available to Admin role only. Switch your role
          using the selector in the sidebar.
        </div>
      </div>
    );
  }

  const toggleStatus = async (id, currentIsActive) => {
    try {
      await apiFetch(`/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentIsActive })
      });
      fetchUsers();
    } catch (e) {
      alert("Failed to update status: " + e.message);
    }
  };

  const changeRole = async (id, newRole) => {
    try {
      await apiFetch(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole })
      });
      fetchUsers();
    } catch (e) {
      alert("Failed to update role: " + e.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { label: "Total Users", val: users.length },
          {
            label: "Active",
            val: users.filter((u) => u.isActive).length,
          },
          {
            label: "Inactive",
            val: users.filter((u) => !u.isActive).length,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff",
              border: "0.5px solid #e5e7eb",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
            }}
          >
            <span style={{ color: "#9ca3af" }}>{s.label}: </span>
            <span style={{ fontWeight: 700, color: "#111827" }}>{s.val}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e7eb",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["User", "Email", "Role", "Status", "Joined", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      padding: "12px 16px",
                      borderBottom: "0.5px solid #e5e7eb",
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>
                  No users found.
                </td>
              </tr>
            ) : users.map((u, i) => (
              <tr
                key={u.id}
                style={{
                  borderBottom:
                    i < users.length - 1 ? "0.5px solid #f3f4f6" : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fafafa")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <td style={{ padding: "14px 16px" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "#e0e7ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#4338ca",
                        flexShrink: 0,
                      }}
                    >
                      {u.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {u.name}
                    </span>
                  </div>
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  {u.email}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <select
                    value={u.role}
                    disabled={u.id === currentUser?.id}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    style={{
                      border: "0.5px solid #d1d5db",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 12,
                      background: u.id === currentUser?.id ? "#e5e7eb" : "#f9fafb",
                      color: u.id === currentUser?.id ? "#9ca3af" : "#374151",
                      outline: "none",
                      cursor: u.id === currentUser?.id ? "not-allowed" : "pointer"
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="analyst">Analyst</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <StatusBadge status={u.isActive ? "active" : "inactive"} />
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  {fmtDate(u.createdAt)}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <button
                    disabled={u.id === currentUser?.id}
                    onClick={() => toggleStatus(u.id, u.isActive)}
                    style={{
                      background: u.id === currentUser?.id 
                        ? "#f3f4f6" 
                        : u.isActive ? "#fff1f2" : "#d1fae5",
                      color: u.id === currentUser?.id 
                        ? "#9ca3af"
                        : u.isActive ? "#e11d48" : "#065f46",
                      border: "none",
                      borderRadius: 6,
                      padding: "5px 10px",
                      cursor: u.id === currentUser?.id ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── BAR CHART PAGE ─────────────────────────────────────────────────────────
const AnalyticsPage = ({ role }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (CAN[role].viewAnalytics) {
      apiFetch("/dashboard/summary").then(setData).catch(console.error);
    }
  }, [role]);

  if (!CAN[role].viewAnalytics) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
          background: "#fff",
          borderRadius: 14,
          border: "0.5px solid #e5e7eb",
          gap: 14,
          textAlign: "center",
        }}
      >
        <div style={{ background: "#fef3c7", padding: 16, borderRadius: 50 }}>
          <BarChart2 size={28} color="#d97706" />
        </div>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#111827" }}>
          Analytics Restricted
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", maxWidth: 320 }}>
          Detailed analytics are available for Analyst and Admin roles. Switch
          your role in the sidebar.
        </div>
      </div>
    );
  }

  if (!data) return <div style={{ padding: 20 }}>Loading analytics...</div>;

  const catData = Object.entries(data.categoryTotals || {})
    .map(([cat, v]) => ({ cat, ...v }))
    .sort((a, b) => b.income + b.expense - (a.income + a.expense));
  
  const trendData = Object.entries(data.monthlyTrends || {})
    .map(([month, vals]) => ({ month, ...vals }))
    .sort((a, b) => a.month.localeCompare(b.month)); // Chronological sorting fixed

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e7eb",
          borderRadius: 14,
          padding: "20px 22px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Category Breakdown
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
          Detailed comparison of Incomes vs Expenses across all categories
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 13,
            color: "#4b5563",
            marginBottom: 16,
            fontWeight: 500,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                background: C.income,
                display: "inline-block",
                boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)"
              }}
            />{" "}
            Income
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                background: C.expense,
                display: "inline-block",
                boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)"
              }}
            />{" "}
            Expenses
          </span>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={catData}
              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="cat"
                tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => "$" + v / 1000 + "k"}
                dx={-10}
              />
              <Tooltip
                formatter={(v) => fmtCurrency(v)}
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                  fontSize: 13,
                  fontWeight: 500,
                  padding: "10px 14px"
                }}
              />
              <Bar dataKey="income" fill={C.income} radius={[6, 6, 0, 0]} barSize={35} />
              <Bar dataKey="expense" fill={C.expense} radius={[6, 6, 0, 0]} barSize={35} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e7eb",
          borderRadius: 14,
          padding: "20px 22px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Monthly Cash Flow
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
          Your true net balance velocity month over month
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trendData}
              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"}
                dx={-10}
              />
              <Tooltip
                formatter={(v) => fmtCurrency(v)}
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                  fontSize: 13,
                  fontWeight: 500,
                  padding: "10px 14px"
                }}
              />
              <Bar dataKey="net" radius={[6, 6, 6, 6]} barSize={45}>
                {trendData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.net >= 0 ? C.income : C.expense} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (u) => setUser(u);
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const role = user.role;

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "records", label: "Records", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "users", label: "Users", icon: Users },
  ];

  const PAGE_TITLES = {
    dashboard: "Dashboard Overview",
    records: "Financial Records",
    analytics: "Analytics",
    users: "User Management",
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#f1f5f9",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* SIDEBAR */}
      <div
        style={{
          width: 230,
          background: "#0f172a",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          padding: "0 0 20px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "22px 20px 18px",
            borderBottom: "0.5px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: "#10b981",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DollarSign size={16} color="#fff" />
            </div>
            <div>
              <div
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 15,
                  letterSpacing: -0.3,
                }}
              >
                FinFlow
              </div>
              <div
                style={{
                  color: "#64748b",
                  fontSize: 10,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                Finance Dashboard
              </div>
            </div>
          </div>
        </div>

        {/* Role Switcher */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "0.5px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 8,
            }}
          >
            Logged in as
          </div>
          <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>
            {user.name}
          </div>
          <div style={{ color: "#64748b", fontSize: 12 }}>{user.email}</div>
          <Btn
            variant="ghost"
            onClick={handleLogout}
            style={{
              marginTop: 10,
              background: "rgba(255,255,255,0.07)",
              color: "#e2e8f0",
              width: "100%",
              justifyContent: "center",
              height: 30,
              fontSize: 12,
            }}
          >
            Logout
          </Btn>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10b981",
              }}
            />
            <span style={{ fontSize: 11, color: "#64748b" }}>
              {role === "admin"
                ? "Full system access"
                : role === "analyst"
                  ? "Read + analytics"
                  : "View only"}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: "12px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = page === id;
            return (
              <button
                key={id}
                onClick={() => setPage(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  transition: "background 0.15s",
                  background: active ? "rgba(16,185,129,0.15)" : "transparent",
                  color: active ? "#10b981" : "#94a3b8",
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                }}
              >
                <Icon size={16} />
                {label}
                {id === "records" && !CAN[role].viewRecords && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: "rgba(239,68,68,0.2)",
                      color: "#f87171",
                      fontSize: 9,
                      padding: "2px 5px",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    LOCKED
                  </span>
                )}
                {id === "users" && !CAN[role].manageUsers && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: "rgba(239,68,68,0.2)",
                      color: "#f87171",
                      fontSize: 9,
                      padding: "2px 5px",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    LOCKED
                  </span>
                )}
                {id === "analytics" && !CAN[role].viewAnalytics && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: "rgba(239,68,68,0.2)",
                      color: "#f87171",
                      fontSize: 9,
                      padding: "2px 5px",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    LOCKED
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Permissions Info */}
        <div
          style={{
            margin: "0 10px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 10,
            padding: "12px 14px",
            border: "0.5px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 8,
            }}
          >
            Permissions
          </div>
          {[
            { label: "View records", key: "viewRecords" },
            { label: "Create records", key: "createRecord" },
            { label: "Edit/Delete", key: "editRecord" },
            { label: "Analytics", key: "viewAnalytics" },
            { label: "Manage users", key: "manageUsers" },
          ].map((p) => (
            <div
              key={p.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 5,
                fontSize: 12,
                color: "#64748b",
              }}
            >
              <span>{p.label}</span>
              {CAN[role][p.key] ? (
                <CheckCircle size={12} color="#10b981" />
              ) : (
                <X size={12} color="#ef4444" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Topbar */}
        <div
          style={{
            background: "#fff",
            borderBottom: "0.5px solid #e5e7eb",
            padding: "14px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: -0.5,
              }}
            >
              {PAGE_TITLES[page]}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#94a3b8",
                marginTop: 2,
              }}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                background: C[role]?.bg || "#f3f4f6",
                color: C[role]?.text || "#374151",
                padding: "6px 12px",
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 700,
                textTransform: "capitalize",
                letterSpacing: 0.3,
              }}
            >
              {role} Access
            </div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#e0e7ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#4338ca",
              }}
            >
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {page === "dashboard" && <DashboardPage role={role} />}
          {page === "records" && (
            CAN[role].viewRecords
              ? <RecordsPage role={role} />
              : <AccessDeniedPage pageName="Records" />
          )}
          {page === "analytics" && (
            CAN[role].viewAnalytics
              ? <AnalyticsPage role={role} />
              : <AccessDeniedPage pageName="Analytics" />
          )}
          {page === "users" && (
            CAN[role].manageUsers
              ? <UsersPage role={role} currentUser={user} />
              : <AccessDeniedPage pageName="User Management" />
          )}
        </div>
      </div>
    </div>
  );
}
