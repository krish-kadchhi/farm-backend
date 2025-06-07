const User = require("../models/user");
const Item = require("../models/item");
const jwt = require("jsonwebtoken");

const cartController = {
  addToCart: async (req, res) => {
    try {
      const token = req.cookies.loginCookie;
      if (!token) {
        return setTimeout(() => res.status(401).send("No token provided"), 100);
      }

      const decoded = jwt.verify(token, "mysecret2");
      const userEmail = decoded.email;
      console.log(userEmail)
      // Check item stock first
      const itemInDb = await Item.findOne({ name: req.body.item });
      if (!itemInDb || itemInDb.stock < 1) {
        return setTimeout(() => res.status(400).send("Item out of stock"), 100);
      }

      const cartItem = {
        item: req.body.item,
        category: req.body.category,
        price: req.body.price,
        image: req.body.image || "",
        quantity: req.body.quantity || 1,
      };

      // Find user and check if item exists in cart
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return setTimeout(() => res.status(404).send("User not found"), 100);
      }

      const existingCartItemIndex = user.cart.findIndex(
        (item) => item.item === cartItem.item
      );

      let updatedUser;
      if (existingCartItemIndex !== -1) {
        // Item exists, check if we have enough stock for increment
        const currentQuantity = user.cart[existingCartItemIndex].quantity;
        if (itemInDb.stock < 1) {
          return setTimeout(
            () => res.status(400).send("Not enough stock available"),
            100
          );
        }

        // Update cart quantity and decrease stock
        const updateQuery = {
          $inc: {
            [`cart.${existingCartItemIndex}.quantity`]: 1,
          },
        };

        updatedUser = await User.findOneAndUpdate(
          { email: userEmail },
          updateQuery,
          { new: true }
        );

        // Decrease item stock
        await Item.findOneAndUpdate(
          { name: req.body.item },
          { $inc: { stock: -1 } }
        );
      } else {
        // Item doesn't exist in cart, add it and decrease stock
        updatedUser = await User.findOneAndUpdate(
          { email: userEmail },
          {
            $push: { cart: cartItem },
          },
          { new: true }
        );

        // Decrease item stock
        await Item.findOneAndUpdate(
          { name: req.body.item },
          { $inc: { stock: -1 } }
        );
      }

      if (!updatedUser) {
        return setTimeout(() => res.status(404).send("User not found"), 100);
      }

      res.status(200).send("Item added successfully");
    } catch (error) {
      console.error("Add to cart error:", error);
      setTimeout(() => res.status(500).send("Error adding item to cart"), 100);
    }
  },

  showCart: async (req, res) => {
    try {
      const token = req.cookies.loginCookie;
      if (!token) {
        return setTimeout(() => res.status(401).send("No token provided"), 100);
      }

      const decoded = jwt.verify(token, "mysecret2");
      const userEmail = decoded.email;

      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return setTimeout(() => res.status(404).send("User not found"), 100);
      }

      // Check for zero-stock items and remove them
      const itemsToCheck = user.cart;
      for (const cartItem of itemsToCheck) {
        const item = await Item.findOne({ name: cartItem.item });
        if (!item || item.stock === 0) {
          await User.findOneAndUpdate(
            { email: userEmail },
            {
              $pull: {
                cart: { item: cartItem.item },
              },
            }
          );
        }
      }

      // Fetch updated cart
      const updatedUser = await User.findOne({ email: userEmail });
      setTimeout(() => res.send(updatedUser.cart || []), 1000);
    } catch (error) {
      console.error("Show cart error:", error);
      setTimeout(() => res.status(500).send("Error retrieving cart"), 100);
    }
  },

  deleteFromCart: async (req, res) => {
    try {
      const { item } = req.body;
      const token = req.cookies.loginCookie;

      if (!token) {
        return setTimeout(() => res.status(401).send("No token provided"), 100);
      }

      const decoded = jwt.verify(token, "mysecret2");
      const email = decoded.email;

      // Check item stock
      const itemInDb = await Item.findOne({ name: item });

      // Find user to get item quantity before removal
      const user = await User.findOne({ email });
      if (!user) {
        return setTimeout(() => res.status(404).send("User not found"), 100);
      }

      const cartItem = user.cart.find((i) => i.item === item);
      if (!cartItem) {
        return setTimeout(
          () => res.status(404).send("Item not found in cart"),
          100
        );
      }

      // If item exists in database and has stock, return quantity back to stock
      if (itemInDb && itemInDb.stock > 0) {
        await Item.findOneAndUpdate(
          { name: item },
          { $inc: { stock: cartItem.quantity } }
        );
      }

      // Remove item from cart
      const result = await User.findOneAndUpdate(
        { email },
        {
          $pull: {
            cart: { item },
          },
        },
        { new: true }
      );

      // Check all remaining items in cart for zero stock and remove them
      const updatedUser = await User.findOne({ email });
      for (const remainingItem of updatedUser.cart) {
        const itemStock = await Item.findOne({ name: remainingItem.item });
        if (!itemStock || itemStock.stock === 0) {
          await User.findOneAndUpdate(
            { email },
            {
              $pull: {
                cart: { item: remainingItem.item },
              },
            }
          );
        }
      }

      setTimeout(() => res.status(200).send("Item removed successfully"), 100);
    } catch (error) {
      console.error("Error removing item from cart:", error);
      setTimeout(
        () => res.status(500).send("Error removing item from cart"),
        100
      );
    }
  },

  showItem: async (req, res) => {
    try {
      const token = req.cookies.loginCookie;
      if (!token) {
        return res.status(401).send("No token provided");
      }

      const decoded = jwt.verify(token, "mysecret2");
      const email = decoded.email;
      const user = await User.findOne({ email: email });

      if (!user) {
        return res.status(404).send("User not found");
      }

      const stockInfo = {};
      for (const cartItem of user.cart) {
        const item = await Item.findOne({ name: cartItem.item });
        if (item) {
          stockInfo[cartItem.item] = item.stock;
        }
      }

      res.json(stockInfo);
    } catch (error) {
      console.error("Error fetching stock info:", error);
      res.status(500).send("Error fetching stock information");
    }
  },
};

module.exports = cartController;
