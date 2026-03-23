import mongoose from 'mongoose';

const medicalDepartmentSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  specializations: [{ type: String }],
  is_active: { type: Boolean, default: true }
}, { 
    timestamps: true,
    collection: 'medical_departments'
 });

export default mongoose.model('MedicalDepartment', medicalDepartmentSchema);