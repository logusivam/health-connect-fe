import DoctorProfile from '../../models/DoctorProfile.js';
import User from '../../models/User.js';
import PatientProfile from '../../models/PatientProfile.js';
import MedicalDepartment from '../../models/MedicalDepartment.js';
import Medicine from '../../models/Medicine.js';
import UnsuitableMedicine from '../../models/UnsuitableMedicine.js';
import TreatmentRecord from '../../models/TreatmentRecord.js';
import AuditService from '../../services/audit.service.js'; // NEW: Imported AuditService

export const getDoctorProfile = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ user_id: req.user.id });
    const user = await User.findById(req.user.id).select('login_history');

    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

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

export const updateDoctorProfile = async (req, res) => {
  try {
    const { 
      firstName, lastName, specialization, department, 
      contactEmail, contactPhone, address, avatarBase64, education,
      newLeaveRequest, updateLeaveRequest, deleteLeaveRequestId
    } = req.body;
    
    const profile = await DoctorProfile.findOne({ user_id: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    if (firstName) profile.firstName = firstName;
    if (lastName) profile.lastName = lastName;
    if (specialization !== undefined) profile.specialization = specialization;
    if (department !== undefined) profile.department = department;
    if (contactEmail !== undefined) profile.contactEmail = contactEmail;
    if (contactPhone !== undefined) profile.contactPhone = contactPhone;
    if (address !== undefined) profile.address = address;
    if (avatarBase64) profile.avatar = avatarBase64;
    if (education !== undefined) profile.education = education;

    if (newLeaveRequest) profile.leave_requests.push(newLeaveRequest);

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

    if (deleteLeaveRequestId) {
      profile.leave_requests.pull(deleteLeaveRequestId);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    profile.leave_requests = profile.leave_requests.filter(req => req.fromDate >= thirtyDaysAgo);

    await profile.save();

    const user = await User.findById(req.user.id).select('last_login_at');

    // --- AUDIT LOG: Doctor Profile Update ---
    AuditService.logAction(req, {
      action_type: 'UPDATE',
      entity_type: 'doctor',
      entity_id: profile._id,
      new_values: { firstName, lastName, department, newLeaveRequest, updateLeaveRequest, deleteLeaveRequestId } // Truncated for security
    });

    res.status(200).json({ 
      success: true, 
      data: { ...profile.toObject(), last_login_at: user.last_login_at } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getDoctorDirectory = async (req, res) => {
  try {
    const doctors = await DoctorProfile.find({ is_deleted: false })
      .select('firstName lastName department specialization avatar leave_requests _id');
    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(200).json({ success: true, data: [] });

    const patients = await PatientProfile.find({
      $or: [
        { _id: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ],
      is_deleted: false
    }).select('_id firstName lastName').limit(10); 

    res.status(200).json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error searching patients.' });
  }
};

export const getDepartmentMedicines = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ user_id: req.user.id });
    if (!doctor || !doctor.department) return res.status(200).json({ success: true, data: [] });

    const department = await MedicalDepartment.findOne({ name: doctor.department });
    if (!department) return res.status(200).json({ success: true, data: [] });

    const medicinesDoc = await Medicine.findOne({ department_id: department._id });
    res.status(200).json({ success: true, data: medicinesDoc ? medicinesDoc.medicines : [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching medicines.' });
  }
};

export const getFlags = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ user_id: req.user.id });
    const flags = await UnsuitableMedicine.find({ flagged_by_doctor_id: doctor._id })
      .populate('patient_id', 'firstName lastName _id')
      .populate('flagged_by_doctor_id', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: flags });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching flags.' });
  }
};

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

    // --- AUDIT LOG: Flag Created ---
    AuditService.logAction(req, {
      action_type: 'CREATE',
      entity_type: 'unsuitable_medicine',
      entity_id: newFlag._id,
      new_values: { patient_id, medicine_name, flag_type, severity }
    });

    res.status(201).json({ success: true, message: 'Flag saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving flag.' });
  }
};

export const updateFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { flag_type, medicine_name, reason, severity, flagged_at } = req.body;

    const flag = await UnsuitableMedicine.findById(id);
    if (!flag) return res.status(404).json({ success: false, message: 'Flag not found' });

    if (flag_type === 'Suit' && flag.flag_type === 'Unsuit') {
      flag.is_active = false;
      flag.removed_by_user_id = req.user.id; 
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

    // --- AUDIT LOG: Flag Updated ---
    AuditService.logAction(req, {
      action_type: 'UPDATE',
      entity_type: 'unsuitable_medicine',
      entity_id: flag._id,
      new_values: { flag_type, severity }
    });

    res.status(200).json({ success: true, message: 'Flag updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating flag.' });
  }
};

