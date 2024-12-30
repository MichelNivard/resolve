const express = require('express');
const router = express.Router();

const loadRoute = require('./load');
const saveRoute = require('./save');

router.use('/load', loadRoute);
router.use('/save', saveRoute);

module.exports = router;
