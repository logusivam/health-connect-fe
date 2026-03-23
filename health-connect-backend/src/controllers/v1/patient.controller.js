import PatientProfile from '../../models/PatientProfile.js';
import TreatmentRecord from '../../models/TreatmentRecord.js';
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
    const { address, emergencyContactName, emergencyContactPhone, avatarBase64, phone, email, firstName, lastName } = req.body;
    
    // 1. Update Patient Profile fields
    const profileUpdateData = {};
    if (address !== undefined) profileUpdateData.address = address;
    if (emergencyContactName !== undefined) profileUpdateData.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) profileUpdateData.emergencyContactPhone = emergencyContactPhone;
    if (phone !== undefined) profileUpdateData.phone = phone;
    // NEW: Allow updating name
    if (firstName !== undefined) profileUpdateData.firstName = firstName;
    if (lastName !== undefined) profileUpdateData.lastName = lastName;
    
    if (avatarBase64) profileUpdateData.avatar = avatarBase64;

    if (Object.keys(profileUpdateData).length > 0) {
      await PatientProfile.findOneAndUpdate(
        { user_id: req.user.id },
        { $set: profileUpdateData }
      );
    }

    // 2. Update User model field (Email)
    if (email !== undefined) {
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'This email is already in use by another account.' });
      }
      await User.findByIdAndUpdate(req.user.id, { email: email.toLowerCase() });
    }

    // 3. Refetch the fully merged profile to return
    const updatedProfile = await PatientProfile.findOne({ user_id: req.user.id });
    const updatedUser = await User.findById(req.user.id).select('email');

    res.status(200).json({ 
      success: true, 
      data: { ...updatedProfile.toObject(), email: updatedUser.email } 
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// NEW: Book Appointment / Create Treatment Record
export const bookAppointment = async (req, res) => {
  try {
    const { doctor_id, visitDate, chiefComplaint } = req.body;

    // Get the patient's profile ID using their logged-in user ID
    const patientProfile = await PatientProfile.findOne({ user_id: req.user.id });
    
    if (!patientProfile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const newRecord = new TreatmentRecord({
      doctor_id,
      patient_id: patientProfile._id,
      visitDate,
      chiefComplaint
    });

    const savedRecord = await newRecord.save();

    res.status(201).json({ success: true, data: savedRecord, message: 'Appointment booked successfully.' });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ success: false, message: 'Server Error booking appointment.' });
  }
};

// NEW: Fetch all appointments for the logged-in patient
export const getPatientAppointments = async (req, res) => {
  try {
    const patientProfile = await PatientProfile.findOne({ user_id: req.user.id });
    
    if (!patientProfile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    // Fetch records and populate the doctor's name and department
    const records = await TreatmentRecord.find({ 
      patient_id: patientProfile._id, 
      is_deleted: false 
    })
    .populate('doctor_id', 'firstName lastName department')
    .sort({ visitDate: -1 }); // Sort newest first

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching appointments.' });
  }
};