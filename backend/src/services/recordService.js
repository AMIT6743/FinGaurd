const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../store/database');
const Record = require('../models/record');
const AuditLog = require('../models/auditLog');

class RecordService {
  async getNetBalance(excludeId = null, transaction = null) {
    let whereClause = 'isDeleted = 0';
    const replacements = {};

    if (excludeId) {
      whereClause += ' AND id != :excludeId';
      replacements.excludeId = excludeId;
    }
    const query = `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)
        -
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
        AS net
      FROM records
      WHERE ${whereClause}
    `;

    const [result] = await sequelize.query(query, {
      replacements,
      transaction,
    });

    return Number(result[0]?.net || 0);
  }

  async createRecord(recordData, userId) {
    if (recordData.type === 'expense') {
      const currentNet = await this.getNetBalance();
      if (currentNet < recordData.amount) {
        let err = new Error('Insufficient balance');
        err.status = 400;
        throw err;
      }
    }

    const newRecord = await Record.create({
      userId,
      amount: recordData.amount,
      type: recordData.type,
      category: recordData.category,
      date: recordData.date || new Date().toISOString(),
      note: recordData.note || '',
      isDeleted: false,
    });

    return newRecord.toJSON();
  }

  async getRecords(userId, options = {}) {
    const {
      type,
      category,
      date,
      search,
      page = 1,
      limit = 10,
    } = options;

    const where = {
      isDeleted: false,
    };

    if (type) where.type = type;
    if (category) where.category = category;
    if (date) where.date = { [Op.like]: `${date}%` };

    if (search) {
      const searchTerm = `%${search}%`;
      where[Op.or] = [
        { note: { [Op.like]: searchTerm } },
        { category: { [Op.like]: searchTerm } }
      ];
    }

    const { count, rows } = await Record.findAndCountAll({
      where,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
    });

    return {
      records: rows.map(r => r.toJSON()),
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async updateRecord(recordId, userId, updateData) {
    const t = await sequelize.transaction();
    try {
      const record = await Record.findOne({
        where: {
          id: recordId,
          isDeleted: false,
        },
        transaction: t,
      });

      if (!record) {
        throw new Error('Record not found or unauthorized');
      }

      const oldValues = record.toJSON();

      if (updateData.amount !== undefined) record.amount = updateData.amount;
      if (updateData.type !== undefined) record.type = updateData.type;
      if (updateData.category !== undefined) record.category = updateData.category;
      if (updateData.date !== undefined) record.date = updateData.date;
      if (updateData.note !== undefined) record.note = updateData.note;

      // Validate balance won't go negative after update (SQL-level, no RAM scan)
      if (record.type === 'expense') {
        const netWithoutThis = await this.getNetBalance(recordId, t);
        if (netWithoutThis < record.amount) {
          let err = new Error('Insufficient balance for this update');
          err.status = 400;
          throw err;
        }
      }

      await record.save({ transaction: t });
      
      const newValues = record.toJSON();

      await AuditLog.create({
        userId,
        recordId,
        action: 'UPDATE',
        oldValues,
        newValues,
      }, { transaction: t });

      await t.commit();
      return record.toJSON();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async deleteRecord(recordId, userId) {
    const t = await sequelize.transaction();
    try {
      const record = await Record.findOne({
        where: {
          id: recordId,
          isDeleted: false,
        },
        transaction: t,
      });

      if (!record) {
        throw new Error('Record not found or unauthorized');
      }

      const oldValues = record.toJSON();

      record.isDeleted = true;
      await record.save({ transaction: t });

      const newValues = record.toJSON();

      await AuditLog.create({
        userId,
        recordId,
        action: 'DELETE',
        oldValues,
        newValues,
      }, { transaction: t });

      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = new RecordService();