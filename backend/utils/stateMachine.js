// /backend/utils/stateMachine.js
// Owned by Module 3. This is a NEW file Module 3 owns (per Master Spec rule:
// "If a module needs something not in this spec, it must add it to a new file
// the module owns, not modify a shared file"). It does not touch
// /shared/constants.js or Application.js's schema — it only encodes which
// APPLICATION_STATUS transitions Module 3's endpoints are allowed to perform.
//
// Application.status enum (Master Spec Section 3.4 / 7):
//   submitted -> scheduled -> in_progress -> completed
//                                          -> rejected
//   submitted -> cancelled   (owned by Module 2's /applications/:id/cancel route,
//                              not enforced here)
//
// NOTE ON SCOPE: the spec's frozen APPLICATION_STATUS enum has no "inspected" or
// "certified" states. Certificate issuance is Module 4's concern (a separate
// Certificate document keyed off a 'completed' Application + a 'pass'
// VerificationRecord) and is intentionally not modeled as an Application status
// here, since Module 3 cannot add values to a shared enum.

const { APPLICATION_STATUS } = require('../../shared/constants');

// Transitions allowed via PATCH /scheduling/applications/:id/assign
const ASSIGNABLE_FROM = [APPLICATION_STATUS.SUBMITTED];
const ASSIGN_TO = APPLICATION_STATUS.SCHEDULED;

// Transitions allowed via PATCH /scheduling/applications/:id/status (manual)
const MANUAL_TRANSITIONS = {
  [APPLICATION_STATUS.SCHEDULED]: [APPLICATION_STATUS.IN_PROGRESS, APPLICATION_STATUS.REJECTED],
  [APPLICATION_STATUS.IN_PROGRESS]: [APPLICATION_STATUS.COMPLETED, APPLICATION_STATUS.REJECTED],
};

// Transition applied automatically when a VerificationRecord is created via
// POST /verification/:applicationId, keyed by overallResult.
const RESULT_TO_STATUS = {
  pass: APPLICATION_STATUS.COMPLETED,
  fail: APPLICATION_STATUS.REJECTED,
};

function canAssign(currentStatus) {
  return ASSIGNABLE_FROM.includes(currentStatus);
}

function canTransition(currentStatus, nextStatus) {
  const allowed = MANUAL_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

function canRecordVerification(currentStatus) {
  // A verification can be recorded once an application has been scheduled
  // and, optionally, moved to in_progress.
  return (
    currentStatus === APPLICATION_STATUS.SCHEDULED ||
    currentStatus === APPLICATION_STATUS.IN_PROGRESS
  );
}

function statusForResult(overallResult) {
  return RESULT_TO_STATUS[overallResult] || null;
}

module.exports = {
  ASSIGN_TO,
  canAssign,
  canTransition,
  canRecordVerification,
  statusForResult,
};
