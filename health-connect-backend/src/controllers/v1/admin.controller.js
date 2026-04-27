import AdminProfile from '../../models/AdminProfile.js';
import User from '../../models/User.js';
import PatientProfile from '../../models/PatientProfile.js';
import DoctorProfile from '../../models/DoctorProfile.js';

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

// --- DOCTOR MANAGEMENT BY ADMIN ---

export const getAllDoctors = async (req, res) => {
  try {
    // Populate user_id to get the login_history from the User collection
    const doctors = await DoctorProfile.find({ is_deleted: false })
      .populate('user_id', 'login_history')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error fetching doctors.' });
  }
};

export const updateDoctorByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      firstName, lastName, specialization, department, 
      contactEmail, contactPhone, address, avatarBase64 
    } = req.body;

    const doctor = await DoctorProfile.findById(id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    // Update Doctor Profile fields
    if (firstName) doctor.firstName = firstName;
    if (lastName) doctor.lastName = lastName;
    if (specialization !== undefined) doctor.specialization = specialization;
    if (department !== undefined) doctor.department = department;
    if (contactEmail !== undefined) doctor.contactEmail = contactEmail;
    if (contactPhone !== undefined) doctor.contactPhone = contactPhone;
    if (address !== undefined) doctor.address = address;
    if (avatarBase64) doctor.avatar = avatarBase64;

    await doctor.save();

    // Return fully populated document for immediate frontend state update
    const updatedDoctor = await DoctorProfile.findById(id).populate('user_id', 'login_history');
    
    res.status(200).json({ success: true, data: updatedDoctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error updating doctor.' });
  }
};

export const deleteDoctorByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const doctor = await DoctorProfile.findByIdAndUpdate(id, { is_deleted: true });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    // Soft delete the base user account as well to prevent login
    await User.findByIdAndUpdate(doctor.user_id, { is_deleted: true, is_active: false });

    res.status(200).json({ success: true, message: 'Doctor record deleted securely.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error deleting doctor.' });
  }
};

// --- USER ACCOUNT MANAGEMENT BY ADMIN ---

export const getAllUsers = async (req, res) => {
  try {
    // 1. Fetch all active base users
    const users = await User.find({ is_deleted: false }).select('-password').sort({ createdAt: -1 }).lean();

    // 2. Fetch all profiles in parallel to avoid N+1 query performance issues
    const [patients, doctors, admins] = await Promise.all([
      PatientProfile.find({ is_deleted: false }).select('user_id firstName lastName').lean(),
      DoctorProfile.find({ is_deleted: false }).select('user_id firstName lastName').lean(),
      AdminProfile.find({ is_deleted: false }).select('user_id firstName lastName').lean()
    ]);

    // 3. Create a quick lookup map: { "HCU0001": "John Doe" }
    const nameMap = {};
    patients.forEach(p => { if (p.user_id) nameMap[p.user_id.toString()] = `${p.firstName} ${p.lastName}`; });
    doctors.forEach(d => { if (d.user_id) nameMap[d.user_id.toString()] = `${d.firstName} ${d.lastName}`; });
    admins.forEach(a => { if (a.user_id) nameMap[a.user_id.toString()] = `${a.firstName} ${a.lastName}`; });

    // 4. Attach names to the user array
    const mappedUsers = users.map(u => ({
      id: u._id,
      email: u.email,
      role: u.role,
      isActive: u.is_active,
      createdOn: u.createdAt,
      name: nameMap[u._id.toString()] || 'Unknown User'
    }));

    res.status(200).json({ success: true, data: mappedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: 'Server Error fetching users.' });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Safely check if the user is trying to suspend themselves
    if (req.user && req.user.id === id && !is_active) {
      return res.status(400).json({ success: false, message: 'You cannot suspend your own active session.' });
    }

    const user = await User.findOneAndUpdate(
      { _id: id }, 
      { $set: { is_active: is_active } }, 
      { new: true }
    );
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ 
      success: true, 
      message: `User account ${is_active ? 'activated' : 'suspended'} successfully.`,
      data: { isActive: user.is_active }
    });
  } catch (error) {
    console.error('Update User Status Error:', error); 
    res.status(500).json({ success: false, message: 'Server Error updating user status.' });
  }
};

// UPDATED: Added Optional Chaining (req.user?.id) to prevent TypeError
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Safely check if the user is trying to delete themselves
    if (req.user && req.user.id === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const user = await User.findOneAndUpdate(
      { _id: id }, 
      { $set: { is_deleted: true, is_active: false } }, 
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, message: 'User account securely deleted.' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ success: false, message: 'Server Error deleting user.' });
  }
};