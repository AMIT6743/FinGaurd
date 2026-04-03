const dashboardService = require('../services/dashboardService');

class DashboardController {
  async getSummary(req, res, next) {
    try {
      const summary = await dashboardService.getSummary();
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
