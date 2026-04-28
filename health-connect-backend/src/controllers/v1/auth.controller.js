import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Otp from '../../models/Otp.js';
import { sendOtpEmail } from '../../utils/email.js';
import User from '../../models/User.js';
import PatientProfile from '../../models/PatientProfile.js';
import DoctorProfile from '../../models/DoctorProfile.js';
import AdminProfile from '../../models/AdminProfile.js';
import AuditService from '../../services/audit.service.js'; // NEW

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
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

    const newUser = new User({ email, password, role });
    const savedUser = await newUser.save();

    if (role === 'PATIENT') {
      const newPatient = new PatientProfile({
        user_id: savedUser._id,
        firstName, lastName, dob, gender, phone,
        bloodGroup: bloodGroup || 'Not specified'
      });
      await newPatient.save();
    }

    if (role === 'DOCTOR') {
      const newDoctor = new DoctorProfile({
        user_id: savedUser._id,
        firstName, lastName,
        registrationNumber: phone, 
        contactEmail: email,       
        contactPhone: phone        
      });
      await newDoctor.save();
    }

    if (role === 'ADMIN') {
      const newAdmin = new AdminProfile({
        user_id: savedUser._id,
        firstName, lastName, dob, gender,
        bloodGroup: bloodGroup || 'Not specified',
        registrationNumber: phone, 
        contactEmail: email,       
        contactPhone: phone        
      });
      await newAdmin.save();
    }

    // AUDIT LOG: User Registration (System Action)
    AuditService.logAction(req, {
      actor_role: 'SYSTEM',
      action_type: 'CREATE',
      entity_type: 'user',
      entity_id: savedUser._id,
      new_values: { email: savedUser.email, role: savedUser.role }
    });

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
    
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials or role.' });

    if (user.is_locked) {
      if (user.locked_until && user.locked_until > new Date()) {
        const minsLeft = Math.ceil((user.locked_until - new Date()) / (1000 * 60));
        return res.status(403).json({ 
          success: false, 
          message: `Account locked due to multiple failed attempts. Please wait ${minsLeft} minutes or reset your password.` 
        });
      } else {
        user.is_locked = false;
        user.locked_until = null;
        user.current_failed_attempts = 0;
        await user.save();
      }
    }

    if (user.mfa_enabled) {
      if (!otp) return res.status(400).json({ success: false, message: 'OTP required.' });
      const otpRecord = await Otp.findOne({ email: email.toLowerCase(), otp });
      
      if (!otpRecord) {
        await handleFailedAttempt(user, req); // Passed req for audit context
        return res.status(400).json({ success: false, message: 'Wrong or expired OTP.' });
      }
      
      await Otp.deleteOne({ email: email.toLowerCase() });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await handleFailedAttempt(user, req); // Passed req for audit context
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    user.current_failed_attempts = 0;
    user.is_locked = false;
    user.locked_until = null;
    user.mfa_send_count = 0; 
    user.mfa_blocked_until = null;
    
    user.login_history.push({ logged_in_at: new Date() });

    if (user.login_history.length > 10) {
      user.login_history.shift();
    }

    await user.save();

    const privateKey = Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64').toString('ascii');
    const payload = { id: user._id, role: user.role };
    const signOptions = { algorithm: 'RS256', keyid: process.env.JWT_KID };

    const accessToken = jwt.sign(payload, privateKey, { ...signOptions, expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, privateKey, { ...signOptions, expiresIn: '7d' });
 
    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    // AUDIT LOG: Successful Login
    AuditService.logAction(req, {
      actor_user_id: user._id,
      actor_role: user.role,
      action_type: 'LOGIN',
      entity_type: 'auth',
      entity_id: user._id
    });

    res.status(200).json({ 
      success: true, 
      data: { user: { id: user._id, email: user.email, role: user.role } } 
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

const handleFailedAttempt = async (user, req) => {
  user.current_failed_attempts += 1;
  
  if (user.current_failed_attempts >= 3) {
    user.is_locked = true;
    user.locked_until = new Date(Date.now() + 15 * 60 * 1000); 
    user.failed_login_count.push({ count: user.current_failed_attempts, date: new Date() });
    
    // AUDIT LOG: Account Locked
    AuditService.logAction(req, {
      actor_role: 'SYSTEM',
      action_type: 'UPDATE',
      entity_type: 'user',
      entity_id: user._id,
      new_values: { status: 'LOCKED', attempts: user.current_failed_attempts }
    });
  }
  
  await user.save();
};

export const logoutUser = (req, res) => {
  // AUDIT LOG: Successful Logout
  AuditService.logAction(req, {
    action_type: 'LOGOUT',
    entity_type: 'auth',
    entity_id: req?.user?.id || null
  });

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.status(200).json({ success: true, data: { role: user.role, id: user._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email, role } = req.body;
    
    const user = await User.findOne({ email, role, is_deleted: false });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email and role combination.' });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.findOneAndDelete({ email });
    await Otp.create({ email, otp: otpCode });

    await sendOtpEmail(email, otpCode);

    res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

export const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await Otp.findOne({ email, otp });
    
    if (!otpRecord) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    
    res.status(200).json({ success: true, message: 'OTP Verified.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, role, otp, newPassword } = req.body;

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) return res.status(400).json({ success: false, message: 'OTP verification failed or expired.' });

    const user = await User.findOne({ email, role });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.password = newPassword;
    await user.save();

    await Otp.deleteOne({ email });

    // AUDIT LOG: Password Reset
    AuditService.logAction(req, {
      actor_user_id: user._id,
      actor_role: user.role,
      action_type: 'UPDATE',
      entity_type: 'auth',
      entity_id: user._id,
      new_values: { action: 'PASSWORD_RESET' }
    });

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during password reset.' });
  }
};

export const sendLoginOtp = async (req, res) => {
  try {
    const { email, role } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase(), role, is_deleted: false });
    if (!user) return res.status(404).json({ success: false, message: "Role and email doesn't match" });

    if (user.mfa_blocked_until && user.mfa_blocked_until > new Date()) {
      const hoursLeft = Math.ceil((user.mfa_blocked_until - new Date()) / (1000 * 60 * 60));
      return res.status(403).json({ success: false, message: `Too many attempts. Blocked for ${hoursLeft} hours.` });
    }

    user.mfa_send_count += 1;
    let cooldown = 90;

    if (user.mfa_send_count === 2) cooldown = 120;
    else if (user.mfa_send_count === 3) cooldown = 150;
    else if (user.mfa_send_count > 3) {
      user.mfa_blocked_until = new Date(Date.now() + 6 * 60 * 60 * 1000);
      await user.save();
      
      // AUDIT LOG: MFA Blocked
      AuditService.logAction(req, {
        actor_user_id: user._id,
        actor_role: user.role,
        action_type: 'UPDATE',
        entity_type: 'auth',
        entity_id: user._id,
        new_values: { action: 'MFA_BLOCKED', duration: '6 hours' }
      });
      
      return res.status(403).json({ success: false, message: 'Too many attempts. Disabled for 6 hours.' });
    }

    await user.save();

    // AUDIT LOG: MFA Attempt Started
    AuditService.logAction(req, {
      actor_user_id: user._id,
      actor_role: user.role,
      action_type: 'MFA_ATTEMPT',
      entity_type: 'auth',
      entity_id: user._id
    });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndDelete({ email: email.toLowerCase() });
    await Otp.create({ email: email.toLowerCase(), otp: otpCode });
    await sendOtpEmail(email, otpCode);

    res.status(200).json({ success: true, message: 'OTP sent successfully', cooldown });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

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