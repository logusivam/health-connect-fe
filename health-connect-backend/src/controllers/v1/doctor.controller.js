import DoctorProfile from '../../models/DoctorProfile.js';
import User from '../../models/User.js';

export const getDoctorProfile = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ user_id: req.user.id });
    const user = await User.findById(req.user.id).select('last_login_at');

    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    res.status(200).json({ 
      success: true, 
      data: { ...profile.toObject(), last_login_at: user.last_login_at } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateDoctorProfile = async (req, res) => {
  try {
    const { firstName, lastName, specialization, department, contactEmail, contactPhone, address, avatarBase64 } = req.body;
    
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (department !== undefined) updateData.department = department;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (address !== undefined) updateData.address = address;
    if (avatarBase64) updateData.avatar = avatarBase64;

    const profile = await DoctorProfile.findOneAndUpdate(
      { user_id: req.user.id },
      { $set: updateData },
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

// GET /api/v1/doctors/directory
export const getDoctorDirectory = async (req, res) => {
  try {
    // Only return active, non-deleted doctors. 
    // We select only the safe public fields to send to the frontend.
    const doctors = await DoctorProfile.find({ is_deleted: false })
      .select('firstName lastName department specialization avatar _id');
    
    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    console.error("Error fetching doctor directory:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};