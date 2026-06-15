import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const auditLogSchema = new mongoose.Schema({
  log_id: { type: String, default: uuidv4, unique: true }, // UUID PK
  
  // Who did it
  actor_user_id: { type: String, ref: 'User', default: null }, // Nullable for system actions
  actor_role: { type: String, enum: ['PATIENT', 'DOCTOR', 'ADMIN', 'SYSTEM'], default: 'SYSTEM' },
  
  // What they did
  action_type: { 
    type: String, 
    required: true,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'MFA_ATTEMPT'] 
  },
  
  // What they affected
  entity_type: { 
    type: String, 
    required: true,
    enum: ['treatment_record', 'patient', 'doctor', 'admin', 'unsuitable_medicine', 'user', 'export', 'auth']
  },
  entity_id: { type: String, default: null },
  
  // The Data Snapshots
  old_values: { type: mongoose.Schema.Types.Mixed, default: null },
  new_values: { type: mongoose.Schema.Types.Mixed, default: null },
  
  // Context
  ip_address: { type: String, default: null },
  user_agent: { type: String, default: null },
  
  // When
  occurred_at: { type: Date, default: Date.now, required: true }
});

// Indexing for faster admin queries
auditLogSchema.index({ actor_user_id: 1 });
auditLogSchema.index({ entity_type: 1, entity_id: 1 });
auditLogSchema.index({ occurred_at: -1 });

export default mongoose.model('AuditLog', auditLogSchema);