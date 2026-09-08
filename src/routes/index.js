const express = require('express');
const router = express.Router();
const apiRoutes = require('./api.routes');

// Mount API routes under both /api and / to seamlessly support direct calls and Vercel path rewriting
router.use('/api', apiRoutes);
router.use('/', apiRoutes);

module.exports = router;
