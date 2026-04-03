const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// ✅ Config
const DEFAULT_PASSWORD = 'password123';

// ⚠️ Still sync (acceptable for mock only)
const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

// ✅ Helper to create user (clean + consistent)
const createUser = ({ id, name, email, role, isActive = true }) => ({
  id: id || uuidv4(), // ✅ consistent UUID fallback
  name: name.trim(),
  email: email.toLowerCase().trim(),
  password: hashedPassword,
  role,
  isActive,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// ✅ Mock DB
const db = {
  users: [
    createUser({
      id: 'admin-123',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
    }),
    createUser({
      id: 'analyst-123',
      name: 'Analyst User',
      email: 'analyst@example.com',
      role: 'analyst',
    }),
    createUser({
      id: 'viewer-123',
      name: 'Viewer User',
      email: 'viewer@example.com',
      role: 'viewer',
    }),
    createUser({
      id: 'inactive-123',
      name: 'Inactive User',
      email: 'inactive@example.com',
      role: 'viewer',
      isActive: false,
    }),
  ],

  records: [
    {
      id: uuidv4(),
      userId: 'analyst-123',
      amount: 5000,
      type: 'income',
      category: 'Salary',
      date: new Date('2026-03-01T10:00:00Z'),
      note: 'Monthly salary',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      userId: 'analyst-123',
      amount: 1500,
      type: 'expense',
      category: 'Rent',
      date: new Date('2026-03-05T10:00:00Z'),
      note: 'Monthly rent',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      userId: 'analyst-123',
      amount: 200,
      type: 'expense',
      category: 'Food',
      date: new Date('2026-03-06T12:00:00Z'),
      note: 'Grocery shopping',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      userId: 'admin-123',
      amount: 1000,
      type: 'income',
      category: 'Freelance',
      date: new Date('2026-03-10T15:00:00Z'),
      note: 'Side project',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      userId: 'admin-123',
      amount: 100,
      type: 'expense',
      category: 'Utilities',
      date: new Date('2026-03-12T09:00:00Z'),
      note: 'Electricity bill',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

module.exports = db;
