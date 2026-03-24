import mongoose from 'mongoose';
import Counter from './Counter.js';

const unsuitableMedicineSchema = new mongoose.Schema({
  _id: { type: String },
  patient_id: { type: String, ref: 'PatientProfile', required: true },
  flagged_by_doctor_id: { type: String, ref: 'DoctorProfile', required: true },
  medicine_name: { type: String, required: true },
  reason: { type: String, required: true, maxlength: 1000 },
  severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], required: true },
  flagged_at: { type: Date, required: true },
  flag_type: { type: String, enum: ['Unsuit', 'Suit'], required: true },
  is_active: { type: Boolean, default: true },
  removed_by_user_id: { type: String, ref: 'User' }, // CHANGED: Now references User model
  removed_at: { type: Date } 
}, { timestamps: true });

unsuitableMedicineSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: 'unsuitableMedicineId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this._id = `HCUM${String(counter.seq).padStart(7, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('UnsuitableMedicine', unsuitableMedicineSchema);