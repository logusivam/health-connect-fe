import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Otp from '../../models/Otp.js';
import { sendOtpEmail } from '../../utils/email.js';
import User from '../../models/User.js';
import PatientProfile from '../../models/PatientProfile.js';
import DoctorProfile from '../../models/DoctorProfile.js';

// Cookie configuration
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true in prod, false in dev
  sameSite: 'none',
  path: '/'
};

export const registerUser = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, dob, gender, phone, bloodGroup } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // 1. Create the Base User
    const newUser = new User({ email, password, role });
    const savedUser = await newUser.save();

    // 2. Create Patient Profile
    if (role === 'PATIENT') {
      const newPatient = new PatientProfile({
        user_id: savedUser._id,
        firstName, lastName, dob, gender, phone,
        bloodGroup: bloodGroup || 'Not specified'
      });
      await newPatient.save();
    }

    // 3. NEW: Create Doctor Profile
    if (role === 'DOCTOR') {
      const newDoctor = new DoctorProfile({
        user_id: savedUser._id,
        firstName,
        lastName,
        registrationNumber: phone, // As requested
        contactEmail: email,       // As requested
        contactPhone: phone        // As requested
      });
      await newDoctor.save();
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { userId: savedUser._id, role: savedUser.role }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password, role, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase(), role, is_deleted: false });
    
    // If no user found (wrong email or role), we can't lock an account that doesn't exist
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials or role.' });

    // 1. Check if account is currently locked
    if (user.is_locked) {
      if (user.locked_until && user.locked_until > new Date()) {
        const minsLeft = Math.ceil((user.locked_until - new Date()) / (1000 * 60));
        return res.status(403).json({ 
          success: false, 
          message: `Account locked due to multiple failed attempts. Please wait ${minsLeft} minutes or reset your password.` 
        });
      } else {
        // Time has passed (15 mins is up), Auto-Unlock the account
        user.is_locked = false;
        user.locked_until = null;
        user.current_failed_attempts = 0;
        await user.save();
      }
    }

    // 2. MFA Check for Doctor/Admin
    if (user.mfa_enabled) {
      if (!otp) return res.status(400).json({ success: false, message: 'OTP required.' });
      const otpRecord = await Otp.findOne({ email: email.toLowerCase(), otp });
      
      if (!otpRecord) {
        await handleFailedAttempt(user);
        return res.status(400).json({ success: false, message: 'Wrong or expired OTP.' });
      }
      
      // Cleanup OTP after successful use
      await Otp.deleteOne({ email: email.toLowerCase() });
    }

    // 3. Password Check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await handleFailedAttempt(user);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 4. Success: Reset all trackers
    user.current_failed_attempts = 0;
    user.is_locked = false;
    user.locked_until = null;
    user.mfa_send_count = 0; 
    user.mfa_blocked_until = null;
    user.last_login_at = new Date();
    await user.save();

    // 5. Generate Tokens
    const privateKey = Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64').toString('ascii');
    const payload = { id: user._id, role: user.role };
    const signOptions = { algorithm: 'RS256', keyid: process.env.JWT_KID };

    const accessToken = jwt.sign(payload, privateKey, { ...signOptions, expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, privateKey, { ...signOptions, expiresIn: '7d' });
 
    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(200).json({ 
      success: true, 
      data: { user: { id: user._id, email: user.email, role: user.role } } 
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// Helper function to manage failed attempts
const handleFailedAttempt = async (user) => {
  user.current_failed_attempts += 1;
  
  if (user.current_failed_attempts >= 3) {
    user.is_locked = true;
    user.locked_until = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
    
    // Push cumulative history record
    user.failed_login_count.push({
      count: user.current_failed_attempts,
      date: new Date()
    });
  }
  
  await user.save();
};

// NEW: Logout to clear cookies
export const logoutUser = (req, res) => {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// NEW: Get current session data
export const getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.status(200).json({ success: true, data: { role: user.role, id: user._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 1. Send OTP
export const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email, role } = req.body;
    
    // Check if user exists with exact email and role
    const user = await User.findOne({ email, role, is_deleted: false });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email and role combination.' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to DB (overwrites existing if any)
    await Otp.findOneAndDelete({ email });
    await Otp.create({ email, otp: otpCode });

    // Send HTTPS Email
    await sendOtpEmail(email, otpCode);

    res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

// 2. Verify OTP Automatically
export const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await Otp.findOne({ email, otp });
    
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    
    res.status(200).json({ success: true, message: 'OTP Verified.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// 3. Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, role, otp, newPassword } = req.body;

    // Final security check
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP verification failed or expired.' });
    }

    const user = await User.findOne({ email, role });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Update password (pre-save hook will automatically hash it and update password_updated_at)
    user.password = newPassword;
    await user.save();

    // Clean up OTP
    await Otp.deleteOne({ email });

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during password reset.' });
  }
};

// NEW: Send Login OTP with Progressive Cooldown
export const sendLoginOtp = async (req, res) => {
  try {
    const { email, role } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase(), role, is_deleted: false });
    if (!user) {
      return res.status(404).json({ success: false, message: "Role and email doesn't match" });
    }

    // Check if blocked
    if (user.mfa_blocked_until && user.mfa_blocked_until > new Date()) {
      const hoursLeft = Math.ceil((user.mfa_blocked_until - new Date()) / (1000 * 60 * 60));
      return res.status(403).json({ success: false, message: `Too many attempts. Blocked for ${hoursLeft} hours.` });
    }

    // Progressive Cooldown Logic
    user.mfa_send_count += 1;
    let cooldown = 90;

    if (user.mfa_send_count === 2) cooldown = 120;
    else if (user.mfa_send_count === 3) cooldown = 150;
    else if (user.mfa_send_count > 3) {
      // 6 Hour Block
      user.mfa_blocked_until = new Date(Date.now() + 6 * 60 * 60 * 1000);
      await user.save();
      return res.status(403).json({ success: false, message: 'Too many attempts. Disabled for 6 hours.' });
    }

    await user.save();

    // Generate & Send
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndDelete({ email: email.toLowerCase() });
    await Otp.create({ email: email.toLowerCase(), otp: otpCode });
    await sendOtpEmail(email, otpCode);

    res.status(200).json({ success: true, message: 'OTP sent successfully', cooldown });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

// NEW: Verify OTP on the fly (Auto-Verify)
export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await Otp.findOne({ email: email.toLowerCase(), otp });
    
    if (!otpRecord) return res.status(400).json({ success: false, message: 'Wrong OTP' });
    
    res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

