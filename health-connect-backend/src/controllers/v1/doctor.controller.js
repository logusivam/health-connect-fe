import DoctorProfile from '../../models/DoctorProfile.js';
import User from '../../models/User.js';
import PatientProfile from '../../models/PatientProfile.js';
import MedicalDepartment from '../../models/MedicalDepartment.js';
import Medicine from '../../models/Medicine.js';
import UnsuitableMedicine from '../../models/UnsuitableMedicine.js';
import TreatmentRecord from '../../models/TreatmentRecord.js';

export const getDoctorProfile = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ user_id: req.user.id });
    
    // Fetch the login history array instead of a single date
    const user = await User.findById(req.user.id).select('login_history');

    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    // Determine the correct "Last Login" time to show in the UI
    const history = user.login_history || [];
    let previousSessionDate = null;

    if (history.length > 1) {
      // The very last item (history.length - 1) is the CURRENT active session.
      // The item before it (history.length - 2) is their PREVIOUS login session.
      previousSessionDate = history[history.length - 2].logged_in_at;
    } else if (history.length === 1) {
      // If it's their very first time logging in, just show the current time
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

export const updateDoctorProfile = async (req, res) => {
  try {
    const { firstName, lastName, specialization, department, contactEmail, contactPhone, address, avatarBase64, education } = req.body;
    
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (department !== undefined) updateData.department = department;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (address !== undefined) updateData.address = address;
    if (avatarBase64) updateData.avatar = avatarBase64;
    if (education !== undefined) updateData.education = education;

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

// 1. Search Patients for Autocomplete
export const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(200).json({ success: true, data: [] });

    // Search by ID, First Name, or Last Name using Regex
    const patients = await PatientProfile.find({
      $or: [
        { _id: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ],
      is_deleted: false
    }).select('_id firstName lastName').limit(10); // Limit to 10 suggestions

    res.status(200).json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error searching patients.' });
  }
};

// 2. Get Medicines strictly for the logged-in doctor's department
export const getDepartmentMedicines = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ user_id: req.user.id });
    if (!doctor || !doctor.department) {
      return res.status(200).json({ success: true, data: [] });
    }

    const department = await MedicalDepartment.findOne({ name: doctor.department });
    if (!department) return res.status(200).json({ success: true, data: [] });

    // Fetch the medicines doc linked to this department ID
    const medicinesDoc = await Medicine.findOne({ department_id: department._id });
    
    res.status(200).json({ success: true, data: medicinesDoc ? medicinesDoc.medicines : [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching medicines.' });
  }
};

// 3. Get all flags (Active & Resolved)
export const getFlags = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ user_id: req.user.id });
    
    // STRICT FILTER: Only get flags created by this specific doctor
    const flags = await UnsuitableMedicine.find({ flagged_by_doctor_id: doctor._id })
      .populate('patient_id', 'firstName lastName _id')
      .populate('flagged_by_doctor_id', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: flags });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching flags.' });
  }
};

// 4. Create a new Flag
export const createFlag = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ user_id: req.user.id });
    const { patient_id, medicine_name, reason, severity, flagged_at, flag_type } = req.body;

    const newFlag = new UnsuitableMedicine({
      patient_id,
      flagged_by_doctor_id: doctor._id,
      medicine_name,
      reason,
      severity,
      flagged_at,
      flag_type,
      is_active: flag_type === 'Unsuit'
    });

    await newFlag.save();
    res.status(201).json({ success: true, message: 'Flag saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving flag.' });
  }
};

// 5. Update an existing Flag
export const updateFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { flag_type, medicine_name, reason, severity, flagged_at } = req.body;

    const flag = await UnsuitableMedicine.findById(id);
    if (!flag) return res.status(404).json({ success: false, message: 'Flag not found' });

    // Handle Audit Trail logic if changing from Unsuit -> Suit
    if (flag_type === 'Suit' && flag.flag_type === 'Unsuit') {
      flag.is_active = false;
      flag.removed_by_user_id = req.user.id; // CHANGED: Now uses the base User ID
      flag.removed_at = new Date();
    } else if (flag_type === 'Unsuit') {
      flag.is_active = true;
      flag.removed_by_user_id = null;
      flag.removed_at = null;
    }

    flag.flag_type = flag_type;
    flag.medicine_name = medicine_name;
    flag.reason = reason;
    flag.severity = severity;
    flag.flagged_at = flagged_at;

    await flag.save();
    res.status(200).json({ success: true, message: 'Flag updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating flag.' });
  }
};

// 1. Fetch Today's Appointments for the logged-in doctor
export const getTodayAppointments = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ user_id: req.user.id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    // Define Today's boundaries
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await TreatmentRecord.find({
      doctor_id: doctor._id,
      visitDate: { $gte: startOfDay, $lte: endOfDay },
      is_deleted: false
    }).populate('patient_id', 'firstName lastName _id');

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching today\'s appointments.' });
  }
};

