import AuditLog from '../models/AuditLog.js';

/**
 * Highly optimized, "Fire-and-Forget" Audit Logger.
 * Executes asynchronously without blocking the main API response thread.
 */
class AuditService {
  static logAction(req, params) {
    // Fire and forget (No await)
    setImmediate(async () => {
      try {
        const {
          actor_user_id = req?.user?.id || null,
          actor_role = req?.user?.role || 'SYSTEM',
          action_type,
          entity_type,
          entity_id = null,
          old_values = null,
          new_values = null
        } = params;

        // Extract context safely
        const ip_address = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || null;
        const user_agent = req?.headers?.['user-agent'] || null;

        const auditEntry = new AuditLog({
          actor_user_id,
          actor_role,
          action_type,
          entity_type,
          entity_id,
          old_values,
          new_values,
          ip_address,
          user_agent
        });

        await auditEntry.save();
      } catch (error) {
        // Silently log errors to the server console so they don't break the application flow
        console.error('Audit Logging Failed:', error.message);
      }
    });
  }
}

export default AuditService;