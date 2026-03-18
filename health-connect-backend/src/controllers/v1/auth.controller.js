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