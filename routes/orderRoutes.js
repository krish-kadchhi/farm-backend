const express = require('express');
const { 
    getUserOrders, 
    getLatestOrder, 
    getAllOrders,
    createOrder, 
    updateOrderStatus, 
    getOrderDetails, 
    cancelOrder 
} = require('../controllers/orderController');

const router = express.Router();

router.get('/user/:userId', getUserOrders);
router.get('/all', getAllOrders);
router.get('/latest/:userId', getLatestOrder);
router.post('/create', createOrder);
router.patch('/status/:orderId', updateOrderStatus);
router.get('/:orderId', getOrderDetails);
router.patch('/cancel/:orderId', cancelOrder);

module.exports = router;