'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader, Bot, User } from 'lucide-react';
import fastApiClient from '@/lib/fastapi-client';
import api from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quickReplies?: string[];
  isLoading?: boolean;
  data?: unknown;
}

interface ConversationState {
  flow: 'none' | 'create_lead' | 'update_status' | 'schedule_visit' | 'property_search' | 'project_search' | 'callback_booking' | 'meeting_booking' | 'human_handoff';
  step: string;
  data: {
    leadId?: string;
    leadName?: string;
    leadPhone?: string;
    selectedPropertyId?: string;
    selectedPropertyName?: string;
    selectedProjectId?: string;
    selectedProjectName?: string;
    statusId?: string;
    statusName?: string;
    allStatuses?: string;
    // Scheduling fields
    selectedLeadId?: string;
    selectedLeadName?: string;
    selectedLeadPhone?: string;
    appointmentType?: 'Visit' | 'Callback' | 'Meeting';
    scheduledDate?: string;
    scheduledTime?: string;
    notes?: string;
    selectedStatusId?: string;
    assignTo?: string;
    secondaryUserId?: string;
    // Status-aware scheduling fields
    currentStatusId?: string;
    currentStatusCode?: string;
    currentStatusName?: string;
    statusCategory?: string;
    targetStatusId?: string;
    targetStatusName?: string;
    meetingSubtype?: string;
    propertyOptions?: string;
    selectedPropertyCity?: string;
  };
}

// CRM Agent Intent Classification (8 intents + fallback)
const INTENT_PATTERNS = {
  project_discovery: ['project', 'projects', 'tower', 'phase', 'development', 'what projects', 'which projects', 'available projects', 'show projects'],
  unit_availability: ['property', 'properties', 'flat', 'unit', 'apartment', 'available', 'inventory', '2bhk', '3bhk', 'bhk', 'villa', 'house', 'show properties', 'what properties', 'available units'],
  pricing_inquiry: ['price', 'cost', 'budget', 'rate', 'per sqft', 'payment', 'price range', 'how much', 'what is the cost'],
  lead_creation: ['create', 'add', 'new customer', 'new inquiry', 'new lead', 'add customer', 'i am interested', 'interested'],
  status_followup: ['update', 'status', 'followed up', 'any update', 'what is status', 'check status', 'lead status', 'progress'],
  site_visit_booking: ['schedule', 'book', 'site visit', 'site see', 'tour', 'walkthrough', 'show property', 'visit property', 'schedule visit', 'book visit'],
  callback_booking: ['callback', 'call back', 'call me', 'call later', 'schedule callback', 'book callback'],
  meeting_booking: ['meeting', 'meet', 'schedule meeting', 'book meeting', 'online call', 'video call'],
  human_handoff_request: ['talk to', 'speak to', 'contact rm', 'rm', 'human', 'manager', 'agent', 'need help', 'support', 'speak with someone'],
};

function detectIntent(message: string): string {
  const lower = message.toLowerCase();

  // Priority matching: check most specific intents first
  const intentPriority = [
    'site_visit_booking', 'callback_booking', 'meeting_booking', // booking intents (most specific)
    'lead_creation', 'status_followup', // lead management
    'project_discovery', 'unit_availability', 'pricing_inquiry', // property inquiry
    'human_handoff_request', // escalation
  ];

  for (const intent of intentPriority) {
    if (INTENT_PATTERNS[intent as keyof typeof INTENT_PATTERNS].some((kw) => lower.includes(kw))) {
      return intent;
    }
  }

  return 'general_inquiry';
}

function expandShortReply(message: string): string {
  const lower = message.toLowerCase().trim();
  const shortReplies: Record<string, string> = {
    'yes': 'Yes, please proceed',
    'yep': 'Yes, please proceed',
    'yeah': 'Yes, please proceed',
    'ok': 'Okay, continue',
    'okay': 'Okay, continue',
    'sure': 'Sure, let\'s continue',
    'thanks': 'Thanks for the information',
    'thank you': 'Thanks for the information',
    'no': 'No, I don\'t need this',
    'nope': 'No, I don\'t need this',
    'maybe': 'Maybe later, I\'ll check',
    'later': 'I\'ll check this later',
    'help': 'I need help with this',
    'what': 'What are the available options',
    'how': 'How can I do this',
    'why': 'Why should I do this',
  };
  return shortReplies[lower] || message;
}

function extractSearchTerm(message: string): string {
  const stopWords = ['do', 'you', 'have', 'any', 'show', 'me', 'find', 'get', 'list', 'all', 'the', 'a', 'an', 'is', 'are', 'what', 'how', 'many', 'can', 'i', 'want', 'need', 'looking', 'for', 'about', 'tell', 'give', 'fetch'];
  return message
    .toLowerCase()
    .split(' ')
    .filter((w) => !stopWords.includes(w) && w.length > 1)
    .join(' ')
    .trim();
}

function getQuickReplies(intent: string): string[] {
  const replies: Record<string, string[]> = {
    lead: ['Show hot leads', 'Filter by status', 'Assign lead', 'Schedule follow-up'],
    property: ['Filter by BHK', 'Show price range', 'View on map', 'Schedule visit'],
    project: ['Show units', 'View amenities', 'Check RERA', 'Contact developer'],
    visit: ['Schedule visit', 'View calendar', 'Send reminder', 'Cancel appointment'],
    status: ['Site visit done', 'Meeting done', 'Callback done', 'Show all leads'],
    analytics: ['Daily report', 'Weekly summary', 'Monthly metrics', 'Export report'],
    general: ['Show leads', 'Find property', 'View projects', 'Schedule visit']
  };
  return replies[intent] || replies.general;
}

interface SearchParams {
  priceMin?: number;
  priceMax?: number;
  bhk?: string;
  status?: string;
  area?: string;
}

// Map quick replies to search parameters
const QUICK_REPLY_PARAMS: Record<string, Partial<SearchParams & { message: string }>> = {
  'Available properties': { message: 'Show me available properties' },
  'Filter by BHK': { message: 'Properties with different BHKs', bhk: 'all' },
  'Show price range': { message: 'Properties by price', priceMin: 0, priceMax: 10000000 },
  'View on map': { message: 'Properties near me on map' },
  'Schedule visit': { message: 'Schedule a property visit' },
  'Show hot leads': { message: 'Show me hot leads' },
  'Filter by status': { message: 'Filter leads by status' },
  'Assign lead': { message: 'Assign a lead to me' },
  'Schedule follow-up': { message: 'Schedule follow-up for a lead' },
  'Show units': { message: 'Show available units' },
  'View amenities': { message: 'View project amenities' },
  'Check RERA': { message: 'Check RERA status' },
  'Contact developer': { message: 'Contact the developer' },
  'View calendar': { message: 'View visit calendar' },
  'Send reminder': { message: 'Send appointment reminder' },
  'Cancel appointment': { message: 'Cancel an appointment' },
  'Site visit done': { message: 'Mark site visit as done' },
  'Meeting done': { message: 'Mark meeting as done' },
  'Callback done': { message: 'Mark callback as done' },
  'Daily report': { message: 'Show daily analytics report' },
  'Weekly summary': { message: 'Show weekly summary' },
  'Monthly metrics': { message: 'Show monthly metrics' },
  'Export report': { message: 'Export analytics report' },
  'Show leads': { message: 'Show all leads' },
  'Show all leads': { message: 'Show all leads' },
  'Find property': { message: 'Find properties' },
  'View projects': { message: 'View all projects' },
  'Update Another Lead': { message: 'Update another lead status' },
  'Show All Leads': { message: 'Show all leads' },
  'Schedule Site Visit': { message: 'Schedule a site visit' },
  'View All Leads': { message: 'Show all leads' },
  'Create Another Lead': { message: 'Create a new lead' },
  'Schedule Another': { message: 'Schedule another appointment' },
  'Create Lead': { message: 'Create a new lead' },
};

// Status ID constants for child status mapping
const CHILD_STATUS_IDS: Record<string, string> = {
  callback_to_schedule_meeting: 'f6f2683f-526f-42cd-a1b6-dd132e9e0f16',
  callback_to_schedule_site_visit: '171598ed-a0f8-41ec-aa35-d032a011118d',
  callback_follow_up: '414ff141-9fe4-4c86-a0bb-6cc82f120d71',
  callback_busy: 'dc2918b0-cfdd-4226-b5b3-fc5d3f464174',
  callback_not_answered: '1d8b4e6e-bfe4-42bc-bdae-c3e9beccac77',
  callback_not_reachable: '0a7f674c-0436-4a94-ac43-b833750555a9',
  meeting_online: '68282b95-bf5e-4f87-b940-749f667abc25',
  meeting_on_call: 'ac169743-07a8-485b-9b01-89818a2654d6',
  meeting_others: 'fb3f3e48-c397-40d5-ab01-dbfcd110ade5',
  meeting_in_person: 'd465463a-cfb8-413f-b1f3-46430c01f2bd',
  site_visit_first_visit: '7f3fceff-5858-4ca0-aff1-7be24b7500be',
  site_visit_revisit: '62609802-1df7-41b0-856f-4afb490c1590',
};

const PARENT_STATUS_IDS: Record<string, string> = {
  callback: '54bd52ee-914f-4a78-b919-cd99be9dee88',
  meeting: '1c204d66-0f0e-4718-af99-563dad02a39b',
  site_visit: 'ba8fbec4-9322-438f-a745-5dfae2ee078d',
};