// 2. Fetch Completed Treatment Records
export const getTreatmentRecords = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ user_id: req.user.id });
    
    // Fetch records that have a diagnosis (meaning the doctor has filled them out)
    const records = await TreatmentRecord.find({
      doctor_id: doctor._id,
      diagnosis: { $exists: true, $ne: "" },
      is_deleted: false
    })
    .populate('patient_id', 'firstName lastName _id')
    .sort({ visitDate: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching treatment records.' });
  }
};

// 3. Update Treatment Record (Save Clinical Findings)
export const updateTreatmentRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await TreatmentRecord.findByIdAndUpdate(
      id, 
      { $set: req.body }, 
      { new: true }
    ).populate('patient_id', 'firstName lastName _id');
    
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    res.status(200).json({ success: true, data: record, message: 'Record updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating record.' });
  }
};

// NEW: Fetch uniquely grouped patient history for the logged-in doctor
export const getPatientsHistory = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ user_id: req.user.id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const myRecords = await TreatmentRecord.find({ doctor_id: doctor._id, is_deleted: false }).select('patient_id');
    const patientIds = [...new Set(myRecords.map(r => r.patient_id.toString()))];

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch all treatment records for these patients up to today
    const allRecords = await TreatmentRecord.find({
      patient_id: { $in: patientIds },
      visitDate: { $lte: endOfToday }, // Till current day's date
      is_deleted: false
    })
    .populate('patient_id', 'firstName lastName avatar _id')
    .populate('doctor_id', 'firstName lastName avatar _id specialization department')
    .sort({ visitDate: -1 }); 

    // Fetch all ACTIVE unsuitable medicines for these patients
    const activeFlags = await UnsuitableMedicine.find({
      patient_id: { $in: patientIds },
      is_active: true // Active means Unsuitable
    }).populate('flagged_by_doctor_id', 'firstName lastName avatar specialization');

    const patientsMap = {};

    allRecords.forEach(record => {
      if (!record.patient_id || !record.doctor_id) return; 

      const pId = record.patient_id._id.toString();
      
      if (!patientsMap[pId]) {
        patientsMap[pId] = {
          id: pId,
          patientId: pId,
          patientName: `${record.patient_id.firstName} ${record.patient_id.lastName}`,
          avatar: record.patient_id.avatar || null,
          doctors: new Map(),
          departments: new Set(),
          latestMyRecord: null,
          unsuitableMedicines: [] // Initialize empty array for flags
        };
      }

      const dId = record.doctor_id._id.toString();
      if (!patientsMap[pId].doctors.has(dId)) {
        patientsMap[pId].doctors.set(dId, {
          id: dId,
          name: `Dr. ${record.doctor_id.firstName} ${record.doctor_id.lastName}`,
          avatar: record.doctor_id.avatar || null,
          department: record.doctor_id.department || 'General',
          specialization: record.doctor_id.specialization || ''
        });
      }

      if (record.doctor_id.department) {
        patientsMap[pId].departments.add(record.doctor_id.department);
      }

      // Check against logged-in doctor
      if (dId === doctor._id.toString()) {
        // If we haven't tracked a record for this doctor yet, store it
        if (!patientsMap[pId].latestMyRecord) {
          patientsMap[pId].latestMyRecord = {
            diagnosis: record.diagnosis || '', 
            status: record.outcomeStatus || '',
            lastDateVisited: new Date(record.visitDate).toLocaleDateString()
          };
        } 
        // If we tracked an empty/pending record, backfill the diagnosis from the next newest completed record!
        else if (!patientsMap[pId].latestMyRecord.diagnosis && record.diagnosis) {
          patientsMap[pId].latestMyRecord.diagnosis = record.diagnosis;
          patientsMap[pId].latestMyRecord.status = record.outcomeStatus || patientsMap[pId].latestMyRecord.status;
        }
      }
    });

    // Map the active flags to the correct patient in the map
    activeFlags.forEach(flag => {
      const pId = flag.patient_id.toString();
      if (patientsMap[pId]) {
        patientsMap[pId].unsuitableMedicines.push({
          medicineName: flag.medicine_name,
          reason: flag.reason,
          severity: flag.severity,
          date: flag.flagged_at,
          doctor: {
            name: `Dr. ${flag.flagged_by_doctor_id.firstName} ${flag.flagged_by_doctor_id.lastName}`,
            avatar: flag.flagged_by_doctor_id.avatar || null,
            specialization: flag.flagged_by_doctor_id.specialization || 'General Practice'
          }
        });
      }
    });

    const result = Object.values(patientsMap).map(p => ({
      id: p.id,
      patientId: p.patientId,
      patientName: p.patientName,
      avatar: p.avatar,
      department: Array.from(p.departments),
      doctors: Array.from(p.doctors.values()),
      diagnosis: p.latestMyRecord?.diagnosis || 'Pending Diagnosis', 
      status: p.latestMyRecord?.status || 'Ongoing',
      lastDateVisited: p.latestMyRecord?.lastDateVisited || 'N/A',
      unsuitableMedicines: p.unsuitableMedicines // Pass it to frontend
    }));

    res.status(200).json({ success: true, data: result, doctorId: doctor._id.toString() });
  } catch (error) {
    console.error('Error fetching patients history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};