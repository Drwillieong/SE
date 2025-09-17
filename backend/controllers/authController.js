
import { User } from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

export const signup = (db) => async (req, res) => {
  const userModel = new User(db);
  try {
    const existingUser = await userModel.findByEmail(req.body.email);
    if (existingUser) {
      if (existingUser.authProvider === 'google') {
        return res.status(409).json({
          Error: "This email is already registered with Google. Please use 'Continue with Google' to sign in.",
          authProvider: 'google'
        });
      }
      if (!existingUser.isVerified) {
        return res.status(409).json({
          Error: "This email is already registered but not verified. Please check your email for verification instructions or request a new verification email.",
          requiresVerification: true
        });
      }
      return res.status(409).json({
        Error: "This email is already registered. Please try logging in instead."
      });
    }

    const newUser = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      contact: req.body.contact,
      email: req.body.email,
      password: req.body.password
    };

    const createdUser = await userModel.create(newUser);
    const token = userModel.generateToken({
      user_id: createdUser.user_id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: 'user'
    });

    console.log('User created successfully:', newUser.email);
    return res.status(201).json({
      message: "User created successfully. Please complete your account setup.",
      token: token,
      requiresVerification: false
    });
  } catch (error) {
    console.error('Error during signup:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ Error: "This email is already registered. Please try logging in instead." });
    }
    return res.status(500).json({ Error: "Error creating account" });
  }
};

export const login = (db) => async (req, res) => {
  const userModel = new User(db);
  try {
    const user = await userModel.findByEmail(req.body.email);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isPasswordValid = await userModel.comparePassword(req.body.password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Wrong email or password" });
    }

    const token = userModel.generateToken({
      user_id: user.user_id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role || 'user'
    });

    console.log("Login successful for:", user.email);
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.user_id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contact: user.contact,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ Error: "Server error" });
  }
};

export const verifyEmail = (db) => async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Verification token is required" });
  }

  const userModel = new User(db);
  try {
    const user = await userModel.verifyEmail(token);
    console.log(`Email verified for user: ${user.email}`);
    res.send(`
      <html>
        <head>
          <title>Email Verified</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #28a745; font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="success">✅ Email successfully verified!</div>
          <p>Your email address has been verified. You can now log in to your account.</p>
          <p><a href="/login">Go to Login</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error verifying email:', error.message);
    if (error.message === 'Invalid token') {
      return res.status(400).json({ message: "Invalid verification token" });
    }
    return res.status(500).json({ message: "Error verifying email" });
  }
};

export const resendVerification = (db) => async (req, res) => {
  const { email } = req.body;
  const userModel = new User(db);

  try {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const verificationToken = userModel.generateVerificationToken();
    await userModel.update(user.user_id, { verificationToken });

    await sendVerificationEmail(email, verificationToken);
    return res.json({
      message: "Verification email resent. Please check your inbox."
    });
  } catch (error) {
    console.error('Failed to resend verification email:', error.message);
    return res.status(500).json({
      message: "Failed to resend verification email. Please try again later."
    });
  }
};

// Forgot password controller
export const forgotPassword = (db) => async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const userModel = new User(db);
  try {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = userModel.generateVerificationToken();
    await userModel.update(user.user_id, {
      resetToken,
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    });

    await sendPasswordResetEmail(email, resetToken);
    res.json({ message: "Password reset email sent. Please check your inbox." });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ message: "Failed to send password reset email" });
  }
};

// Reset password controller
export const resetPassword = (db) => async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and password are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long" });
  }

  const userModel = new User(db);
  try {
    const user = await userModel.findByResetToken(token);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    await userModel.update(user.id, {
      password,
      resetToken: null,
      resetTokenExpiry: null
    });

    console.log(`Password reset successful for user: ${user.email}`);
    res.json({ message: "Password reset successfully. You can now log in with your new password." });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Change password controller for logged-in users
export const changePassword = (db) => async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.user_id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current password and new password are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters long" });
  }

  const userModel = new User(db);
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isCurrentPasswordValid = await userModel.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    await userModel.update(userId, { password: newPassword });

    console.log(`Password changed successfully for user ID: ${userId}`);
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: "Server error" });
  }
};
