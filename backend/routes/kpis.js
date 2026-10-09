const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiControllers');
router.get('/', kpiController.obtenerDashboardKPIs);

module.exports = router;