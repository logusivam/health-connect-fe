import AdminProfile from '../../models/AdminProfile.js';
import User from '../../models/User.js';
import PatientProfile from '../../models/PatientProfile.js'; // NEW

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

// --- NEW: PATIENT MANAGEMENT BY ADMIN ---

export const getAllPatients = async (req, res) => {
  try {
    // Populate user_id to get the email from the User collection
    const patients = await PatientProfile.find({ is_deleted: false })
      .populate('user_id', 'email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error fetching patients.' });
  }
};

export const updatePatientByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      firstName, lastName, dob, gender, bloodGroup, 
      phone, address, emergencyContactName, emergencyContactPhone, 
      knownAllergies, department_involved, email, avatarBase64 
    } = req.body;

    const patient = await PatientProfile.findById(id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    // 1. Handle Email Update in the User model
    if (email) {
      const formattedEmail = email.toLowerCase();
      // Check for collisions
      const existingUser = await User.findOne({ email: formattedEmail, _id: { $ne: patient.user_id } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already in use by another account.' });
      }
      await User.findByIdAndUpdate(patient.user_id, { email: formattedEmail });
    }

    // 2. Update Patient Profile fields
    if (firstName) patient.firstName = firstName;
    if (lastName) patient.lastName = lastName;
    if (dob) patient.dob = dob;
    if (gender) patient.gender = gender;
    if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;
    if (phone) patient.phone = phone;
    if (address !== undefined) patient.address = address;
    if (emergencyContactName !== undefined) patient.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) patient.emergencyContactPhone = emergencyContactPhone;
    if (knownAllergies !== undefined) patient.knownAllergies = knownAllergies;
    if (department_involved !== undefined) patient.department_involved = department_involved;
    if (avatarBase64) patient.avatar = avatarBase64;

    await patient.save();

    // 3. Return fully populated document for immediate frontend state update
    const updatedPatient = await PatientProfile.findById(id).populate('user_id', 'email');
    
    res.status(200).json({ success: true, data: updatedPatient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error updating patient.' });
  }
};

export const deletePatientByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const patient = await PatientProfile.findByIdAndUpdate(id, { is_deleted: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    // Soft delete the base user account as well to prevent login
    await User.findByIdAndUpdate(patient.user_id, { is_deleted: true, is_active: false });

    res.status(200).json({ success: true, message: 'Patient record deleted securely.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error deleting patient.' });
  }
};