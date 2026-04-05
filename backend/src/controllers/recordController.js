const recordService = require('../services/recordService');

class RecordController {
  async createRecord(req, res, next) {
    try {
      const { amount, type, category, date, note } = req.body;

      // Always take userId from auth (never from client)
      const record = await recordService.createRecord(
        { amount, type, category, date, note },
        req.user.id
      );

      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  }

  async getRecords(req, res, next) {
    try {
      const { type, category, date, search, page, limit } = req.query;

      // Pass userId for isolation
      const result = await recordService.getRecords(
        req.user.id,
        { type, category, date, search, page, limit }
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateRecord(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, type, category, date, note } = req.body;

      // Pass userId for ownership check
      const updatedRecord = await recordService.updateRecord(
        id,
        req.user.id,
        { amount, type, category, date, note }
      );

      res.json({
        message: 'Record updated successfully',
        record: updatedRecord,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRecord(req, res, next) {
    try {
      const { id } = req.params;

      // Pass userId for ownership check
      await recordService.deleteRecord(id, req.user.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async exportRecords(req, res, next) {
    try {
      const records = await recordService.getAllRecords();

      const fields = [
        { label: 'Date', value: 'date' },
        { label: 'Type', value: 'type' },
        { label: 'Category', value: 'category' },
        { label: 'Amount', value: 'amount' },
        { label: 'Note', value: 'note' }
      ];

      const { Parser } = require('json2csv');
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(records);

      res.header('Content-Type', 'text/csv');
      res.attachment('FinFlow_Transactions.csv');
      return res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RecordController();