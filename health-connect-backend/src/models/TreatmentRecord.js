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
  
  // CHANGED: Array of Medication Objects
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