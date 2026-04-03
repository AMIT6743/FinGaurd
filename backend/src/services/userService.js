const bcrypt = require('bcryptjs');
const User = require('../models/user');

class UserService {
  async createUser(userData) {
    if (!userData.password) {
      throw new Error('Password is required');
    }

    const email = userData.email.toLowerCase().trim();

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new Error('Email already exists');
    }

    const hashedPassword = bcrypt.hashSync(userData.password, 10);

    const newUser = await User.create({
      name: userData.name.trim(),
      email,
      password: hashedPassword,
      role: userData.role || 'viewer',
      isActive: true,
    });

    return newUser.toJSON();
  }

  async getUsers() {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    return users.map(u => u.toJSON());
  }

  async getUserById(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    return user.toJSON();
  }

  async getUserByEmail(email) {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });
    return user ? user.toJSON() : null;
  }

  async updateUser(userId, updateData, currentUser) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    // Email update
    if (updateData.email !== undefined) {
      const email = updateData.email.toLowerCase().trim();

      const existing = await User.findOne({ where: { email } });
      if (existing && existing.id !== userId) {
        throw new Error('Email already in use');
      }

      user.email = email;
    }

    // Name update
    if (updateData.name !== undefined) {
      user.name = updateData.name.trim();
    }

    // Role update (ONLY ADMIN)
    if (updateData.role !== undefined) {
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Not authorized to change role');
      }
      if (user.id === currentUser.id) {
        throw new Error('Admins cannot change their own role');
      }
      user.role = updateData.role;
    }

    // status update
    if (updateData.isActive !== undefined) {
      if (user.id === currentUser.id) {
        throw new Error('Admins cannot deactivate their own account');
      }
      user.isActive = updateData.isActive;
    }

    await user.save();
    return user.toJSON();
  }

  async updatePassword(userId, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    if (!newPassword) {
      throw new Error('Password is required');
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return true;
  }
}

module.exports = new UserService();