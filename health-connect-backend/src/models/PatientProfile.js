import mongoose from 'mongoose';
import Counter from './Counter.js';

const patientProfileSchema = new mongoose.Schema({
  _id: { type: String },
  user_id: { type: String, ref: 'User', required: true }, // Links to HCU ID
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  bloodGroup: { type: String },
  phone: { type: String, required: true },
  address: { type: String },
  emergencyContactName: { type: String },
  emergencyContactPhone: { type: String },
  knownAllergies: [{ type: String }],
  avatar: { type: String }, // ADDED: Required to save the base64 image
  is_deleted: { type: Boolean, default: false } // Soft delete
}, { timestamps: true });

// Pre-save hook for custom ID (pat-0000001)
patientProfileSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: 'patientId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this._id = `pat-${String(counter.seq).padStart(7, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('PatientProfile', patientProfileSchema);