const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const token = req.cookies.token;
  if (token) {
    res.json({ token });
  } else {
    res.json({ token: null });
  }
});

module.exports = router;