export const getTodayAppointments = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ user_id: req.user.id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

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

export const getTreatmentRecords = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ user_id: req.user.id });
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

export const updateTreatmentRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await TreatmentRecord.findByIdAndUpdate(
      id, 
      { $set: req.body }, 
      { new: true }
    ).populate('patient_id', 'firstName lastName _id');
    
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    // --- AUDIT LOG: Clinical Record Updated ---
    AuditService.logAction(req, {
      action_type: 'UPDATE',
      entity_type: 'treatment_record',
      entity_id: record._id,
      new_values: { outcomeStatus: req.body.outcomeStatus, diagnosis: req.body.diagnosis }
    });

    res.status(200).json({ success: true, data: record, message: 'Record updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating record.' });
  }
};

export const getPatientsHistory = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ user_id: req.user.id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const myRecords = await TreatmentRecord.find({ doctor_id: doctor._id, is_deleted: false }).select('patient_id');
    const patientIds = [...new Set(myRecords.map(r => r.patient_id.toString()))];

    const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

    const allRecords = await TreatmentRecord.find({
      patient_id: { $in: patientIds },
      visitDate: { $lte: endOfToday }, 
      is_deleted: false
    })
    .populate('patient_id', 'firstName lastName avatar _id')
    .populate('doctor_id', 'firstName lastName avatar _id specialization department')
    .sort({ visitDate: -1 }); 

    const activeFlags = await UnsuitableMedicine.find({
      patient_id: { $in: patientIds },
      is_active: true 
    }).populate('flagged_by_doctor_id', 'firstName lastName avatar specialization');

    const patientsMap = {};

    allRecords.forEach(record => {
      if (!record.patient_id || !record.doctor_id) return; 

      const pId = record.patient_id._id.toString();
      
      if (!patientsMap[pId]) {
        patientsMap[pId] = {
          id: pId, patientId: pId,
          patientName: `${record.patient_id.firstName} ${record.patient_id.lastName}`,
          avatar: record.patient_id.avatar || null,
          doctors: new Map(), departments: new Set(),
          latestMyRecord: null, unsuitableMedicines: [] 
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

      if (record.doctor_id.department) patientsMap[pId].departments.add(record.doctor_id.department);

      if (dId === doctor._id.toString()) {
        if (!patientsMap[pId].latestMyRecord) {
          patientsMap[pId].latestMyRecord = {
            diagnosis: record.diagnosis || '', 
            status: record.outcomeStatus || '',
            lastDateVisited: new Date(record.visitDate).toLocaleDateString()
          };
        } else if (!patientsMap[pId].latestMyRecord.diagnosis && record.diagnosis) {
          patientsMap[pId].latestMyRecord.diagnosis = record.diagnosis;
          patientsMap[pId].latestMyRecord.status = record.outcomeStatus || patientsMap[pId].latestMyRecord.status;
        }
      }
    });

    activeFlags.forEach(flag => {
      const pId = flag.patient_id.toString();
      if (patientsMap[pId]) {
        patientsMap[pId].unsuitableMedicines.push({
          medicineName: flag.medicine_name, reason: flag.reason,
          severity: flag.severity, date: flag.flagged_at,
          doctor: {
            name: `Dr. ${flag.flagged_by_doctor_id.firstName} ${flag.flagged_by_doctor_id.lastName}`,
            avatar: flag.flagged_by_doctor_id.avatar || null,
            specialization: flag.flagged_by_doctor_id.specialization || 'General Practice'
          }
        });
      }
    });

    const result = Object.values(patientsMap).map(p => ({
      id: p.id, patientId: p.patientId, patientName: p.patientName, avatar: p.avatar,
      department: Array.from(p.departments), doctors: Array.from(p.doctors.values()),
      diagnosis: p.latestMyRecord?.diagnosis || 'Pending Diagnosis', 
      status: p.latestMyRecord?.status || 'Ongoing',
      lastDateVisited: p.latestMyRecord?.lastDateVisited || 'N/A',
      unsuitableMedicines: p.unsuitableMedicines 
    }));

    res.status(200).json({ success: true, data: result, doctorId: doctor._id.toString() });
  } catch (error) {
    console.error('Error fetching patients history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};