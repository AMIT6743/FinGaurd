const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userService = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

class UserController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await userService.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is inactive' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);

      //Never return password
      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };

      res.status(201).json({
        message: 'User created successfully',
        user: safeUser,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const users = await userService.getUsers();

      // Remove sensitive fields
      const safeUsers = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      }));

      res.json({
        count: safeUsers.length,
        users: safeUsers,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };

      res.json({ user: safeUser });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      // Pass current user for RBAC check
      const user = await userService.updateUser(
        req.params.id,
        req.body,
        req.user
      );

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };

      res.json({
        message: 'User updated successfully',
        user: safeUser,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const user = await userService.updateUser(
        req.params.id,
        { isActive: req.body.isActive },
        req.user
      );

      res.json({
        message: 'User status updated successfully',
        user: {
          id: user.id,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // NEW: Update Password
  async updatePassword(req, res, next) {
    try {
      await userService.updatePassword(req.params.id, req.body.password);

      res.json({
        message: 'Password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();