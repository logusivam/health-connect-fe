import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import PatientProfile from '../../models/PatientProfile.js';

// Cookie configuration
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true in prod, false in dev
  sameSite: 'lax',
  path: '/'
};

export const registerUser = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, dob, gender, phone, bloodGroup } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // 1. Create the Base User
    const newUser = new User({ email, password, role });
    const savedUser = await newUser.save();

    // 2. Create Role-Specific Profile (Patient)
    if (role === 'PATIENT') {
      const newPatient = new PatientProfile({
        user_id: savedUser._id,
        firstName,
        lastName,
        dob,
        gender,
        phone,
        bloodGroup: bloodGroup || 'Not specified'
      });
      await newPatient.save();
    }

    // NOTE: You would add similar logic here for DOCTOR or ADMIN profiles later

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: savedUser._id,
        role: savedUser.role
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email, role, is_deleted: false });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials or role.' });
    if (user.is_locked) return res.status(403).json({ success: false, message: 'Account locked.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failed_login_count += 1;
      if (user.failed_login_count >= 3) user.is_locked = true;
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    user.failed_login_count = 0;
    user.last_login_at = new Date();
    await user.save();

    const privateKey = Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64').toString('ascii');
    const payload = { id: user._id, role: user.role };
    const signOptions = { algorithm: 'RS256', keyid: process.env.JWT_KID };

    // Generate Tokens
    const accessToken = jwt.sign(payload, privateKey, { ...signOptions, expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, privateKey, { ...signOptions, expiresIn: '7d' });

    // SET HTTP-ONLY COOKIES
    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 mins
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

    // Do NOT send tokens in the JSON response anymore
    res.status(200).json({
      success: true,
      data: { user: { id: user._id, email: user.email, role: user.role } }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
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