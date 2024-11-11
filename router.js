const express = require('express');
const router = express.Router();

// Your route definitions go here
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Add more routes as needed

module.exports = router;