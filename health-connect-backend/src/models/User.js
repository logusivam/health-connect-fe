import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Counter from './Counter.js';

const userSchema = new mongoose.Schema({
  _id: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['PATIENT', 'DOCTOR', 'ADMIN'], required: true },
  is_active: { type: Boolean, default: true },
  is_locked: { type: Boolean, default: false },
  failed_login_count: { type: Number, default: 0 },
  mfa_enabled: { type: Boolean, default: false },
  
  // NEW: DB-Level OTP Attempt Tracking
  mfa_send_count: { type: Number, default: 0 },
  mfa_blocked_until: { type: Date },

  last_login_at: { type: Date },
  password_updated_at: { type: Date },
  is_deleted: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  const doc = this;

  if (doc.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: 'userId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      doc._id = `HCU${String(counter.seq).padStart(7, '0')}`;
      
      if (doc.role === 'DOCTOR' || doc.role === 'ADMIN') {
        doc.mfa_enabled = true;
      }
    } catch (error) {
      return next(error);
    }
  }

  if (!doc.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    doc.password = await bcrypt.hash(doc.password, salt);
    doc.password_updated_at = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('User', userSchema);