/**
 * Google Calendar API integration
 * Syncs provider availability with Google Calendar
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface CalendarEvent {
  id?: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  description?: string;
  location?: string;
}

/**
 * Initialize Google Calendar API
 * Note: This requires OAuth 2.0 authentication
 * For now, this provides the structure for future implementation
 */
export class GoogleCalendarSync {
  private accessToken: string | null = null;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null;
  }

  /**
   * Set access token for API calls
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Check if Google Calendar is available
   */
  isAvailable(): boolean {
    return !!this.accessToken && !!GOOGLE_MAPS_API_KEY;
  }

  /**
   * Get busy times from Google Calendar for a date range
   */
  async getBusyTimes(
    startDate: Date,
    endDate: Date,
    calendarId: string = 'primary'
  ): Promise<Array<{ start: string; end: string }>> {
    if (!this.accessToken) {
      throw new Error('Google Calendar access token not set');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/freeBusy?key=${GOOGLE_MAPS_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            items: [{ id: calendarId }],
          }),
        }
      );

      const data = await response.json();

      if (data.calendars && data.calendars[calendarId]) {
        return data.calendars[calendarId].busy || [];
      }

      return [];
    } catch (error) {
      console.error('Error fetching busy times:', error);
      return [];
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(event: CalendarEvent, calendarId: string = 'primary'): Promise<CalendarEvent | null> {
    if (!this.accessToken) {
      throw new Error('Google Calendar access token not set');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${GOOGLE_MAPS_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      const data = await response.json();

      if (data.id) {
        return data;
      }

      return null;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  /**
   * Sync provider availability with Google Calendar
   * Marks busy times as unavailable
   */
  async syncAvailabilityWithCalendar(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; time_slots: string[] }>> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const busyTimes = await this.getBusyTimes(startDate, endDate);

      // Convert busy times to unavailable time slots
      const unavailableSlots: Array<{ date: string; time_slots: string[] }> = [];

      busyTimes.forEach((busy) => {
        const start = new Date(busy.start);
        const end = new Date(busy.end);
        const dateStr = start.toISOString().split('T')[0];
        const startHour = start.getHours();
        const endHour = end.getHours();

        // Generate time slots that are busy
        const busySlots: string[] = [];
        for (let hour = startHour; hour < endHour; hour++) {
          busySlots.push(`${hour.toString().padStart(2, '0')}:00`);
        }

        const existing = unavailableSlots.find((s) => s.date === dateStr);
        if (existing) {
          existing.time_slots.push(...busySlots);
        } else {
          unavailableSlots.push({ date: dateStr, time_slots: busySlots });
        }
      });

      return unavailableSlots;
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
      return [];
    }
  }
}

/**
 * Request Google Calendar OAuth permission
 * This should be called when provider wants to enable calendar sync
 */
export async function requestCalendarPermission(): Promise<string | null> {
  // This would typically use Google OAuth 2.0 flow
  // For now, return null - implementation depends on OAuth setup
  // TODO: Google Calendar OAuth not yet implemented
  return null;
}

