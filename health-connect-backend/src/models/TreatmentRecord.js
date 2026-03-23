import mongoose from 'mongoose';
import Counter from './Counter.js';

const treatmentRecordSchema = new mongoose.Schema({
  _id: { type: String },
  doctor_id: { type: String, ref: 'DoctorProfile', required: true },
  patient_id: { type: String, ref: 'PatientProfile', required: true },
  visitDate: { type: Date, required: true },
  chiefComplaint: { type: String, required: true },
  is_deleted: { type: Boolean, default: false },
  deleted_at: { type: Date, default: null }
}, { timestamps: true });

// Pre-save hook for custom ID (HCTH00000000001)
treatmentRecordSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: 'treatmentRecordId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      // HCTH followed by 11 digits
      this._id = `HCTH${String(counter.seq).padStart(11, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('TreatmentRecord', treatmentRecordSchema);