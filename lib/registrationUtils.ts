/**
 * Reusable registration filtering logic
 * Eliminates duplicate code across dashboard and events page
 */

export function getActiveRegistrations(registrations: any[]) {
  return registrations.filter(reg => 
    reg.status === 'REGISTERED' && reg.event && reg.eventId
  );
}

export function getCompletedRegistrations(registrations: any[]) {
  return registrations.filter(reg => 
    reg.status === 'ATTENDED' && reg.event
  );
}

export function getRegistrationMetrics(registrations: any[]) {
  const active = getActiveRegistrations(registrations);
  const completed = getCompletedRegistrations(registrations);
  
  return {
    active,
    completed,
    totalParticipations: active.length + completed.length,
    activeCount: active.length,
    completedCount: completed.length
  };
}

export function getRegisteredEventIds(registrations: any[]) {
  return getActiveRegistrations(registrations).map(reg => reg.eventId);
}