const express = require('express');
const { checkout, verify } = require('../controllers/paymentController');

const router = express.Router();

router.post('/checkout', checkout);
router.post('/verify-payment', verify);

module.exports = router;