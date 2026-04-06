const app = require('./app');
const sequelize = require('./store/database');
const User = require('./models/user');
const Record = require('./models/record');
const AuditLog = require('./models/auditLog');
const bcrypt = require('bcryptjs');

// Setup Associations
const models = { User, Record, AuditLog };
if (User.associate) User.associate(models);
if (AuditLog.associate) AuditLog.associate(models);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Finance Dashboard API is running' });
});

async function startServer() {
  try {
    await sequelize.sync();
    console.log('Database synced successfully');

    // Seed data if empty
    const count = await User.count();
    if (count === 0) {
      console.log('Seeding initial data...');
      
      const adminPass = bcrypt.hashSync('password123', 10);
      
      await User.bulkCreate([
        { name: 'Admin User', email: 'admin@example.com', password: adminPass, role: 'admin' },
        { name: 'Analyst User', email: 'analyst@example.com', password: adminPass, role: 'analyst' },
        { name: 'Viewer User', email: 'viewer@example.com', password: adminPass, role: 'viewer' },
      ]);
      
      const admin = await User.findOne({ where: { email: 'admin@example.com' } });
      
      const recordsToSeed = [];
      const months = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04'];
      
      for (const month of months) {
        // Base Income
        recordsToSeed.push({ userId: admin.id, amount: 5000, type: 'income', category: 'Salary', date: `${month}-01`, note: 'TechCorp Salary' });
        
        // Dynamic Incomes
        if (month === '2025-12') {
          recordsToSeed.push({ userId: admin.id, amount: 2500, type: 'income', category: 'Bonus', date: `${month}-15`, note: 'Year-end Performance Bonus' });
        }
        if (['2025-11', '2026-01', '2026-03', '2026-04'].includes(month)) {
          recordsToSeed.push({ userId: admin.id, amount: 900 + Math.floor(Math.random()*400), type: 'income', category: 'Freelance', date: `${month}-20`, note: 'Independent Consulting' });
        }

        // Fixed Expenses
        recordsToSeed.push({ userId: admin.id, amount: 1800, type: 'expense', category: 'Rent', date: `${month}-02`, note: 'Downtown Apartment Rent' });
        recordsToSeed.push({ userId: admin.id, amount: 140, type: 'expense', category: 'Utilities', date: `${month}-05`, note: 'Water, Electric, Internet' });
        recordsToSeed.push({ userId: admin.id, amount: 110, type: 'expense', category: 'Insurance', date: `${month}-28`, note: 'Health & Auto Insurance' });
        
        // Variable Expenses (randomized to make charts look dynamic)
        recordsToSeed.push({ userId: admin.id, amount: 450 + Math.floor(Math.random()*100), type: 'expense', category: 'Groceries', date: `${month}-08`, note: 'Supermarket Runs' });
        recordsToSeed.push({ userId: admin.id, amount: 150 + Math.floor(Math.random()*80), type: 'expense', category: 'Transport', date: `${month}-14`, note: 'Gas & Ride Shares' });
        recordsToSeed.push({ userId: admin.id, amount: 250 + Math.floor(Math.random()*250), type: 'expense', category: 'Entertainment', date: `${month}-22`, note: 'Dining Out & Movies' });
        recordsToSeed.push({ userId: admin.id, amount: 80 + Math.floor(Math.random()*30), type: 'expense', category: 'Subscriptions', date: `${month}-25`, note: 'Software & Streaming Services' });
      }

      const createdRecords = await Record.bulkCreate(recordsToSeed);
      
      // Fetch analyst to simulate another user's activity
      const analyst = await User.findOne({ where: { email: 'analyst@example.com' } });

      // Generate some mock audit logs
      const auditLogsToSeed = [
        {
          userId: admin.id,
          recordId: createdRecords[0].id,
          action: 'UPDATE',
          oldValues: { amount: 4800, note: 'Salary' },
          newValues: { amount: 5000, note: 'TechCorp Salary' }
        },
        {
          userId: analyst.id,
          recordId: createdRecords[3].id, // Rent expense
          action: 'UPDATE',
          oldValues: { category: 'Housing', amount: 1750 },
          newValues: { category: 'Rent', amount: 1800 }
        },
        {
          userId: admin.id,
          recordId: createdRecords[5].id, // A deleted mock record
          action: 'DELETE',
          oldValues: { amount: 45, category: 'Subscriptions', note: 'Gym Membership' },
          newValues: null
        }
      ];

      await AuditLog.bulkCreate(auditLogsToSeed);

      console.log('Seed complete.');
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();

