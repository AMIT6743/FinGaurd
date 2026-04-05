const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../store/database');
const Record = require('../models/record');

/**
 * Service to generate summary data for the dashboard.
 * Uses SQL-level aggregations to avoid loading all records into memory.
 * Safe for 10,000+ records.
 */
class DashboardService {
  async getSummary(month = null) {
    let whereClause = 'isDeleted = 0';
    const replacements = {};

    if (month) {
      whereClause += ' AND date LIKE :monthMatch';
      replacements.monthMatch = `${month}%`;
    }

    // ── 1) SUM income and expense directly in SQL ──────────────────
    const [totalsResult] = await sequelize.query(`
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS totalIncome,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS totalExpense,
        COUNT(1) AS totalRecords
      FROM records
      WHERE ${whereClause}
    `, { replacements });

    const totalIncome  = Number(totalsResult[0].totalIncome  || 0);
    const totalExpense = Number(totalsResult[0].totalExpense || 0);
    const totalRecords = Number(totalsResult[0].totalRecords || 0);
    const netBalance   = totalIncome - totalExpense;

    // ── 2) Category breakdown via SQL GROUP BY ─────────────────────
    const categoryRows = await sequelize.query(`
      SELECT
        category,
        SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM records
      WHERE ${whereClause}
      GROUP BY category
      ORDER BY (income + expense) DESC
    `, { replacements, type: sequelize.QueryTypes.SELECT });

    const categoryTotals = {};
    categoryRows.forEach(row => {
      categoryTotals[row.category] = {
        income:  Number(row.income  || 0),
        expense: Number(row.expense || 0),
        total:   Number(row.income  || 0) - Number(row.expense || 0),
      };
    });

    // ── 3) Monthly trends via SQL GROUP BY ── (Always show all months for context)
    const monthRows = await sequelize.query(`
      SELECT
        SUBSTR(date, 1, 7) AS month,
        SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM records
      WHERE isDeleted = 0
      GROUP BY SUBSTR(date, 1, 7)
      ORDER BY month ASC
    `, { type: sequelize.QueryTypes.SELECT });

    const monthlyTrends = {};
    monthRows.forEach(row => {
      monthlyTrends[row.month] = {
        income:  Number(row.income  || 0),
        expense: Number(row.expense || 0),
        net:     Number(row.income  || 0) - Number(row.expense || 0),
      };
    });

    // ── 4) Recent transactions ── (Filter by month if selected)
    const recentWhere = { isDeleted: false };
    if (month) {
      recentWhere.date = { [Op.like]: `${month}%` };
    }

    const recentData = await Record.findAll({
      where: recentWhere,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: month ? 10 : 5, // Show more if filtered
      attributes: ['id', 'userId', 'amount', 'type', 'category', 'date', 'note'],
    });
    const recentTransactions = recentData.map(r => r.toJSON());

    return {
      totalIncome,
      totalExpense,
      netBalance,
      totalRecords,
      categoryTotals,
      recentTransactions,
      monthlyTrends,
    };
  }
}

module.exports = new DashboardService();
