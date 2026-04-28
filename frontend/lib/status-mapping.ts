// Status mapping: Current lead status → Allowed next actions
// This prevents showing invalid status transitions and 500 errors

export const CURRENT_STATUS_TO_ALLOWED_ACTIONS: Record<string, string[]> = {
  // Fresh/New leads - no prior engagement
  'new': ['Schedule Site Visit', 'Schedule Callback', 'Schedule Meeting', 'Not Interested'],
  'pending': ['Schedule Site Visit', 'Schedule Callback', 'Schedule Meeting', 'Not Interested'],
  'expression_of_interest': ['Schedule Site Visit', 'Schedule Callback', 'Schedule Meeting'],
  'eoi': ['Schedule Site Visit', 'Schedule Callback', 'Schedule Meeting'],
  'fresh': ['Schedule Site Visit', 'Schedule Callback', 'Schedule Meeting'],

  // Meeting scheduled states - can mark as done/not done or reschedule
  'meeting_scheduled': ['Done', 'Not Done', 'Reschedule', 'Schedule Site Visit'],
  'online': ['Done', 'Not Done', 'Reschedule', 'Schedule Site Visit'],
  'on_call': ['Done', 'Not Done', 'Reschedule', 'Schedule Site Visit'],
  'in_person': ['Done', 'Not Done', 'Reschedule', 'Schedule Site Visit'],
  'others': ['Done', 'Not Done', 'Reschedule', 'Schedule Site Visit'],

  // Site visit scheduled states - can mark as done/not done or revisit
  'site_visit_scheduled': ['Done', 'Not Done', 'Reschedule', 'Revisit'],
  'first_visit': ['Done', 'Not Done', 'Reschedule', 'Revisit'],
  'revisit': ['Done', 'Not Done', 'Reschedule'],

  // Callback/follow-up states - schedule next action
  'callback': ['Schedule Site Visit', 'Schedule Meeting', 'Follow Up', 'Not Answered', 'Not Reachable'],
  'to_schedule_meeting': ['Schedule Meeting', 'Schedule Site Visit', 'Follow Up'],
  'to_schedule_site_visit': ['Schedule Site Visit', 'Follow Up'],
  'follow_up': ['Schedule Site Visit', 'Schedule Meeting'],
  'not_answered': ['Schedule Meeting', 'Try Again', 'Follow Up'],
  'not_reachable': ['Schedule Meeting', 'Try Again'],
  'busy': ['Try Later', 'Schedule Meeting'],

  // Booked - lead has purchased or is in advanced stage
  'booked': ['Follow Up', 'Back to Main'],
  'closed': ['Follow Up', 'Back to Main'],
  'not_interested': ['Follow Up', 'Back to Main'],
  'dropped': ['Follow Up', 'Back to Main'],
  'lost': ['Follow Up', 'Back to Main'],
};

export function getAllowedNextActions(statusCode: string): string[] {
  if (!statusCode) return ['Schedule Site Visit', 'Schedule Callback', 'Schedule Meeting', 'Back to Main'];
  const code = statusCode.toLowerCase().trim();
  return CURRENT_STATUS_TO_ALLOWED_ACTIONS[code] || ['Schedule Site Visit', 'Schedule Callback', 'Schedule Meeting', 'Back to Main'];
}

export function isValidNextAction(currentStatusCode: string, selectedAction: string): boolean {
  const allowed = getAllowedNextActions(currentStatusCode);
  return allowed.some(a => a.toLowerCase().includes(selectedAction.toLowerCase()));
}

