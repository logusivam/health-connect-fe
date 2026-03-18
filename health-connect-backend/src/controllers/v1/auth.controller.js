import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import PatientProfile from '../../models/PatientProfile.js';

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

    // 1. Find user by email and role
    const user = await User.findOne({ email, role, is_deleted: false });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or role.' });
    }

    // 2. Check if locked
    if (user.is_locked) {
      return res.status(403).json({ success: false, message: 'Account locked due to multiple failed attempts.' });
    }

    // 3. Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failed_login_count += 1;
      if (user.failed_login_count >= 3) user.is_locked = true;
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 4. Reset failed attempts & update last login
    user.failed_login_count = 0;
    user.last_login_at = new Date();
    await user.save();

    // 5. Generate JWT (RS256)
    const privateKey = Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64').toString('ascii');
    const payload = { id: user._id, role: user.role };
    const signOptions = { 
      algorithm: 'RS256', 
      keyid: process.env.JWT_KID,
      expiresIn: '15m' // Short lived access token
    };

    const accessToken = jwt.sign(payload, privateKey, signOptions);
    const refreshToken = jwt.sign(payload, privateKey, { ...signOptions, expiresIn: '7d' });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { id: user._id, email: user.email, role: user.role }
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};