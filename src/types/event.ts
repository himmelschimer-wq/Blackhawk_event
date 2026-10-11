/**
 * Event Types & Helper Definitions
 * Supports both Supabase snake_case columns and legacy camelCase properties.
 */

export interface Event {
  id: string;
  gameId?: string;
  game_id?: string;
  gameName?: string;
  game_name?: string;
  title: string;
  description?: string;
  date?: string;
  time?: string;
  format?: string;
  prizePool?: number;
  prize_pool?: number;
  maxParticipants?: number;
  max_participants?: number;
  registrationStatus?: string;
  registration_status?: string;
  eventStatus?: string;
  event_status?: string;
  rules?: string;
  generalRules?: string;
  general_rules?: string;
  banner?: string;
  registeredCount?: number;
  registered_count?: number;
  createdAt?: string;
  created_at?: string;
  [key: string]: any;
}

/**
 * Check whether registration for a tournament event is closed based on Supabase event status and capacity.
 * 
 * Helper condition:
 * - registration_status === 'CLOSED'
 * - event_status is 'COMPLETED', 'CLOSED', or 'CANCELLED'
 * - registeredCount >= max_participants (default 48)
 */
export function isEventRegistrationClosed(
  event: Partial<Event> | null | undefined,
  registeredCount?: number
): boolean {
  if (!event) return false;

  const count = registeredCount ?? event.registeredCount ?? event.registered_count;
  const regStatus = (event.registration_status || event.registrationStatus || '').toUpperCase();
  const evStatus = (event.event_status || event.eventStatus || '').toUpperCase();
  const maxParts = event.max_participants ?? event.maxParticipants ?? 48;

  return (
    regStatus === 'CLOSED' ||
    ['COMPLETED', 'CLOSED', 'CANCELLED'].includes(evStatus) ||
    (count !== undefined && count >= maxParts)
  );
}
