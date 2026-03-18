import PatientProfile from '../../models/PatientProfile.js';
import User from '../../models/User.js';

// GET /api/v1/patients/profile
export const getPatientProfile = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ user_id: req.user.id });
    const user = await User.findById(req.user.id).select('email');

    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    res.status(200).json({ success: true, data: { ...profile.toObject(), email: user.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// PUT /api/v1/patients/profile
export const updatePatientProfile = async (req, res) => {
  try {
    const { address, emergencyContactName, emergencyContactPhone, avatarBase64 } = req.body;
    
    // Only allow updating specific fields
    const updateData = {};
    if (address) updateData.address = address;
    if (emergencyContactName) updateData.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone) updateData.emergencyContactPhone = emergencyContactPhone;
    if (avatarBase64) updateData.avatar = avatarBase64; // Requires adding 'avatar: String' to PatientProfile model

    const profile = await PatientProfile.findOneAndUpdate(
      { user_id: req.user.id },
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};