const Item = require("../models/item");
const multer = require("multer");
const uploadOnCloudinary = require("../utils/cloudinary");
const jwt = require("jsonwebtoken");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

const itemController = {
  searchItems: async (req, res) => {
    try {
      let query = req.query.query;
      const items = await Item.find({
        name: { $regex: query, $options: "i" },
      });
      res.status(200).send(items);
    } catch (error) {
      console.error("Error searching items:", error);
      res.status(500).send({ message: "Internal server error" });
    }
  },

  getAllItems: async (req, res) => {
    try {
      const items = await Item.find();
      // res.render("item.ejs", { items });
    } catch (error) {
      res.status(500).send({ message: "Error fetching items" });
    }
  },

  showPro: async (req, res) => {
      console.log("hii showpro");
      
      try {
        // Get district from query param if available
        const selectedDistrict = req.query.district;
        
        // Get token from cookies
        const token = req.cookies.loginCookie;
        if (!token) {
          return res
            .status(401)
            .json({ message: "Unauthorized - No token found" });
        }
    
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecret2");
        console.log("Decoded Token:", decoded);
    
        // If district is selected in the request, use that
        // Otherwise use user's city from decoded token
        let searchLocation;
        
        if (selectedDistrict) {
          searchLocation = selectedDistrict;
          console.log(`Finding products for selected district: ${selectedDistrict}`);
        } else {
          // Get user's city from decoded token
          const city = decoded.address;
          console.log(`User city from token: ${city}`);
          
          if (!city) {
            return res.status(400).json({ message: "User city not found in token" });
          }
          
          searchLocation = city;
        }
    
        // Fetch products for the location (either selected district or user's city)
        const items = await Item.find({
          city: { $in: Array.isArray(searchLocation) ? searchLocation : [searchLocation] },
        });
        
        console.log(`Products fetched for ${searchLocation}: ${items.length}`);
    
        res.send(items);
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Error fetching products" });
      }
    
  },

  // addProduct: async (req, res) => {
  //   try {
  //     const data = {
  //       name: req.body.product_name,
  //       category: req.body.product_category,
  //       price: req.body.product_price,
  //       image: req.file.path,
  //     };
  //     await Item.insertMany(data);
  //     res.status(201).json({
  //       message: "Added successfully.",
  //       imagePath: data.image,
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       message: "Error uploading file",
  //       error: error.message,
  //     });
  //   }
  // },

  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      await Item.deleteOne({ id: id });
      res.status(200).send("Successfully deleted");
    } catch (error) {
      res.status(500).send("Error deleting product");
    }
  },

  //controller
  searchItems: async (req, res) => {
    try {
      let query = req.query.query;
      const items = await Item.find({
        name: { $regex: query, $options: "i" },
      });
      res.status(200).send(items);
    } catch (error) {
      console.error("Error searching items:", error);
      res.status(500).send({ message: "Internal server error" });
    }
  },

  addProduct: async (req, res) => {
    try {
      const data = {
        name: req.body.productName,
        category: req.body.category,
        price: req.body.price,
        stock: req.body.stock,
        description: req.body.description,
        city: req.body.cityArray,
      };
      // res.status(201).json({
      //   message: "Added successfully.",
      //   imagePath: data.image,
      // });

      const imagelocalpath = req.files?.image[0].path;

      if (!imagelocalpath) {
        return res.status(400).json({
          message: "Image is required",
        });
      }

      const image = await uploadOnCloudinary(imagelocalpath);

      if (!image) {
        return res.status(400).json({
          message: "error uploading image on cloudinary",
        });
      }
      const item = await Item.create({
        ...data,
        image: image.url,
      });

      if (!item) {
        return res.status(400).json({
          message: "Error adding product",
        });
      }

      return res.status(201).json({
        message: "Product added successfully",
        item,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error uploading file",
        error: error.message,
      });
    }
  },
  getAllProducts: async (req, res) => {
    try {
      const items = await Item.find();
      res.status(200).json(items);
    } catch (error) {
      console.error("Error fetching all products:", error);
      res.status(500).json({ message: "Error fetching products" });
    }
  },
  
  // Edit product
  editProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = {
        name: req.body.name,
        category: req.body.category,
        price: req.body.price,
        description: req.body.description,
        stock: req.body.stock,
        city: req.body.city
      };
  
      const updatedItem = await Item.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
  
      if (!updatedItem) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      res.status(200).json(updatedItem);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Error updating product" });
    }
  },
  
};

module.exports = itemController;
