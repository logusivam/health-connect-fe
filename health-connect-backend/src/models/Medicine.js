import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  _id: { type: String },
  medicines: [{ type: String }],
  is_active: { type: Boolean, default: true },
  department_id: { type: String, ref: 'MedicalDepartment' }
}, { timestamps: true });

export default mongoose.model('Medicine', medicineSchema);