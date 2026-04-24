import AdminProfile from '../../models/AdminProfile.js';
import User from '../../models/User.js';

export const getAdminProfile = async (req, res) => {
  try {
    const profile = await AdminProfile.findOne({ user_id: req.user.id });
    const user = await User.findById(req.user.id).select('login_history');

    if (!profile) return res.status(404).json({ success: false, message: 'Admin profile not found' });

    // Determine the correct "Last Login" time to show in the UI
    const history = user.login_history || [];
    let previousSessionDate = null;

    if (history.length > 1) {
      previousSessionDate = history[history.length - 2].logged_in_at;
    } else if (history.length === 1) {
      previousSessionDate = history[0].logged_in_at;
    }

    res.status(200).json({ 
      success: true, 
      data: { ...profile.toObject(), last_login_at: previousSessionDate } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// NEW: Update Admin Profile Handler
export const updateAdminProfile = async (req, res) => {
  try {
    const { firstName, lastName, department, contactEmail, contactPhone, address, avatarBase64, education, registrationNumber } = req.body;
    
    let updateQuery = { $set: {} };
    
    if (firstName) updateQuery.$set.firstName = firstName;
    if (lastName) updateQuery.$set.lastName = lastName;
    if (department !== undefined) updateQuery.$set.department = department;
    if (contactEmail !== undefined) updateQuery.$set.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateQuery.$set.contactPhone = contactPhone;
    if (registrationNumber !== undefined) updateQuery.$set.registrationNumber = registrationNumber;
    if (address !== undefined) updateQuery.$set.address = address;
    if (avatarBase64) updateQuery.$set.avatar = avatarBase64;
    if (education !== undefined) updateQuery.$set.education = education;

    const profile = await AdminProfile.findOneAndUpdate(
      { user_id: req.user.id },
      updateQuery,
      { new: true }
    );

    const user = await User.findById(req.user.id).select('last_login_at');

    res.status(200).json({ 
      success: true, 
      data: { ...profile.toObject(), last_login_at: user.last_login_at } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};