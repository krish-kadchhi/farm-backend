const Order = require("../models/order");
const User = require("../models/user");

const orderController = {
  // Get all orders for a specific user
  getUserOrders: async (req, res) => {
    try {
      const { userId } = req.params;
      const orders = await Order.find({ userId })
        .sort({ orderDate: -1 });

      if (!orders) {
        return res.status(404).json({
          message: "No orders found"
        });
      }

      res.status(200).json({
        success: true,
        orders
      });
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching orders",
        error: error.message
      });
    }
  },

  getAllOrders: async (req, res) => {
    try {
      const orders = await Order.find().sort({ orderDate: -1 }).lean();
  
      if (!orders || orders.length === 0) {
        console.warn("No orders found in the database.");
        return res.status(200).json({ success: true, orders: [] });
      }
  
      console.log("Fetched orders from database:", orders);
      res.status(200).json({ success: true, orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ success: false, message: "Error fetching orders", error: error.message });
    }
  },
  
     

  // Get latest order for a user
  getLatestOrder: async (req, res) => {
    try {
      const { userId } = req.params;
      const order = await Order.findOne({ userId })
        .sort({ orderDate: -1 });

      if (!order) {
        return res.status(404).json({
          message: "No order found"
        });
      }

      res.status(200).json({
        success: true,
        order
      });
    } catch (error) {
      console.error("Error fetching latest order:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching order",
        error: error.message
      });
    }
  },

  // Create new order
  createOrder: async (req, res) => {
    try {
      const {
        userId,
        items,
        totalAmount,
        paymentId,
        orderId,
        shippingAddress
      } = req.body;

      if (!userId || !items || !totalAmount || !paymentId || !orderId) {
        return res.status(400).json({
          message: "Missing required fields"
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      const order = await Order.create({
        userId,
        items,
        totalAmount,
        paymentId,
        orderId,
        shippingAddress: shippingAddress || user.address
      });

      if (!order) {
        return res.status(400).json({
          message: "Error creating order"
        });
      }

      // Clear user's cart after successful order
      await User.findByIdAndUpdate(userId, { $set: { cart: [] } });

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        order
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({
        success: false,
        message: "Error creating order",
        error: error.message
      });
    }
  },

  // Update order status
  updateOrderStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { orderStatus } = req.body;

      if (!orderStatus) {
        return res.status(400).json({
          message: "Order status is required"
        });
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        { orderStatus },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({
          message: "Order not found"
        });
      }

      res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({
        success: false,
        message: "Error updating order status",
        error: error.message
      });
    }
  },

  // Get specific order details
  getOrderDetails: async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          message: "Order not found"
        });
      }

      res.status(200).json({
        success: true,
        order
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching order details",
        error: error.message
      });
    }
  },

  // Cancel order
  cancelOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          message: "Order not found"
        });
      }

      // Only allow cancellation if order is not already delivered
      if (order.orderStatus === 'Delivered') {
        return res.status(400).json({
          message: "Cannot cancel delivered order"
        });
      }

      order.orderStatus = 'Cancelled';
      await order.save();

      res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        order
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({
        success: false,
        message: "Error cancelling order",
        error: error.message
      });
    }
  }
};

module.exports = orderController;