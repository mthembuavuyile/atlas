const express = require('express');
const router = express.Router();
const apiRoutes = require('./api.routes');

// Mount API routes under /api
router.use('/api', apiRoutes);

module.exports = router;
