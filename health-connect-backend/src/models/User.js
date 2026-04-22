import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Counter from './Counter.js';

const userSchema = new mongoose.Schema({
  _id: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['PATIENT', 'DOCTOR', 'ADMIN'], required: true },
  is_active: { type: Boolean, default: true },
  
  // NEW: Advanced Lockout Tracking
  is_locked: { type: Boolean, default: false },
  locked_until: { type: Date }, // Automatically unlocks after this time
  failed_login_count: [{ 
    count: { type: Number },
    date: { type: Date }
  }],
  current_failed_attempts: { type: Number, default: 0 }, // Tracks consecutive failures

  mfa_enabled: { type: Boolean, default: false },
  mfa_send_count: { type: Number, default: 0 },
  mfa_blocked_until: { type: Date },

  // UPDATED: Store login history as an array of objects
  login_history: [{
    logged_in_at: { type: Date }
  }],
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
    
    // NEW: If password is changed, instantly unlock the account
    doc.is_locked = false;
    doc.locked_until = null;
    doc.current_failed_attempts = 0;
    
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('User', userSchema);