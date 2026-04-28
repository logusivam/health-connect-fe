import mongoose from 'mongoose';
import Counter from './Counter.js';

const treatmentRecordSchema = new mongoose.Schema({
  _id: { type: String },
  doctor_id: { type: String, ref: 'DoctorProfile', required: true },
  patient_id: { type: String, ref: 'PatientProfile', required: true },
  followUp_for_record_id: { type: String, ref: 'TreatmentRecord', default: null }, // Link to the original record for follow-ups
  visitDate: { type: Date, required: true },
  chiefComplaint: { type: String, required: true },
  
  diagnosis: { type: String },
  treatmentPrescribed: { type: String },
  
  medications: [{
    name: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true }
  }],
  
  medNotes: { type: String },
  followUpDate: { type: Date },
  outcomeStatus: { type: String, enum: ['Ongoing', 'Resolved', 'Referred', 'Follow up required'] },
  followUpInstruction: { type: String },
  additionalNotes: { type: String },

  is_deleted: { type: Boolean, default: false },
  deleted_at: { type: Date, default: null }
}, { timestamps: true });

// --- NEW: Real-time Stat Calculator ---
// This function finds all records for a specific doctor that have a diagnosis and outcome, 
// extracts the unique patient IDs, and instantly updates the DoctorProfile.
treatmentRecordSchema.statics.calculateTotalTreated = async function (doctorId) {
  try {
    const records = await this.find({
      doctor_id: doctorId,
      diagnosis: { $exists: true, $ne: "" },
      outcomeStatus: { $exists: true, $ne: "" },
      is_deleted: false
    }).select('patient_id');

    // Use a Set to extract strictly unique patient IDs
    const uniquePatients = new Set(records.map(record => record.patient_id.toString()));

    await mongoose.model('DoctorProfile').findByIdAndUpdate(
      doctorId,
      { total_treated: uniquePatients.size }
    );
  } catch (error) {
    console.error('Error calculating total_treated:', error);
  }
};

// Hook: Runs after a new document is saved
treatmentRecordSchema.post('save', function () {
  this.constructor.calculateTotalTreated(this.doctor_id);
});

// Hook: Runs after a document is updated (e.g., when diagnosis/outcome is added)
treatmentRecordSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    await doc.constructor.calculateTotalTreated(doc.doctor_id);
  }
});

treatmentRecordSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: 'treatmentRecordId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this._id = `HCTH${String(counter.seq).padStart(11, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('TreatmentRecord', treatmentRecordSchema);