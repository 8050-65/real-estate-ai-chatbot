import { useSession } from '@/lib/session-context';

export function useActivityLogger() {
  const { addActivity } = useSession();

  return {
    // Chat activity
    logChatMessage: (userMessage: string, assistantResponse: string) => {
      addActivity({
        type: 'chat',
        title: 'Chat Message',
        description: userMessage.substring(0, 60) + (userMessage.length > 60 ? '...' : ''),
        details: {
          'User Message': userMessage.substring(0, 100),
          'Response': assistantResponse.substring(0, 100),
        },
      });
    },

    // Lead activities
    logLeadSearch: (searchTerm: string, resultsCount: number) => {
      addActivity({
        type: 'lead_search',
        title: 'Lead Search',
        description: `Searched for leads: "${searchTerm}"`,
        details: {
          'Search Term': searchTerm,
          'Results Found': resultsCount.toString(),
        },
      });
    },

    logLeadCreate: (leadName: string, leadPhone: string) => {
      addActivity({
        type: 'lead_create',
        title: 'Lead Created',
        description: `Created new lead: ${leadName}`,
        details: {
          'Lead Name': leadName,
          'Phone': leadPhone,
        },
      });
    },

    // Property activities
    logPropertySearch: (searchTerm: string, resultsCount: number) => {
      addActivity({
        type: 'property_search',
        title: 'Property Search',
        description: `Searched for properties: "${searchTerm}"`,
        details: {
          'Search Term': searchTerm,
          'Results Found': resultsCount.toString(),
        },
      });
    },

    // Scheduling activities
    logScheduling: (leadName: string, appointmentType: string, date: string, time: string) => {
      addActivity({
        type: 'schedule',
        title: `${appointmentType} Scheduled`,
        description: `Scheduled ${appointmentType.toLowerCase()} for ${leadName}`,
        details: {
          'Lead': leadName,
          'Type': appointmentType,
          'Date': date,
          'Time': time,
        },
      });
    },

    // Status update activities
    logStatusUpdate: (leadName: string, oldStatus: string, newStatus: string) => {
      addActivity({
        type: 'status_update',
        title: 'Status Updated',
        description: `Updated ${leadName} status: ${oldStatus} → ${newStatus}`,
        details: {
          'Lead': leadName,
          'From': oldStatus,
          'To': newStatus,
        },
      });
    },

    // Theme change
    logThemeChange: (theme: 'dark' | 'light') => {
      addActivity({
        type: 'theme_change',
        title: 'Theme Changed',
        description: `Switched to ${theme === 'dark' ? '🌙 Dark' : '☀️ Light'} mode`,
        details: {
          'Theme': theme,
        },
      });
    },

    // Generic action logger
    logAction: (title: string, description: string, details?: Record<string, any>) => {
      addActivity({
        type: 'action',
        title,
        description,
        details,
      });
    },
  };
}
