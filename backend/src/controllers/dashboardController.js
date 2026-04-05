const dashboardService = require('../services/dashboardService');

class DashboardController {
  async getSummary(req, res, next) {
    try {
      const { month } = req.query; // Expects YYYY-MM format
      const summary = await dashboardService.getSummary(month);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
