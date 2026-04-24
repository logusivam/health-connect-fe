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
    const { 
      firstName, lastName, department, contactEmail, contactPhone, 
      address, avatarBase64, education, registrationNumber,
      newLeaveRequest, updateLeaveRequest, deleteLeaveRequestId
    } = req.body;
    
    const profile = await AdminProfile.findOne({ user_id: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    
    // 1. Standard field updates
    if (firstName) profile.firstName = firstName;
    if (lastName) profile.lastName = lastName;
    if (department !== undefined) profile.department = department;
    if (contactEmail !== undefined) profile.contactEmail = contactEmail;
    if (contactPhone !== undefined) profile.contactPhone = contactPhone;
    if (registrationNumber !== undefined) profile.registrationNumber = registrationNumber;
    if (address !== undefined) profile.address = address;
    if (avatarBase64) profile.avatar = avatarBase64;
    if (education !== undefined) profile.education = education;

    // 2. Create New Absence Request
    if (newLeaveRequest) {
      profile.leave_requests.push(newLeaveRequest);
    }

    // 3. Edit Existing Absence Request (Max 2 edits check)
    if (updateLeaveRequest) {
      const targetLeave = profile.leave_requests.id(updateLeaveRequest._id);
      if (targetLeave && targetLeave.editCount < 2) {
        targetLeave.fromDate = updateLeaveRequest.fromDate;
        targetLeave.toDate = updateLeaveRequest.toDate;
        targetLeave.hours = updateLeaveRequest.hours;
        targetLeave.type = updateLeaveRequest.type;
        targetLeave.editCount += 1;
      }
    }

    // 4. Delete Absence Request
    if (deleteLeaveRequestId) {
      profile.leave_requests.pull(deleteLeaveRequestId);
    }

    // 5. 30-Day Cleanup Rule
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    profile.leave_requests = profile.leave_requests.filter(req => req.fromDate >= thirtyDaysAgo);

    await profile.save();

    const user = await User.findById(req.user.id).select('last_login_at');

    res.status(200).json({ 
      success: true, 
      data: { ...profile.toObject(), last_login_at: user.last_login_at } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};