// Valid status mappings for done/not done actions (ONLY these are safe)
const STATUS_COMPLETION_MAPPING: Record<string, { done?: string; notDone?: string }> = {
  'meeting': {
    done: 'meeting_done',
    notDone: 'meeting_not_done'
  },
  'site_visit': {
    done: 'site_visit_done',
    notDone: 'site_visit_not_done'
  }
};

function getStatusCategory(code: string): 'fresh' | 'callback' | 'meeting' | 'site_visit' | 'closed' {
  const c = (code || '').toLowerCase();
  if (!c || ['new', 'pending', 'expression_of_interest', 'eoi', 'fresh'].some(k => c.includes(k))) return 'fresh';
  if (['meeting_scheduled', 'online', 'on_call', 'in_person', 'others'].some(k => c.includes(k))) return 'meeting';
  if (['site_visit_scheduled', 'first_visit', 'revisit'].some(k => c.includes(k))) return 'site_visit';
  if (['callback', 'follow_up', 'to_schedule', 'not_answered', 'not_reachable', 'busy'].some(k => c.includes(k))) return 'callback';
  if (['booked', 'not_interested', 'dropped', 'closed', 'lost'].some(k => c.includes(k))) return 'closed';
  return 'fresh';
}

function getStatusAwareOptions(category: string, statusName: string): { message: string; buttons: string[] } {
  switch (category) {
    case 'fresh':
      return {
        message: `What would you like to schedule?`,
        buttons: ['🏢 Schedule Site Visit', '📞 Schedule Callback', '🤝 Schedule Meeting', '❌ Cancel'],
      };
    case 'callback':
      return {
        message: `Lead is currently **${statusName}**. What would you like to do?`,
        buttons: ['🏢 Schedule Site Visit', '🤝 Schedule Meeting', '🔄 Follow Up', '📵 Not Answered', '📴 Not Reachable', '❌ Cancel'],
      };
    case 'meeting':
      // For leads with meeting already scheduled - only show done/not done
      return {
        message: `Lead has **${statusName}** scheduled. What happened?`,
        buttons: ['✅ Done', '❌ Not Done', '🔄 Reschedule', '❌ Cancel'],
      };
    case 'site_visit':
      // For leads with site visit already scheduled - only show done/not done
      return {
        message: `Lead has **${statusName}** scheduled. What happened?`,
        buttons: ['✅ Done', '❌ Not Done', '🔄 Reschedule', '❌ Cancel'],
      };
    case 'closed':
      return {
        message: `Lead status is **${statusName}**. This lead cannot be updated.`,
        buttons: ['🏠 Back to Main', '❌ Cancel'],
      };
    default:
      return {
        message: `What would you like to do?`,
        buttons: ['🏢 Schedule Site Visit', '📞 Schedule Callback', '🤝 Schedule Meeting', '❌ Cancel'],
      };
  }
}

async function searchPropertiesApi(query: string): Promise<any[]> {
  try {
    const res = await api.get(`/leads/properties?search=${encodeURIComponent(query)}`);
    return res.data?.data || [];
  } catch {
    return [];
  }
}

