import mongoose from 'mongoose';
import Counter from './Counter.js';

const doctorProfileSchema = new mongoose.Schema({
  _id: { type: String },
  user_id: { type: String, ref: 'User', required: true }, // Links to HCU ID
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  specialization: { type: String, default: '' },
  registrationNumber: { type: String }, 
  department: { type: String, default: '' }, 
  education: { type: String, default: '' }, 
  contactEmail: { type: String }, 
  contactPhone: { type: String }, 
  address: { type: String, default: '' },
  avatar: { type: String }, 
  total_treated: { type: Number, default: 0 },
  total_flags: { type: Number, default: 0 },
  
  
  // UPDATED: Added editCount to track modifications
  leave_requests: [{
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    hours: { type: Number, default: 0 },
    type: { type: String, enum: ['LEAVE', 'PERMISSION'], required: true },
    status: { type: String, default: 'RECORDED' },
    editCount: { type: Number, default: 0 }, // NEW: Max 2 edits allowed
    appliedAt: { type: Date, default: Date.now }
  }],

  is_deleted: { type: Boolean, default: false }
}, { timestamps: true });

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