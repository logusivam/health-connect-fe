import mongoose from 'mongoose';
import Counter from './Counter.js';

const doctorProfileSchema = new mongoose.Schema({
  _id: { type: String },
  user_id: { type: String, ref: 'User', required: true }, // Links to HCU ID
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  specialization: { type: String, default: '' }, // Empty initially
  registrationNumber: { type: String }, // Mapped from phone initially
  department: { type: String, default: '' }, // Empty initially
  education: { type: String, default: '' }, // Empty initially
  contactEmail: { type: String }, // Mapped from registered email
  contactPhone: { type: String }, // Mapped from phone
  address: { type: String, default: '' },
  avatar: { type: String }, // For base64 images
  is_deleted: { type: Boolean, default: false } // Soft delete
}, { timestamps: true });

// Pre-save hook for custom ID (HCDOC000001)
doctorProfileSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: 'doctorId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this._id = `HCDOC${String(counter.seq).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('DoctorProfile', doctorProfileSchema);