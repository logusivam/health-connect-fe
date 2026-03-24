import mongoose from 'mongoose';
import Counter from './Counter.js';

const treatmentRecordSchema = new mongoose.Schema({
  _id: { type: String },
  doctor_id: { type: String, ref: 'DoctorProfile', required: true },
  patient_id: { type: String, ref: 'PatientProfile', required: true },
  visitDate: { type: Date, required: true },
  chiefComplaint: { type: String, required: true },
  
  // NEW: Clinical Fields added by the Doctor
  diagnosis: { type: String },
  treatmentPrescribed: { type: String },
  medicineName: { type: String },
  frequency: { type: String },
  durationDays: { type: String }, // Saved as String to include " days" label
  medNotes: { type: String },
  followUpDate: { type: Date },
  outcomeStatus: { type: String, enum: ['Ongoing', 'Resolved', 'Referred', 'Follow up required'] },
  followUpInstruction: { type: String },
  additionalNotes: { type: String },

  is_deleted: { type: Boolean, default: false },
  deleted_at: { type: Date, default: null }
}, { timestamps: true });

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