async function callLeadratAPI(intent: string, searchTerm: string, originalMessage: string, conversationHistory: Message[] = []): Promise<{ content: string; quickReplies: string[] }> {
  const tenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenantId') || null) : null;

  console.log('[ChatInterface] Processing message:', originalMessage.substring(0, 50) + '...');

  try {
    const historyContext = conversationHistory
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-3)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content.substring(0, 200)
      }));

    // Send to backend - DO NOT pass intent, let backend detect it
    // Only pass tenant_id if explicitly set, otherwise backend uses .env default
    const requestPayload: any = {
      message: originalMessage,
      conversation_history: historyContext
    };

    if (tenantId) {
      requestPayload.tenant_id = tenantId;
    }

    const response = await fastApiClient.post('api/v1/chat/message', requestPayload);

    const routerResponse = response.data?.response || response.data?.content || '';
    const detectedIntent = response.data?.intent || intent || 'general';
    const source = response.data?.source || 'Service';

    if (!routerResponse) {
      return {
        content: 'Unable to generate response. Please try again.',
        quickReplies: ['Try again', 'Help']
      };
    }

    let quickReplies = getQuickReplies(detectedIntent);

    // Add "Interested" buttons for property responses
    if (detectedIntent === 'property' && routerResponse) {
      // Extract property names from response or add generic interested buttons
      const propertyNames = ['3BHK Apartment', '2BHK Villa', 'Luxury Penthouse'];
      const interestedButtons = propertyNames.map(p => `Interested: ${p}`);
      quickReplies = interestedButtons.concat(['Show more', 'Filter by BHK']);
    }

    // Add "Interested" buttons for project responses
    if (detectedIntent === 'project' && routerResponse) {
      const projectNames = ['Tower A', 'Phase 2 Development', 'Premium Complex'];
      const interestedButtons = projectNames.map(p => `Interested: ${p}`);
      quickReplies = interestedButtons.concat(['Show more', 'View amenities']);
    }

    console.log('[ChatInterface] Routed to:', source, '| Intent:', detectedIntent);

    return {
      content: routerResponse,
      quickReplies: quickReplies
    };
  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Unknown error';

    console.error('[API Error]', {
      status,
      url: error.config?.url,
      message,
    });

    let friendlyMessage = 'Sorry, I encountered an error. ';

    if (status === 401) {
      friendlyMessage += 'Your session has expired. Please refresh and login again.';
    } else if (status === 403) {
      friendlyMessage += 'You do not have permission to access this data.';
    } else if (status === 404) {
      friendlyMessage += `The ${intent} API endpoint is not available.`;
    } else if (status === 500) {
      friendlyMessage += 'The server encountered an error. Please try again in a moment.';
    } else {
      friendlyMessage += 'Unable to fetch data right now. Please check your connection.';
    }

    return {
      content: friendlyMessage,
      quickReplies: ['Try again', 'Help'],
    };
  }
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `Hello! I'm your AI Real Estate Assistant. 🏠\n\nI can help you with:\n• 👥 Finding and managing leads\n• 🏠 Searching property inventory\n• 📋 Projects and availability\n• 📅 Scheduling visits and meetings\n• 📊 Sales analytics and reports\n\nWhat would you like to know?`,
  timestamp: new Date(),
  quickReplies: ["Show today's leads", 'Available properties', 'Upcoming visits', 'Sales summary'],
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [convState, setConvState] = useState<ConversationState>({
    flow: 'none',
    step: '',
    data: {},
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageCounterRef = useRef<number>(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function appendBotMessage(content: string, quickReplies: string[] = []) {
    messageCounterRef.current += 1;
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}-${messageCounterRef.current}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      quickReplies
    }]);
  }

  async function handleLeadCreationFlow(text: string) {
    const { step, data } = convState;

    if (text === '❌ Cancel') {
      setConvState({ flow: 'none', step: '', data: {} });
      appendBotMessage('Enquiry cancelled. How else can I help?',
        ['Show leads', 'Show properties', 'Show projects']);
      return;
    }

    switch(step) {
      case 'get_name':
        setConvState(prev => ({
          ...prev, step: 'get_phone',
          data: { ...prev.data, leadName: text }
        }));
        appendBotMessage(
          `Thanks **${text}**! 📞 What is the phone number?`,
          ['❌ Cancel']
        );
        break;

      case 'get_phone': {
        const phone = text.replace(/\D/g, '');
        if (phone.length < 10) {
          appendBotMessage('Please enter a valid 10-digit phone number.', ['❌ Cancel']);
          return;
        }
        setConvState(prev => ({
          ...prev, step: 'confirm',
          data: { ...prev.data, leadPhone: phone }
        }));
        appendBotMessage(
          `Please confirm the enquiry details:\n\n` +
          `👤 **Name:** ${data.leadName}\n` +
          `📞 **Phone:** ${phone}\n` +
          `🏠 **Property/Project:** ${data.selectedPropertyName ?? data.selectedProjectName}\n\n` +
          `Shall I create this lead in Leadrat CRM?`,
          ['✅ Confirm & Create Lead', '❌ Cancel']
        );
        break;
      }

      case 'confirm':
        if (text === '✅ Confirm & Create Lead') {
          appendBotMessage('Creating lead in Leadrat CRM...', []);
          try {
            const response = await api.post('/leads', {
              name: data.leadName,
              contactNo: data.leadPhone,
              alternateContactNo: '',
              projectInterest: data.selectedProjectName ?? data.selectedPropertyName,
              source: 'AI Assistant'
            });
            const lead = response.data?.data;
            // Store the created lead details for quick appointment scheduling
            setConvState({
              flow: 'none',
              step: '',
              data: {
                leadId: lead?.id,
                leadName: data.leadName,
                leadPhone: data.leadPhone
              }
            });
            appendBotMessage(
              `✅ **Lead Created Successfully!**\n\n` +
              `👤 ${data.leadName} has been added to Leadrat CRM.\n` +
              `📞 Phone: ${data.leadPhone}\n` +
              `🏠 Interest: ${data.selectedPropertyName ?? data.selectedProjectName}`,
              ['Schedule Site Visit', 'View All Leads', 'Create Another Lead']
            );
          } catch (error: any) {
            const status = error.response?.status;
            const errorMsg = error.response?.data?.message || error.message || 'Unknown error';

            console.error('[ChatInterface] Lead creation failed:', { status, errorMsg });

            if (status === 403 || status === 401) {
              appendBotMessage(
                '⚠️ Authentication expired. Please log in again.\n\n' +
                `Error: ${status === 403 ? 'Access Denied' : 'Unauthorized'}\n\n` +
                'Go to Login page and try again.',
                ['Try Again', 'Show Leads']
              );
            } else {
              appendBotMessage(
                `❌ Failed to create lead.\n\n` +
                `Error: ${errorMsg}\n\n` +
                'Please try again or add manually in Leadrat.',
                ['Try Again', 'Show Leads']
              );
            }
          }
        }
        break;
    }
  }

  async function handleStatusUpdateFlow(text: string) {
    const { step, data } = convState;

    if (text === '❌ Cancel') {
      setConvState({ flow: 'none', step: '', data: {} });
      appendBotMessage('Status update cancelled.',
        ['Show leads', 'Show activities']);
      return;
    }

    switch(step) {
      case 'get_lead': {
        appendBotMessage('Searching for lead...', []);
        try {
          const res = await api.get('/leads', {
            params: { search: text, page: 0, size: 5 }
          });
          const leads = res.data?.data?.content || [];
          if (!leads.length) {
            appendBotMessage(
              `No leads found for "${text}". Try a different name or phone.`,
              ['Try Again', '❌ Cancel']
            );
            return;
          }
          setConvState(prev => ({ ...prev, step: 'select_lead' }));
          appendBotMessage(
            `Found ${leads.length} lead(s). Select one to update:`,
            leads.slice(0, 5).map((l: any) =>
              `Select: ${l.name ?? 'Unknown'} - ${l.phoneNumber ?? l.contactNo ?? ''}`
            ).concat(['❌ Cancel'])
          );
          sessionStorage.setItem('chatbot_leads', JSON.stringify(leads));
        } catch {
          appendBotMessage('Failed to search leads.', ['Try Again', '❌ Cancel']);
        }
        break;
      }

      case 'select_lead': {
        if (!text.startsWith('Select:')) return;
        const leadInfo = text.replace('Select:', '').trim();
        const storedLeads = JSON.parse(
          sessionStorage.getItem('chatbot_leads') ?? '[]'
        );
        const selectedLead = storedLeads.find((l: any) =>
          `${l.name ?? ''} - ${l.phoneNumber ?? l.contactNo ?? ''}`.includes(leadInfo.split(' - ')[0].trim())
        );

        if (!selectedLead) {
          appendBotMessage('Could not find selected lead.', ['❌ Cancel']);
          return;
        }

        setConvState(prev => ({
          ...prev,
          step: 'select_activity',
          data: {
            ...prev.data,
            leadId: selectedLead.id,
            leadName: selectedLead.name
          }
        }));

        appendBotMessage(
          `Lead: **${selectedLead.name}**\n\nWhat activity do you want to update?`,
          [
            '✅ Site Visit Done',
            '❌ Site Visit Not Done',
            '✅ Meeting Done',
            '❌ Meeting Not Done',
            '✅ Callback Done',
            '❌ Callback Not Done',
            '❌ Cancel'
          ]
        );
        break;
      }

      case 'select_activity': {
        try {
          const statusRes = await api.get('/leads/statuses');
          const statuses = statusRes.data?.data ?? [];

          if (!statuses.length) {
            appendBotMessage('No statuses available. Please try again.', ['Try Again', '❌ Cancel']);
            return;
          }

          const activityMap: Record<string, string[]> = {
            '✅ Site Visit Done': ['visit', 'visited', 'done'],
            '❌ Site Visit Not Done': ['visit', 'not', 'missed', 'no show'],
            '✅ Meeting Done': ['meeting', 'done'],
            '❌ Meeting Not Done': ['meeting', 'not', 'missed'],
            '✅ Callback Done': ['callback', 'done'],
            '❌ Callback Not Done': ['callback', 'not', 'missed'],
          };

          const keywords = activityMap[text] ?? [];
          let matchedStatus = null;

          if (keywords.length > 0) {
            matchedStatus = statuses.find((s: any) => {
              const statusName = s.name?.toLowerCase() || '';
              return keywords.some(kw => statusName.includes(kw.toLowerCase()));
            });
          }

          if (!matchedStatus) {
            appendBotMessage(
              `Please select a status for this activity:`,
              statuses.slice(0, 8).map((s: any) =>
                `Status: ${s.name}`
              ).concat(['❌ Cancel'])
            );
            setConvState(prev => ({
              ...prev,
              step: 'select_status',
              data: { ...prev.data, allStatuses: JSON.stringify(statuses) }
            }));
            return;
          }

          setConvState(prev => ({
            ...prev,
            step: 'confirm_status',
            data: {
              ...prev.data,
              statusId: matchedStatus.id,
              statusName: matchedStatus.name
            }
          }));

          appendBotMessage(
            `Confirm status update:\n\n` +
            `👤 **Lead:** ${data.leadName}\n` +
            `📋 **New Status:** ${matchedStatus.name}\n\n` +
            `This will update the lead in Leadrat CRM.`,
            ['✅ Update Status', '❌ Cancel']
          );
        } catch {
          appendBotMessage(
            'Failed to fetch lead statuses from Leadrat.',
            ['Try Again', '❌ Cancel']
          );
        }
        break;
      }

      case 'select_status': {
        if (!text.startsWith('Status:')) return;
        const statusName = text.replace('Status:', '').trim();
        const storedStatuses = JSON.parse(
          data.allStatuses ?? '[]'
        );
        const selectedStatus = storedStatuses.find((s: any) =>
          s.name === statusName
        );

        if (!selectedStatus) {
          appendBotMessage('Could not find selected status.', ['Try Again', '❌ Cancel']);
          return;
        }

        setConvState(prev => ({
          ...prev,
          step: 'confirm_status',
          data: {
            ...prev.data,
            statusId: selectedStatus.id,
            statusName: selectedStatus.name
          }
        }));

        appendBotMessage(
          `Confirm status update:\n\n` +
          `👤 **Lead:** ${data.leadName}\n` +
          `📋 **New Status:** ${selectedStatus.name}\n\n` +
          `This will update the lead in Leadrat CRM.`,
          ['✅ Update Status', '❌ Cancel']
        );
        break;
      }

      case 'confirm_status': {
        if (text !== '✅ Update Status') return;
        appendBotMessage('Updating lead status in Leadrat...', []);
        try {
          await api.put(`/leads/${data.leadId}/status`, {
            leadStatusId: data.statusId
          });
          setConvState({ flow: 'none', step: '', data: {} });
          appendBotMessage(
            `✅ **Status Updated Successfully!**\n\n` +
            `👤 Lead: ${data.leadName}\n` +
            `📋 New Status: ${data.statusName}\n` +
            `✓ Updated in Leadrat CRM`,
            ['Update Another Lead', 'Show All Leads', 'Schedule Visit']
          );
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to update status';
          appendBotMessage(
            `❌ ${errorMsg}\n\nPlease try again or contact support.`,
            ['Try Again', '❌ Cancel']
          );
        }
        break;
      }
    }
  }

  async function handleScheduleFlow(text: string) {
    const { step, data } = convState;

    if (text === '❌ Cancel') {
      setConvState({ flow: 'none', step: '', data: {} });
      appendBotMessage('Appointment scheduling cancelled. How else can I help?',
        ['Show leads', 'Schedule visit', 'Create lead']);
      return;
    }

    switch(step) {
      case 'get_lead': {
        appendBotMessage('Searching for lead...', []);
        try {
          const res = await api.get('/leads', {
            params: { search: text, page: 0, size: 10 }
          });
          const leads = res.data?.data?.content || [];
          if (!leads.length) {
            appendBotMessage(
              `No leads found for "${text}". Try a different name or phone.`,
              ['Try Again', '❌ Cancel']
            );
            return;
          }
          setConvState(prev => ({ ...prev, step: 'select_lead' }));
          appendBotMessage(
            `Found ${leads.length} lead(s). Select one:`,
            leads.slice(0, 5).map((l: any) =>
              `Select: ${l.name ?? 'Unknown'} - ${l.phoneNumber ?? l.contactNo ?? ''}`
            ).concat(['❌ Cancel'])
          );
          sessionStorage.setItem('schedule_leads', JSON.stringify(leads));
        } catch {
          appendBotMessage('Failed to search leads.', ['Try Again', '❌ Cancel']);
        }
        break;
      }

      case 'select_lead': {
        const leads = JSON.parse(sessionStorage.getItem('schedule_leads') || '[]');
        const selected = leads.find((l: any) =>
          text.includes(l.name) || text.includes(l.phoneNumber) || text.includes(l.contactNo)
        );

        if (!selected) {
          appendBotMessage('Could not find that lead. Please try again.', ['❌ Cancel']);
          return;
        }

        appendBotMessage(`Checking status for **${selected.name}**...`, []);

        try {
          const res = await api.get(`/leads/${selected.id}`);
          const lead = res.data?.data || res.data;
          const statusCode = lead?.statusCode || '';
          const statusName = lead?.status || 'New Lead';
          const statusId = lead?.statusId || '';
          const category = getStatusCategory(statusCode);
          const { message, buttons } = getStatusAwareOptions(category, statusName);

          setConvState(prev => ({
            ...prev,
            step: 'status_aware_action',
            data: {
              ...prev.data,
              selectedLeadId: selected.id,
              selectedLeadName: selected.name,
              selectedLeadPhone: selected.phoneNumber || selected.contactNo,
              assignTo: lead?.assignTo || '45abfce5-2746-42e6-bf66-ac7e00e75085',
              secondaryUserId: lead?.secondaryUserId || '00000000-0000-0000-0000-000000000000',
              currentStatusId: statusId,
              currentStatusCode: statusCode,
              currentStatusName: statusName,
              statusCategory: category,
            }
          }));
          appendBotMessage(
            `👤 **${selected.name}** (${selected.phoneNumber || selected.contactNo})\n\n${message}`,
            buttons
          );
        } catch {
          setConvState(prev => ({
            ...prev,
            step: 'status_aware_action',
            data: {
              ...prev.data,
              selectedLeadId: selected.id,
              selectedLeadName: selected.name,
              selectedLeadPhone: selected.phoneNumber || selected.contactNo,
              statusCategory: 'fresh',
            }
          }));
          appendBotMessage(
            `👤 **${selected.name}**\n\nWhat would you like to schedule?`,
            ['🏢 Schedule Site Visit', '📞 Schedule Callback', '🤝 Schedule Meeting', '❌ Cancel']
          );
        }
        break;
      }

      case 'status_aware_action': {
        const { statusCategory } = data;

        if (text.includes('Cancel')) {
          setConvState({ flow: 'none', step: '', data: {} });
          appendBotMessage('No problem! Let me know if you need anything else.', []);
          return;
        }

        // Scheduling actions
        if (text.includes('Schedule Site Visit')) {
          setConvState(prev => ({ ...prev, step: 'search_property', data: { ...prev.data, appointmentType: 'Visit' } }));
          appendBotMessage('Which property would you like to schedule a site visit for? Please enter property name or location.', []);
          return;
        }
        if (text.includes('Schedule Callback')) {
          setConvState(prev => ({ ...prev, step: 'select_date', data: { ...prev.data, appointmentType: 'Callback' } }));
          appendBotMessage('When would you like to schedule the callback?', ['📅 Today', '📅 Tomorrow', '🗓️ Pick date']);
          return;
        }
        if (text.includes('Schedule Meeting') || text.includes('Reschedule Meeting')) {
          setConvState(prev => ({ ...prev, step: 'select_meeting_subtype', data: { ...prev.data, appointmentType: 'Meeting' } }));
          appendBotMessage('What type of meeting?', ['💻 Online', '🏢 In Person', '📞 On Call', '🔄 Others']);
          return;
        }
        if (text.includes('Reschedule Site Visit')) {
          setConvState(prev => ({ ...prev, step: 'search_property', data: { ...prev.data, appointmentType: 'Visit' } }));
          appendBotMessage('Which property would you like to reschedule for?', []);
          return;
        }
        if (text.includes('Revisit')) {
          setConvState(prev => ({
            ...prev, step: 'search_property',
            data: { ...prev.data, appointmentType: 'Visit', targetStatusId: CHILD_STATUS_IDS.site_visit_revisit, targetStatusName: 'Revisit' }
          }));
          appendBotMessage('Which property for the revisit?', []);
          return;
        }

        // Direct status updates (no date needed)
        if (text.includes('Follow Up')) {
          setConvState(prev => ({ ...prev, step: 'confirm_direct_status',
            data: { ...prev.data, targetStatusId: CHILD_STATUS_IDS.callback_follow_up, targetStatusName: 'Follow Up' }
          }));
          appendBotMessage(`Confirm: Set **${data.selectedLeadName}** to Follow Up?`, ['✅ Confirm Update', '❌ Cancel']);
          return;
        }
        if (text.includes('Not Answered')) {
          setConvState(prev => ({ ...prev, step: 'confirm_direct_status',
            data: { ...prev.data, targetStatusId: CHILD_STATUS_IDS.callback_not_answered, targetStatusName: 'Not Answered' }
          }));
          appendBotMessage(`Confirm: Set **${data.selectedLeadName}** to Not Answered?`, ['✅ Confirm Update', '❌ Cancel']);
          return;
        }
        if (text.includes('Not Reachable')) {
          setConvState(prev => ({ ...prev, step: 'confirm_direct_status',
            data: { ...prev.data, targetStatusId: CHILD_STATUS_IDS.callback_not_reachable, targetStatusName: 'Not Reachable' }
          }));
          appendBotMessage(`Confirm: Set **${data.selectedLeadName}** to Not Reachable?`, ['✅ Confirm Update', '❌ Cancel']);
          return;
        }

        // Done / Not Done actions for meetings and site visits
        const isDoneAction = text.includes('✅ Done') || text.includes('❌ Not Done');
        if (isDoneAction && (data.statusCategory === 'meeting' || data.statusCategory === 'site_visit')) {
          appendBotMessage('Searching for matching status in Leadrat...', []);
          try {
            const res = await api.get('/leads/statuses');
            const statuses: any[] = res.data?.data || [];

            // Determine search keywords based on status category and action
            const isDone = text.includes('✅ Done');
            let keywords: string[] = [];

            if (data.statusCategory === 'meeting') {
              keywords = isDone
                ? ['meeting done', 'completed', 'confirmed', 'scheduled done']
                : ['meeting not done', 'no show', 'missed', 'not attended', 'cancelled'];
            } else if (data.statusCategory === 'site_visit') {
              keywords = isDone
                ? ['visit done', 'visited', 'completed', 'site visit completed']
                : ['not visited', 'not done', 'missed', 'cancelled'];
            }

            const matched = statuses.find(s =>
              keywords.some(kw => s.name?.toLowerCase().includes(kw) || s.status?.toLowerCase().includes(kw))
            );

            if (matched) {
              console.log('[ChatInterface] Matched completion status:', matched);
              setConvState(prev => ({ ...prev, step: 'confirm_direct_status',
                data: { ...prev.data, targetStatusId: matched.id, targetStatusName: matched.name }
              }));
              appendBotMessage(`Confirm: Set **${data.selectedLeadName}** to **${matched.name}**?`, ['✅ Confirm Update', '❌ Cancel']);
            } else {
              // ERROR: No completion status found - show error and safe options
              const actionText = isDone ? 'Done' : 'Not Done';
              const statusType = data.statusCategory === 'meeting' ? 'Meeting' : 'Site Visit';
              const rescheduleOption = data.statusCategory === 'meeting' ? '🔄 Reschedule Meeting' : '🔄 Reschedule Site Visit';

              appendBotMessage(
                `⚠️ **Status Not Configured**\n\n"${statusType} ${actionText}" status is not configured in Leadrat for this tenant.\n\nPlease choose another action:`,
                [rescheduleOption, '🏠 Back to Main', '❌ Cancel']
              );
              // Stay in same step to allow user to choose alternative action
            }
          } catch {
            appendBotMessage('Could not fetch statuses. Please try again.', ['❌ Cancel']);
          }
          return;
        }

        // Fallback options from error states
        if (text.includes('Reschedule Meeting')) {
          setConvState(prev => ({ ...prev, step: 'select_meeting_subtype', data: { ...prev.data, appointmentType: 'Meeting' } }));
          appendBotMessage('What type of meeting?', ['💻 Online', '🏢 In Person', '📞 On Call', '🔄 Others']);
          return;
        }
        if (text.includes('Reschedule Site Visit')) {
          setConvState(prev => ({ ...prev, step: 'search_property', data: { ...prev.data, appointmentType: 'Visit' } }));
          appendBotMessage('Which property would you like to reschedule for?', []);
          return;
        }
        if (text.includes('Back to Main')) {
          setConvState({ flow: 'none', step: '', data: {} });
          appendBotMessage('Back to main menu. What would you like to do?', ['🏠 Schedule Site Visit', '📞 Schedule Callback', '🤝 Schedule Meeting', '📊 View Leads']);
          return;
        }

        break;
      }

      case 'select_type': {
        let appointmentType: 'Visit' | 'Callback' | 'Meeting' | '' = '';
        if (text.includes('Site Visit')) appointmentType = 'Visit';
        else if (text.includes('Callback')) appointmentType = 'Callback';
        else if (text.includes('Meeting')) appointmentType = 'Meeting';

        if (!appointmentType) {
          appendBotMessage('Please select a valid appointment type.', ['🏢 Site Visit', '📞 Callback', '🤝 Meeting']);
          return;
        }

        setConvState(prev => ({
          ...prev,
          step: 'select_date',
          data: { ...prev.data, appointmentType: appointmentType as 'Visit' | 'Callback' | 'Meeting' }
        }));
        appendBotMessage(
          `Perfect! ${appointmentType} scheduled. 📅\n\nWhen would you like to schedule this?`,
          ['📅 Today', '📅 Tomorrow', '🗓️ Pick date']
        );
        break;
      }

      case 'select_meeting_subtype': {
        let subtypeId = CHILD_STATUS_IDS.meeting_in_person;
        let subtypeName = 'In Person';
        if (text.toLowerCase().includes('online')) { subtypeId = CHILD_STATUS_IDS.meeting_online; subtypeName = 'Online'; }
        else if (text.toLowerCase().includes('on call') || text.toLowerCase().includes('phone')) { subtypeId = CHILD_STATUS_IDS.meeting_on_call; subtypeName = 'On Call'; }
        else if (text.toLowerCase().includes('others')) { subtypeId = CHILD_STATUS_IDS.meeting_others; subtypeName = 'Others'; }

        setConvState(prev => ({
          ...prev, step: 'select_date',
          data: { ...prev.data, targetStatusId: subtypeId, targetStatusName: subtypeName }
        }));
        appendBotMessage('When would you like to schedule the meeting?', ['📅 Today', '📅 Tomorrow', '🗓️ Pick date']);
        break;
      }

      case 'search_property': {
        appendBotMessage('Searching for properties...', []);
        try {
          const properties = await searchPropertiesApi(text);
          if (properties.length > 0) {
            const buttons = properties.slice(0, 5).map((p: any) => `Property: ${p.name} - ${p.city}`);
            setConvState(prev => ({
              ...prev,
              step: 'select_property',
              data: { ...prev.data, propertyOptions: JSON.stringify(properties) }
            }));
            appendBotMessage('Which property would you like to select?', buttons);
          } else {
            appendBotMessage('No properties found. Please try a different search.', []);
          }
        } catch {
          appendBotMessage('Could not search properties. Please try again.', []);
        }
        break;
      }

      case 'select_property': {
        const properties = JSON.parse(data.propertyOptions || '[]');
        const selected = properties.find((p: any) =>
          text.toLowerCase().includes(p.name.toLowerCase()) || text.toLowerCase().includes(p.city.toLowerCase())
        );

        if (!selected) {
          appendBotMessage('Please select a valid property.', properties.slice(0, 5).map((p: any) => `Property: ${p.name} - ${p.city}`));
          return;
        }

        setConvState(prev => ({
          ...prev,
          step: 'select_date',
          data: {
            ...prev.data,
            selectedPropertyId: selected.id,
            selectedPropertyName: selected.name,
            selectedPropertyCity: selected.city
          }
        }));
        appendBotMessage(
          `📍 **${selected.name}**, ${selected.city}\n\nWhen would you like to schedule the site visit?`,
          ['📅 Today', '📅 Tomorrow', '🗓️ Pick date']
        );
        break;
      }

      case 'select_date': {
        let scheduledDate = '';
        const today = new Date();

        if (text.includes('Today')) {
          scheduledDate = today.toISOString().split('T')[0];
        } else if (text.includes('Tomorrow')) {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          scheduledDate = tomorrow.toISOString().split('T')[0];
        } else if (text.match(/\d{4}-\d{2}-\d{2}/)) {
          scheduledDate = text.match(/\d{4}-\d{2}-\d{2}/)![0];
        } else {
          appendBotMessage('Please select a date or enter in YYYY-MM-DD format.', ['📅 Today', '📅 Tomorrow', '🗓️ Pick date']);
          return;
        }

        setConvState(prev => ({
          ...prev,
          step: 'select_time',
          data: { ...prev.data, scheduledDate }
        }));
        appendBotMessage(
          `Date: ${scheduledDate}\n\nWhat time would you prefer?`,
          ['🕙 10:00 AM', '🕛 12:00 PM', '🕒 3:00 PM', '🕔 5:00 PM', '⏰ Custom']
        );
        break;
      }

      case 'select_time': {
        let scheduledTime = '';
        if (text.includes('10:00')) scheduledTime = '10:00';
        else if (text.includes('12:00')) scheduledTime = '12:00';
        else if (text.includes('3:00') || text.includes('15:00')) scheduledTime = '15:00';
        else if (text.includes('5:00') || text.includes('17:00')) scheduledTime = '17:00';
        else if (text.match(/\d{1,2}:\d{2}/)) {
          scheduledTime = text.match(/\d{1,2}:\d{2}/)![0];
        } else {
          appendBotMessage('Please select a time or enter in HH:MM format.', ['🕙 10:00 AM', '🕛 12:00 PM', '🕒 3:00 PM', '🕔 5:00 PM']);
          return;
        }

        setConvState(prev => ({
          ...prev,
          step: 'get_notes',
          data: { ...prev.data, scheduledTime }
        }));
        appendBotMessage(
          `Time: ${scheduledTime}\n\nAny special notes or customer requirements?`,
          ['✏️ Add Note', '⏭️ Skip']
        );
        break;
      }

      case 'get_notes': {
        let notes = '';
        if (!text.includes('Skip')) {
          notes = text.replace(/^✏️\s*Add Note:\s*/i, '').trim();
        }

        setConvState(prev => ({
          ...prev,
          step: 'confirm',
          data: { ...prev.data, notes }
        }));

        const { selectedLeadName, selectedLeadPhone, appointmentType, scheduledDate, scheduledTime } = data;
        appendBotMessage(
          `📋 **Confirm Appointment**\n\n` +
          `👤 **Lead:** ${selectedLeadName}\n` +
          `📞 **Phone:** ${selectedLeadPhone}\n` +
          `📅 **Type:** ${appointmentType}\n` +
          `📅 **Date:** ${scheduledDate}\n` +
          `🕐 **Time:** ${scheduledTime}\n` +
          (notes ? `📝 **Notes:** ${notes}\n` : '') +
          `\nThis will update the lead status in Leadrat CRM.`,
          ['✅ Confirm Schedule', '❌ Cancel']
        );
        break;
      }

      case 'select_manual_status': {
        if (text.startsWith('Status: ')) {
          const statusName = text.replace('Status: ', '');
          const statuses = JSON.parse(data.allStatuses || '[]');
          const matched = statuses.find((s: any) => s.name === statusName);
          if (matched) {
            setConvState(prev => ({ ...prev, step: 'confirm_direct_status',
              data: { ...prev.data, targetStatusId: matched.id, targetStatusName: matched.name }
            }));
            appendBotMessage(`Confirm: Set **${data.selectedLeadName}** to **${statusName}**?`, ['✅ Confirm Update', '❌ Cancel']);
          }
        }
        break;
      }

      case 'confirm_direct_status': {
        if (text.includes('Cancel')) {
          setConvState({ flow: 'none', step: '', data: {} });
          appendBotMessage('Cancelled.', []);
          return;
        }
        if (!text.includes('Confirm Update')) return;

        const { selectedLeadId, selectedLeadName, currentStatusName, targetStatusId, targetStatusName, assignTo, secondaryUserId } = data;
        appendBotMessage('Updating status in Leadrat CRM...', []);
        try {
          const payload = {
            id: selectedLeadId,
            leadStatusId: targetStatusId,
            rating: null,
            notes: null,
            IsNotesUpdated: false,
            bookedUnderName: null,
            agreementValue: null,
            purchasedFrom: null,
            propertiesList: [],
            projectsList: [],
            projectIds: null,
            unitTypeId: null,
            propertyIds: null,
            currency: 'INR',
            buyer: null,
            paymentPlans: null,
            lowerBudget: null,
            upperBudget: null,
            purpose: null,
            addresses: [],
            assignTo: assignTo || '45abfce5-2746-42e6-bf66-ac7e00e75085',
            secondaryUserId: secondaryUserId || '00000000-0000-0000-0000-000000000000',
            scheduledDate: null,
            meetingOrSiteVisit: null,
          };

          // Log status update for debugging
          console.log('[STATUS_UPDATE_PAYLOAD]', {
            leadId: selectedLeadId,
            leadName: selectedLeadName,
            currentStatus: currentStatusName,
            selectedAction: targetStatusName,
            selectedStatusId: targetStatusId,
            payload: payload
          });

          const res = await api.put(`/leads/${selectedLeadId}/status`, payload);
          if (res.data?.success === false) {
            throw new Error(res.data?.message || 'Update failed');
          }
          setConvState({ flow: 'none', step: '', data: {} });
          appendBotMessage(
            `✅ **Status Updated Successfully!**\n\n👤 **Lead:** ${selectedLeadName}\n📋 **New Status:** ${targetStatusName}\n✓ Updated in Leadrat CRM`,
            ['Schedule Another', 'Show All Leads', 'Create Lead']
          );
        } catch (error: any) {
          console.error('[ChatInterface] Status update failed:', error);
          setConvState({ flow: 'none', step: '', data: {} });
          appendBotMessage(
            `❌ **Unable to update Leadrat status**\n\n${error.message || 'An error occurred while updating the lead status.'}\n\nPlease try another action:`,
            ['🏠 Back to Main Menu', '❌ Cancel']
          );
        }
        break;
      }

      case 'confirm': {
        if (!text.includes('Confirm Schedule')) return;

        setConvState(prev => ({ ...prev, step: 'updating' }));
        appendBotMessage('Scheduling appointment in Leadrat CRM...', []);

        try {
          const { selectedLeadId, appointmentType, scheduledDate, scheduledTime, notes, targetStatusId, assignTo, secondaryUserId, selectedPropertyId } = data;

          // Map appointment type to status ID and meetingOrSiteVisit number
          let statusId = '';
          let meetingOrSiteVisit = 0;

          if (targetStatusId) {
            // Use specific child ID if set (e.g. meeting_in_person, site_visit_revisit)
            statusId = targetStatusId;
            if (appointmentType === 'Meeting') meetingOrSiteVisit = 1;
            else if (appointmentType === 'Visit') meetingOrSiteVisit = 2;
            else meetingOrSiteVisit = 0;
          } else if (appointmentType === 'Callback') {
            statusId = PARENT_STATUS_IDS.callback;
            meetingOrSiteVisit = 0;
          } else if (appointmentType === 'Meeting') {
            statusId = CHILD_STATUS_IDS.meeting_in_person;
            meetingOrSiteVisit = 1;
          } else if (appointmentType === 'Visit') {
            statusId = CHILD_STATUS_IDS.site_visit_first_visit;
            meetingOrSiteVisit = 2;
          }

          const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00Z`;

          const payload = {
            id: selectedLeadId,
            leadStatusId: statusId,
            rating: null,
            notes: notes || null,
            IsNotesUpdated: !!notes,
            bookedUnderName: null,
            agreementValue: null,
            purchasedFrom: null,
            propertiesList: selectedPropertyId ? [selectedPropertyId] : [],
            projectsList: [],
            projectIds: null,
            unitTypeId: null,
            propertyIds: selectedPropertyId ? [selectedPropertyId] : null,
            currency: 'INR',
            buyer: null,
            paymentPlans: null,
            lowerBudget: null,
            upperBudget: null,
            purpose: null,
            addresses: [],
            assignTo: assignTo || '45abfce5-2746-42e6-bf66-ac7e00e75085',
            secondaryUserId: secondaryUserId || '00000000-0000-0000-0000-000000000000',
            scheduledDate: scheduledDateTime,
            meetingOrSiteVisit: meetingOrSiteVisit
          };

          await api.put(`/leads/${selectedLeadId}/status`, payload);

          setConvState({ flow: 'none', step: '', data: {} });
          appendBotMessage(
            `✅ **Appointment Scheduled Successfully!**\n\n` +
            `👤 **Lead:** ${data.selectedLeadName}\n` +
            `📞 **Phone:** ${data.selectedLeadPhone}\n` +
            `📅 **Type:** ${appointmentType}\n` +
            (data.selectedPropertyName ? `📍 **Property:** ${data.selectedPropertyName}, ${data.selectedPropertyCity}\n` : '') +
            `📅 **Date:** ${scheduledDate}\n` +
            `🕐 **Time:** ${scheduledTime}\n` +
            `✓ Updated in Leadrat CRM`,
            ['Schedule Another', 'Show All Leads', 'Create Lead']
          );
        } catch (error: any) {
          console.error('[ChatInterface] Schedule failed:', error);
          setConvState(prev => ({ ...prev, step: 'get_notes' }));
          appendBotMessage(
            `Let me retry scheduling this appointment...`,
            ['✅ Confirm Schedule', '❌ Cancel']
          );
        }
        break;
      }
    }
  }

  async function handleCallbackFlow(text: string) {
    const { step, data } = convState;

    if (text === '❌ Cancel') {
      setConvState({ flow: 'none', step: '', data: {} });
      appendBotMessage('Callback scheduling cancelled. How else can I help?',
        ['Show leads', 'Schedule visit', 'Create lead']);
      return;
    }

    // Callback flow is similar to schedule_visit but appointmentType is pre-set
    // Reuse handleScheduleFlow logic but skip type selection
    switch(step) {
      case 'get_lead': {
        // Same as schedule_visit
        appendBotMessage('Searching for lead...', []);
        try {
          const res = await api.get('/leads', {
            params: { search: text, page: 0, size: 10 }
          });
          const leads = res.data?.data?.content || [];
          if (!leads.length) {
            appendBotMessage(`No leads found for "${text}". Try again.`, ['Try Again', '❌ Cancel']);
            return;
          }
          setConvState(prev => ({ ...prev, step: 'select_lead', data: { ...prev.data, appointmentType: 'Callback' } }));
          appendBotMessage(
            `Found ${leads.length} lead(s). Select one:`,
            leads.slice(0, 5).map((l: any) =>
              `Select: ${l.name ?? 'Unknown'} - ${l.phoneNumber ?? l.contactNo ?? ''}`
            ).concat(['❌ Cancel'])
          );
          sessionStorage.setItem('schedule_leads', JSON.stringify(leads));
        } catch {
          appendBotMessage('Failed to search leads.', ['Try Again', '❌ Cancel']);
        }
        break;
      }

      case 'select_lead': {
        const leads = JSON.parse(sessionStorage.getItem('schedule_leads') || '[]');
        const selected = leads.find((l: any) =>
          text.includes(l.name) || text.includes(l.phoneNumber) || text.includes(l.contactNo)
        );
        if (!selected) {
          appendBotMessage('Could not find that lead.', ['❌ Cancel']);
          return;
        }

        appendBotMessage(`Checking status for **${selected.name}**...`, []);

        try {
          const res = await api.get(`/leads/${selected.id}`);
          const lead = res.data?.data || res.data;
          const statusCode = lead?.statusCode || '';
          const statusName = lead?.status || 'New Lead';
          const statusId = lead?.statusId || '';
          const category = getStatusCategory(statusCode);
          const { message, buttons } = getStatusAwareOptions(category, statusName);

          setConvState(prev => ({
            ...prev,
            step: 'status_aware_action',
            data: {
              ...prev.data,
              selectedLeadId: selected.id,
              selectedLeadName: selected.name,
              selectedLeadPhone: selected.phoneNumber || selected.contactNo,
              assignTo: lead?.assignTo || '45abfce5-2746-42e6-bf66-ac7e00e75085',
              secondaryUserId: lead?.secondaryUserId || '00000000-0000-0000-0000-000000000000',
              currentStatusId: statusId,
              currentStatusCode: statusCode,
              currentStatusName: statusName,
              statusCategory: category,
            }
          }));
          appendBotMessage(
            `👤 **${selected.name}** (${selected.phoneNumber || selected.contactNo})\n\n${message}`,
            buttons
          );
        } catch {
          setConvState(prev => ({
            ...prev,
            step: 'status_aware_action',
            data: {
              ...prev.data,
              selectedLeadId: selected.id,
              selectedLeadName: selected.name,
              selectedLeadPhone: selected.phoneNumber || selected.contactNo,
              statusCategory: 'fresh',
            }
          }));
          appendBotMessage(
            `👤 **${selected.name}**\n\nWhat would you like to schedule?`,
            ['🏢 Schedule Site Visit', '📞 Schedule Callback', '🤝 Schedule Meeting', '❌ Cancel']
          );
        }
        break;
      }

      case 'select_date': {
        let scheduledDate = '';
        const today = new Date();
        if (text.includes('Today')) {
          scheduledDate = today.toISOString().split('T')[0];
        } else if (text.includes('Tomorrow')) {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          scheduledDate = tomorrow.toISOString().split('T')[0];
        } else if (text.match(/\d{4}-\d{2}-\d{2}/)) {
          scheduledDate = text.match(/\d{4}-\d{2}-\d{2}/)![0];
        } else {
          appendBotMessage('Please select a valid date.', ['📅 Today', '📅 Tomorrow', '🗓️ Pick date']);
          return;
        }
        setConvState(prev => ({
          ...prev,
          step: 'select_time',
          data: { ...prev.data, scheduledDate }
        }));
        appendBotMessage(
          `Date: ${scheduledDate}\n\nWhat time?`,
          ['🕙 10:00 AM', '🕛 12:00 PM', '🕒 3:00 PM', '🕔 5:00 PM']
        );
        break;
      }

      case 'select_time': {
        let scheduledTime = '';
        if (text.includes('10:00')) scheduledTime = '10:00';
        else if (text.includes('12:00')) scheduledTime = '12:00';
        else if (text.includes('3:00') || text.includes('15:00')) scheduledTime = '15:00';
        else if (text.includes('5:00') || text.includes('17:00')) scheduledTime = '17:00';
        else {
          appendBotMessage('Please select a valid time.', ['🕙 10:00 AM', '🕛 12:00 PM', '🕒 3:00 PM', '🕔 5:00 PM']);
          return;
        }
        setConvState(prev => ({
          ...prev,
          step: 'confirm',
          data: { ...prev.data, scheduledTime }
        }));
        const { selectedLeadName, selectedLeadPhone, scheduledDate } = data;
        appendBotMessage(
          `📋 **Confirm Callback**\n\n👤 **Lead:** ${selectedLeadName}\n📞 **Phone:** ${selectedLeadPhone}\n📅 **Date:** ${scheduledDate}\n🕐 **Time:** ${scheduledTime}`,
          ['✅ Confirm Schedule', '❌ Cancel']
        );
        break;
      }

      case 'confirm': {
        if (!text.includes('Confirm')) return;
        appendBotMessage('Scheduling callback in Leadrat CRM...', []);
        try {
          const { selectedLeadId, scheduledDate, scheduledTime } = data;
          const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00Z`;
          const payload = {
            id: selectedLeadId,
            leadStatusId: '54bd52ee-914f-4a78-b919-cd99be9dee88',
            rating: null,
            notes: null,
            IsNotesUpdated: false,
            bookedUnderName: null,
            agreementValue: null,
            purchasedFrom: null,
            propertiesList: [],
            projectsList: [],
            projectIds: null,
            unitTypeId: null,
            propertyIds: null,
            currency: 'INR',
            buyer: null,
            paymentPlans: null,
            lowerBudget: null,
            upperBudget: null,
            purpose: null,
            addresses: [],
            assignTo: '45abfce5-2746-42e6-bf66-ac7e00e75085',
            secondaryUserId: '00000000-0000-0000-0000-000000000000',
            scheduledDate: scheduledDateTime,
            meetingOrSiteVisit: 0
          };
          await api.put(`/leads/${selectedLeadId}/status`, payload);
          setConvState({ flow: 'none', step: '', data: {} });
          appendBotMessage(
            `✅ **Callback Scheduled Successfully!**\n\n👤 **Lead:** ${data.selectedLeadName}\n📞 **Phone:** ${data.selectedLeadPhone}\n📅 **Date:** ${scheduledDate}\n🕐 **Time:** ${scheduledTime}`,
            ['Schedule Another', 'Show All Leads', 'Create Lead']
          );
        } catch (error: any) {
          console.error('[ChatInterface] Callback failed:', error);
          appendBotMessage('Let me retry...', ['✅ Confirm Schedule', '❌ Cancel']);
        }
        break;
      }
    }
  }

  async function handleMeetingFlow(text: string) {
    const { step, data } = convState;

    if (text === '❌ Cancel') {
      setConvState({ flow: 'none', step: '', data: {} });
      appendBotMessage('Meeting scheduling cancelled. How else can I help?',
        ['Show leads', 'Schedule visit', 'Create lead']);
      return;
    }

    // Meeting flow: reuse handleScheduleFlow logic with appointmentType pre-set to 'Meeting'
    switch(step) {
      case 'get_lead': {
        appendBotMessage('Searching for lead...', []);
        try {
          const res = await api.get('/leads', {
            params: { search: text, page: 0, size: 10 }
          });
          const leads = res.data?.data?.content || [];
          if (!leads.length) {
            appendBotMessage(`No leads found for "${text}". Try again.`, ['Try Again', '❌ Cancel']);
            return;
          }
          setConvState(prev => ({ ...prev, step: 'select_lead', data: { ...prev.data, appointmentType: 'Meeting' } }));
          appendBotMessage(
            `Found ${leads.length} lead(s). Select one:`,
            leads.slice(0, 5).map((l: any) =>
              `Select: ${l.name ?? 'Unknown'} - ${l.phoneNumber ?? l.contactNo ?? ''}`
            ).concat(['❌ Cancel'])
          );
          sessionStorage.setItem('schedule_leads', JSON.stringify(leads));
        } catch {
          appendBotMessage('Failed to search leads.', ['Try Again', '❌ Cancel']);
        }
        break;
      }

      case 'select_lead': {
        const leads = JSON.parse(sessionStorage.getItem('schedule_leads') || '[]');
        const selected = leads.find((l: any) =>
          text.includes(l.name) || text.includes(l.phoneNumber) || text.includes(l.contactNo)
        );
        if (!selected) {
          appendBotMessage('Could not find that lead.', ['❌ Cancel']);
          return;
        }

        appendBotMessage(`Checking status for **${selected.name}**...`, []);

        try {
          const res = await api.get(`/leads/${selected.id}`);
          const lead = res.data?.data || res.data;
          const statusCode = lead?.statusCode || '';
          const statusName = lead?.status || 'New Lead';
          const statusId = lead?.statusId || '';
          const category = getStatusCategory(statusCode);
          const { message, buttons } = getStatusAwareOptions(category, statusName);

          setConvState(prev => ({
            ...prev,
            step: 'status_aware_action',
            data: {
              ...prev.data,
              selectedLeadId: selected.id,
              selectedLeadName: selected.name,
              selectedLeadPhone: selected.phoneNumber || selected.contactNo,
              assignTo: lead?.assignTo || '45abfce5-2746-42e6-bf66-ac7e00e75085',
              secondaryUserId: lead?.secondaryUserId || '00000000-0000-0000-0000-000000000000',
              currentStatusId: statusId,
              currentStatusCode: statusCode,
              currentStatusName: statusName,
              statusCategory: category,
            }
          }));
          appendBotMessage(
            `👤 **${selected.name}** (${selected.phoneNumber || selected.contactNo})\n\n${message}`,
            buttons
          );
        } catch {
          setConvState(prev => ({
            ...prev,
            step: 'status_aware_action',
            data: {
              ...prev.data,
              selectedLeadId: selected.id,
              selectedLeadName: selected.name,
              selectedLeadPhone: selected.phoneNumber || selected.contactNo,
              statusCategory: 'fresh',
            }
          }));
          appendBotMessage(
            `👤 **${selected.name}**\n\nWhat would you like to schedule?`,
            ['🏢 Schedule Site Visit', '📞 Schedule Callback', '🤝 Schedule Meeting', '❌ Cancel']
          );
        }
        break;
      }

      case 'select_date': {
        let scheduledDate = '';
        const today = new Date();
        if (text.includes('Today')) {
          scheduledDate = today.toISOString().split('T')[0];
        } else if (text.includes('Tomorrow')) {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          scheduledDate = tomorrow.toISOString().split('T')[0];
        } else if (text.match(/\d{4}-\d{2}-\d{2}/)) {
          scheduledDate = text.match(/\d{4}-\d{2}-\d{2}/)![0];
        } else {
          appendBotMessage('When would you like to meet?', ['📅 Today', '📅 Tomorrow', '🗓️ Pick date']);
          return;
        }
        setConvState(prev => ({
          ...prev,
          step: 'select_time',
          data: { ...prev.data, scheduledDate }
        }));
        appendBotMessage(
          `Date: ${scheduledDate}\n\nWhat time?`,
          ['🕙 10:00 AM', '🕛 12:00 PM', '🕒 3:00 PM', '🕔 5:00 PM']
        );
        break;
      }

      case 'select_time': {
        let scheduledTime = '';
        if (text.includes('10:00')) scheduledTime = '10:00';
        else if (text.includes('12:00')) scheduledTime = '12:00';
        else if (text.includes('3:00') || text.includes('15:00')) scheduledTime = '15:00';
        else if (text.includes('5:00') || text.includes('17:00')) scheduledTime = '17:00';
        else {
          appendBotMessage('Please select a valid time.', ['🕙 10:00 AM', '🕛 12:00 PM', '🕒 3:00 PM', '🕔 5:00 PM']);
          return;
        }
        setConvState(prev => ({
          ...prev,
          step: 'confirm',
          data: { ...prev.data, scheduledTime }
        }));
        const { selectedLeadName, selectedLeadPhone, scheduledDate } = data;
        appendBotMessage(
          `📋 **Confirm Meeting**\n\n👤 **Lead:** ${selectedLeadName}\n📞 **Phone:** ${selectedLeadPhone}\n📅 **Date:** ${scheduledDate}\n🕐 **Time:** ${scheduledTime}`,
          ['✅ Confirm Schedule', '❌ Cancel']
        );
        break;
      }

      case 'confirm': {
        if (!text.includes('Confirm')) return;
        appendBotMessage('Scheduling meeting in Leadrat CRM...', []);
        try {
          const { selectedLeadId, scheduledDate, scheduledTime } = data;
          const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00Z`;
          const payload = {
            id: selectedLeadId,
            leadStatusId: '1c204d66-0f0e-4718-af99-563dad02a39b',
            rating: null,
            notes: null,
            IsNotesUpdated: false,
            bookedUnderName: null,
            agreementValue: null,
            purchasedFrom: null,
            propertiesList: [],
            projectsList: [],
            projectIds: null,
            unitTypeId: null,
            propertyIds: null,
            currency: 'INR',
            buyer: null,
            paymentPlans: null,
            lowerBudget: null,
            upperBudget: null,
            purpose: null,
            addresses: [],
            assignTo: '45abfce5-2746-42e6-bf66-ac7e00e75085',
            secondaryUserId: '00000000-0000-0000-0000-000000000000',
            scheduledDate: scheduledDateTime,
            meetingOrSiteVisit: 1
          };
          await api.put(`/leads/${selectedLeadId}/status`, payload);
          setConvState({ flow: 'none', step: '', data: {} });
          appendBotMessage(
            `✅ **Meeting Scheduled Successfully!**\n\n👤 **Lead:** ${data.selectedLeadName}\n📅 **Date:** ${scheduledDate}\n🕐 **Time:** ${scheduledTime}`,
            ['Schedule Another', 'Show All Leads', 'Create Lead']
          );
        } catch (error: any) {
          console.error('[ChatInterface] Meeting failed:', error);
          appendBotMessage('Let me retry...', ['✅ Confirm Schedule', '❌ Cancel']);
        }
        break;
      }
    }
  }

  async function handleSend(messageText?: string) {
    let text = messageText ?? input.trim();
    if (!text || isLoading) return;

    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Route based on active conversation flow
    if (convState.flow === 'create_lead') {
      await handleLeadCreationFlow(text);
      return;
    }

    if (convState.flow === 'update_status') {
      await handleStatusUpdateFlow(text);
      return;
    }

    if (convState.flow === 'schedule_visit') {
      await handleScheduleFlow(text);
      return;
    }

    if (convState.flow === 'callback_booking') {
      await handleCallbackFlow(text);
      return;
    }

    if (convState.flow === 'meeting_booking') {
      await handleMeetingFlow(text);
      return;
    }

    // Classify intent and route to appropriate flow (CRM Agent)
    const intent = detectIntent(text);

    switch (intent) {
      // === BOOKING FLOWS ===
      case 'site_visit_booking':
        // If a lead was just created, use it directly
        if (convState.data.leadId && convState.data.leadName) {
          setConvState(prev => ({
            ...prev,
            flow: 'schedule_visit',
            step: 'select_type',
            data: {
              ...prev.data,
              selectedLeadId: convState.data.leadId,
              selectedLeadName: convState.data.leadName,
              selectedLeadPhone: convState.data.leadPhone,
              appointmentType: 'Visit'
            }
          }));
          appendBotMessage(
            `Perfect! 👤 **${convState.data.leadName}**\n\n🏢 **Site Visit**\n\nWhen would you like to schedule this?`,
            ['📅 Today', '📅 Tomorrow', '🗓️ Pick date']
          );
        } else {
          setConvState({ flow: 'schedule_visit', step: 'get_lead', data: {} });
          appendBotMessage(
            'Let me schedule a site visit! 🏢\n\nEnter the lead name or phone number:',
            ['❌ Cancel']
          );
        }
        return;

      case 'callback_booking':
        // If a lead was just created, use it directly
        if (convState.data.leadId && convState.data.leadName) {
          setConvState(prev => ({
            ...prev,
            flow: 'callback_booking',
            step: 'select_date',
            data: {
              ...prev.data,
              selectedLeadId: convState.data.leadId,
              selectedLeadName: convState.data.leadName,
              selectedLeadPhone: convState.data.leadPhone,
              appointmentType: 'Callback'
            }
          }));
          appendBotMessage(
            `Perfect! 👤 **${convState.data.leadName}**\n\n📞 **Callback**\n\nWhen would you like to schedule this?`,
            ['📅 Today', '📅 Tomorrow', '🗓️ Pick date']
          );
        } else {
          setConvState({ flow: 'callback_booking', step: 'get_lead', data: {} });
          appendBotMessage(
            'Let me schedule a callback! 📞\n\nEnter the lead name or phone number:',
            ['❌ Cancel']
          );
        }
        return;

      case 'meeting_booking':
        // If a lead was just created, use it directly
        if (convState.data.leadId && convState.data.leadName) {
          setConvState(prev => ({
            ...prev,
            flow: 'meeting_booking',
            step: 'select_date',
            data: {
              ...prev.data,
              selectedLeadId: convState.data.leadId,
              selectedLeadName: convState.data.leadName,
              selectedLeadPhone: convState.data.leadPhone,
              appointmentType: 'Meeting'
            }
          }));
          appendBotMessage(
            `Perfect! 👤 **${convState.data.leadName}**\n\n🤝 **Meeting**\n\nWhen would you like to schedule this?`,
            ['📅 Today', '📅 Tomorrow', '🗓️ Pick date']
          );
        } else {
          setConvState({ flow: 'meeting_booking', step: 'get_lead', data: {} });
          appendBotMessage(
            'Let me schedule a meeting! 🤝\n\nEnter the lead name or phone number:',
            ['❌ Cancel']
          );
        }
        return;

      // === LEAD MANAGEMENT ===
      case 'lead_creation':
        setConvState({ flow: 'create_lead', step: 'get_name', data: {} });
        appendBotMessage(
          'Let me create a new lead! 👤\n\nWhat is the customer\'s name?',
          ['❌ Cancel']
        );
        return;

      case 'status_followup':
        setConvState({ flow: 'update_status', step: 'get_lead', data: {} });
        appendBotMessage(
          'Let me check the lead status! 📋\n\nEnter the lead name or phone number:',
          ['❌ Cancel']
        );
        return;

      // === ESCALATION ===
      case 'human_handoff_request':
        appendBotMessage(
          '🤝 **Connecting you with our team!**\n\n' +
          'A relationship manager will contact you shortly.\n' +
          'You can also reach our team directly.',
          ['📞 Call Sales Team', 'Show Leads', 'Back to Main']
        );
        return;

      // === PROPERTY/PROJECT DISCOVERY (async intent detection + API call) ===
      case 'unit_availability':
      case 'project_discovery':
      case 'pricing_inquiry':
      default:
        // Use FastAPI for intent detection + property/project search
        let text_expanded = expandShortReply(text);
        const loadingId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          {
            id: loadingId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isLoading: true,
          },
        ]);
        setIsLoading(true);

        try {
          const searchTerm = extractSearchTerm(text_expanded);
          const { content, quickReplies } = await callLeadratAPI(intent, searchTerm, text_expanded, messages);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === loadingId ? { ...msg, content, quickReplies, isLoading: false } : msg
            )
          );
        } catch {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === loadingId
                ? {
                    ...msg,
                    content: 'Let me search that for you...',
                    quickReplies: ['Show All Properties', 'Show All Projects', 'Create Lead'],
                    isLoading: false,
                  }
                : msg
            )
          );
        } finally {
          setIsLoading(false);
        }
    }
  }

  function handleQuickReply(reply: string) {
    // Use the mapped message from QUICK_REPLY_PARAMS, or fallback to the reply text
    const params = QUICK_REPLY_PARAMS[reply];
    const messageToSend = params?.message || reply;
    handleSend(messageToSend);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 140px)',
        background: 'hsl(220 25% 12%)',
        borderRadius: '1.5rem',
        border: '1px solid hsl(195 85% 55% / 0.2)',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Premium Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid hsl(195 85% 55% / 0.2)',
          background: 'linear-gradient(90deg, rgba(195, 100, 255, 0.05) 0%, rgba(195, 100, 255, 0.02) 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, hsl(195 85% 55%) 0%, hsl(270 60% 55%) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px hsl(195 85% 55% / 0.4)',
            }}
          >
            <Bot size={20} style={{ color: '#fff' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'hsl(40 30% 95%)', fontFamily: "'Playfair Display', serif" }}>
              ESTATE AI
            </h2>
            <p style={{ margin: 0, fontSize: '11px', color: 'hsl(195 85% 55%)', fontWeight: '500' }}>
              Real Estate CRM Assistant
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
              }}
            />
            <span style={{ fontSize: '11px', color: 'hsl(195 85% 55%)', fontWeight: '500' }}>Online</span>
          </div>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'hsl(195 85% 55% / 0.1)',
              border: '1px solid hsl(195 85% 55% / 0.3)',
              fontSize: '10px',
              color: 'hsl(195 85% 55%)',
              fontWeight: '600',
            }}
          >
            Leadrat Connected
          </div>
        </div>
      </div>


      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            textAlign: 'center',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, hsl(195 85% 55%) 0%, hsl(270 60% 55%) 50%, hsl(35 90% 60%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '32px',
              fontWeight: '700',
              fontFamily: "'Playfair Display', serif",
              margin: '0',
            }}>
              Welcome to ESTATE AI
            </div>
            <p style={{
              color: 'hsl(220 10% 65%)',
              fontSize: '14px',
              margin: '0',
              maxWidth: '280px',
            }}>
              Your intelligent real estate CRM assistant. Search properties, manage leads, and schedule appointments.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              width: '100%',
              maxWidth: '320px',
            }}>
              {[
                '🔍 Search Leads',
                '🏢 Find Properties',
                '📅 Schedule Visit',
                '📞 Book Callback',
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(action)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '1rem',
                    border: '1px solid hsl(195 85% 55% / 0.4)',
                    background: 'rgba(195, 100, 255, 0.08)',
                    color: 'hsl(195 85% 55%)',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(195, 100, 255, 0.15)';
                    e.currentTarget.style.borderColor = 'hsl(195 85% 55% / 0.6)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px hsl(195 85% 55% / 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(195, 100, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'hsl(195 85% 55% / 0.4)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <div
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: msg.quickReplies ? '8px' : '0',
              }}
            >
              {msg.role === 'assistant' && (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginRight: '12px',
                  }}
                >
                  <Bot size={18} color="white" />
                </div>
              )}

              <div
                style={{
                  maxWidth: '70%',
                  backgroundColor: msg.role === 'user'
                    ? 'rgba(195, 100, 255, 0.15)'
                    : 'rgba(220, 40, 12%, 0.5)',
                  border: `1px solid ${msg.role === 'user'
                    ? 'hsl(270 60% 55% / 0.4)'
                    : 'hsl(195 85% 55% / 0.3)'}`,
                  backdropFilter: 'blur(10px)',
                  borderRadius: '1rem',
                  padding: '12px 16px',
                  color: 'hsl(40 30% 95%)',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  boxShadow: msg.role === 'user'
                    ? 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 0 15px hsl(270 60% 55% / 0.15)'
                    : 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 0 20px hsl(195 85% 55% / 0.2)',
                  transition: 'all 0.3s ease',
                }}
              >
                {msg.isLoading ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'hsl(195 85% 55%)',
                            boxShadow: '0 0 10px hsl(195 85% 55%)',
                            animation: `typing-bounce 1.4s infinite`,
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ color: 'hsl(195 85% 55%)', fontSize: '12px' }}>thinking...</span>
                  </div>
                ) : (
                  msg.content
                )}
              </div>

              {msg.role === 'user' && (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(6, 182, 212, 0.2)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginLeft: '12px',
                  }}
                >
                  <User size={18} color="#06b6d4" />
                </div>
              )}
            </div>

            {/* Quick Replies */}
            {msg.role === 'assistant' && msg.quickReplies && !msg.isLoading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginLeft: '44px' }}>
                {msg.quickReplies.map((reply, idx) => (
                  <button
                    key={`${msg.id}-reply-${idx}`}
                    onClick={() => handleQuickReply(reply)}
                    disabled={isLoading}
                    style={{
                      fontSize: '12px',
                      padding: '8px 14px',
                      borderRadius: '999px',
                      border: '1px solid hsl(195 85% 55% / 0.4)',
                      color: 'hsl(195 85% 55%)',
                      backgroundColor: 'rgba(195, 100, 255, 0.08)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.5 : 1,
                      transition: 'all 0.3s ease',
                      fontWeight: '500',
                      backdropFilter: 'blur(10px)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = 'rgba(195, 100, 255, 0.15)';
                        e.currentTarget.style.borderColor = 'hsl(195 85% 55% / 0.6)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px hsl(195 85% 55% / 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(195, 100, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'hsl(195 85% 55% / 0.4)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid hsl(195 85% 55% / 0.2)',
          background: 'linear-gradient(135deg, rgba(195, 100, 255, 0.05) 0%, rgba(195, 100, 255, 0.02) 100%)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          gap: '12px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask about properties, leads, or schedule meetings..."
          disabled={isLoading}
          style={{
            flex: 1,
            backgroundColor: 'rgba(220, 40, 12%, 0.4)',
            border: '1px solid hsl(195 85% 55% / 0.3)',
            backdropFilter: 'blur(10px)',
            borderRadius: '1rem',
            padding: '12px 16px',
            color: 'hsl(40 30% 95%)',
            fontSize: '13px',
            outline: 'none',
            transition: 'all 0.3s ease',
            opacity: isLoading ? 0.6 : 1,
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.1)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'hsl(195 85% 55% / 0.6)';
            e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 0 20px hsl(195 85% 55% / 0.3)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'hsl(195 85% 55% / 0.3)';
            e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.1)';
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, hsl(195 85% 55%) 0%, hsl(270 60% 55%) 100%)',
            border: 'none',
            borderRadius: '1rem',
            color: 'hsl(40 30% 95%)',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !input.trim() ? 0.5 : 1,
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 24px hsl(195 85% 55% / 0.3)',
            fontWeight: '600',
          }}
          onMouseEnter={(e) => {
            if (!isLoading && input.trim()) {
              e.currentTarget.style.boxShadow = '0 12px 32px hsl(195 85% 55% / 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 24px hsl(195 85% 55% / 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {isLoading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes typing-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
