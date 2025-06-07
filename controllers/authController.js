const User = require("../models/user");
const Admin = require("../models/admin");
const nodemailer = require("nodemailer");
// const mailer = require("../utils/mailer");
const Otp = require("../models/otp");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
dotenv.config();

const authController = {
  signup: async (req, res) => {
    try {
      const user = await User.create({
        user_id: uuidv4(),
        name: req.body.username,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        role: req.body.role,
        password: req.body.password,
      });

      const createdUser = await user.save();

      const otpCode = Math.floor(100000 + Math.random() * 900000);
      let otp = new Otp({
        userId: createdUser.user_id,
        email: createdUser.email,
        otp: otpCode,
      });
      otp = await otp.save();

      const auth = nodemailer.createTransport({
        service: "gmail",
        secure: true,
        port: 465,
        auth: {
          user: process.env.MAILER_MAIL,
          pass: process.env.MAILER_SECRET,
        },
      });

      const reciever = {
        from: process.env.MAILER_MAIL,
        to: createdUser.email,
        subject: "Test",
        text: `Hello ${createdUser.name}, Welcome to our website otp is ${otpCode}`,
      };

      auth.sendMail(reciever, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });

      const token = jwt.sign(
        {
          _id: user._id,
          userId: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          password: user.password,
          address: user.address,
        },
        process.env.COOKIE_SECRET,
        { expiresIn: "24h" }
      );

      res.cookie("loginCookie", token, {
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.status(201).json({ message: "Signup successful" });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // controllers/authController.js
  login: async (req, res) => {
    try {
      const { username, email, password, role } = req.body;
      let user;

      if (role === "Admin") {
        user = await Admin.findOne({ name: username, email });
        if (!user || !(await user.comparePassword(password))) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
      } else {
        user = await User.findOne({ name: username, email });
        if (!user || !(await user.comparePassword(password))) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        if (user.role !== role) {
          return res.status(401).json({ error: "Invalid role" });
        }
      }

      const token = jwt.sign(
        {
          _id: user._id,
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
        },
        process.env.JWT_SECRET, // Use consistent secret
        { expiresIn: "24h" }
      );

      res.cookie("loginCookie", token, {
        httpOnly: false, // Allow frontend to read cookie
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.status(200).json({ message: "Login successful", token, user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  verifyOtp: async (req, res) => {
    const { userId, otp } = req.body;

    try {
      const user = await User.findOne({ user_id: userId });
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "User not found" });
      }

      const otpData = await Otp.findOne({ userId: userId });
      console.log(otpData);

      if (!otpData) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }

      // Convert OTPs to the same type for comparison
      if (parseInt(otpData.otp) === parseInt(otp)) {
        user.isVerified = true;
        await user.save({ validateBeforeSave: false });

        // Remove OTP after successful verification (optional)
        // await Otp.deleteOne({ userId: userId });

        return res.status(200).json({ success: true, message: "OTP verified" });
      } else {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User with this email does not exist",
        });
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = jwt.sign(
        { userId: user.user_id },
        process.env.COOKIE_SECRET,
        { expiresIn: "1h" }
      );

      // Save reset token to user (you might need to add this field to your user model)
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour in milliseconds
      await user.save({ validateBeforeSave: false });

      // Create reset URL
      const resetUrl = `${"http://localhost:5173"}/reset-password/${resetToken}`;

      // Send email with reset link
      const auth = nodemailer.createTransport({
        service: "gmail",
        secure: true,
        port: 465,
        auth: {
          user: process.env.MAILER_MAIL,
          pass: process.env.MAILER_SECRET,
        },
      });

      const receiver = {
        from: process.env.MAILER_MAIL,
        to: user.email,
        subject: "Password Reset",
        text: `Hello ${user.name},
      
You requested a password reset. Please click on the following link or paste it into your browser to reset your password:
      
${resetUrl}
      
This link is valid for 1 hour.
      
If you did not request this, please ignore this email and your password will remain unchanged.`,
        html: `
        <h2>Password Reset</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset. Please click on the button below to reset your password:</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #388E3C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link is valid for 1 hour.</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      `,
      };

      auth.sendMail(receiver, (error, info) => {
        if (error) {
          console.log(error);
          return res
            .status(500)
            .json({ success: false, message: "Error sending email" });
        } else {
          console.log("Email sent: " + info.response);
          return res.status(200).json({
            success: true,
            message: "Password reset link sent to your email",
          });
        }
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  resetPassword: async (req, res) => {
    try {
      const { newPassword } = req.body;
      const token = req.params.token;
      console.log("Token received:", token);
      console.log("Secret used:", process.env.COOKIE_SECRET);
      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.COOKIE_SECRET);
      } catch (err) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired token1" });
      }

      // Find user with the token
      const user = await User.findOne({
        user_id: decoded.userId,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired token2" });
      }

      // Update password
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password has been reset successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, users });
    } catch (error) {
      console.error("Get all users error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // ... existing code ...

  editProfile: async (req, res) => {
    try {
      const token = req.cookies.loginCookie;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No token provided",
        });
      }

      // Verify token and get user info
      const decoded = jwt.verify(token, "mysecret2"); // Using the same secret as login
      console.log(decoded);

      // Find user by email since we're using that in other places
      const user = await User.findOne({ email: decoded.email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update user fields
      user.name = req.body.name;
      user.email = req.body.email;
      user.phone = req.body.phone;
      user.address = req.body.address;

      // Save the updated user
      const updatedUser = await user.save();

      // Create new token with updated information
      const newToken = jwt.sign(
        {
          _id: updatedUser._id,
          user_id: updatedUser.user_id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          address: updatedUser.address,
        },
        "mysecret2"
      );

      // Set the new token in cookies
      res.cookie("loginCookie", newToken, {
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Send success response with updated user data
      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: {
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          address: updatedUser.address,
        },
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating profile",
        error: error.message,
      });
    }
  },

  // ... rest of the existing code ...
};

module.exports = authController;
