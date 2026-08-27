module.exports = {
  ROLES: {
    CONSUMER: 'consumer',
    LMO: 'lmo',
    GATC: 'gatc',
    ADMIN: 'admin',
  },
  APPLICATION_STATUS: {
    SUBMITTED: 'submitted',
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
  },
  APPLICATION_TYPE: {
    NEW_VERIFICATION: 'new_verification',
    RE_VERIFICATION: 're_verification',
  },
  INSTRUMENT_CATEGORY: {
    WEIGHING_SCALE: 'weighing_scale',
    WEIGHBRIDGE: 'weighbridge',
    TAXIMETER: 'taximeter',
    FUEL_DISPENSER: 'fuel_dispenser',
    WATER_METER: 'water_meter',
    LENGTH_MEASURE: 'length_measure',
    VOLUME_MEASURE: 'volume_measure',
  },
  INSTRUMENT_STATUS: {
    REGISTERED: 'registered',
    PENDING_VERIFICATION: 'pending_verification',
    VERIFIED: 'verified',
    EXPIRED: 'expired',
    REJECTED: 'rejected',
  },
  CERTIFICATE_STATUS: {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    REVOKED: 'revoked',
  },
  NOTIFICATION_TYPE: {
    EXPIRY_ALERT: 'expiry_alert',
    APPLICATION_UPDATE: 'application_update',
    SCHEDULE_ALERT: 'schedule_alert',
    GENERAL: 'general',
  },
  GATC_APPROVAL_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    SUSPENDED: 'suspended',
  },
};
