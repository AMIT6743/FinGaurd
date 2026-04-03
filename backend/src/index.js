const app = require('./app');
const sequelize = require('./store/database');
const User = require('./models/user');
const Record = require('./models/record');
const bcrypt = require('bcryptjs');

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
      
      await Record.bulkCreate([
        { userId: admin.id, amount: 5000, type: 'income', category: 'Salary', date: '2026-03-01', note: 'Monthly salary' },
        { userId: admin.id, amount: 1500, type: 'expense', category: 'Rent', date: '2026-03-05', note: 'Monthly rent' },
      ]);
      
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
