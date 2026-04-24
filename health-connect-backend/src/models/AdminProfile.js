import mongoose from 'mongoose';
import Counter from './Counter.js';

const adminProfileSchema = new mongoose.Schema({
  _id: { type: String },
  user_id: { type: String, ref: 'User', required: true }, // Links to HCU ID
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  department: { type: String, default: '' },
  registrationNumber: { type: String }, 
  contactEmail: { type: String }, 
  contactPhone: { type: String }, 
  address: { type: String, default: '' },
  avatar: { type: String }, 
  education: { type: String, default: '' },
  
  leave_requests: [{
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    hours: { type: Number, default: 0 },
    type: { type: String, enum: ['LEAVE', 'PERMISSION'], required: true },
    status: { type: String, default: 'RECORDED' },
    editCount: { type: Number, default: 0 },
    appliedAt: { type: Date, default: Date.now }
  }],

  is_deleted: { type: Boolean, default: false }
}, { timestamps: true });

// Pre-save hook for custom ID (HCADM0001)
adminProfileSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: 'adminId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      // Pad to 4 digits for HCADM0001 format
      this._id = `HCADM${String(counter.seq).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('AdminProfile', adminProfileSchema);