'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader, Bot, User } from 'lucide-react';
import fastApiClient from '@/lib/fastapi-client';
import api from '@/lib/api';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useLanguage } from '@/hooks/useLanguage';
import { getTranslation } from '@/lib/translations';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quickReplies?: string[];
  isLoading?: boolean;
  data?: any[];
  template?: string;
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

// CRM Agent Intent Classification (property/project focused - no leads)
const INTENT_PATTERNS = {
  project_discovery: ['project', 'projects', 'tower', 'phase', 'development', 'what projects', 'which projects', 'available projects', 'show projects'],
  unit_availability: ['property', 'properties', 'flat', 'unit', 'apartment', 'available', 'inventory', '2bhk', '3bhk', 'bhk', 'villa', 'house', 'show properties', 'what properties', 'available units'],
  pricing_inquiry: ['price', 'cost', 'budget', 'rate', 'per sqft', 'payment', 'price range', 'how much', 'what is the cost'],
  site_visit_booking: ['schedule', 'book', 'site visit', 'site see', 'tour', 'walkthrough', 'show property', 'visit property', 'schedule visit', 'book visit'],
  callback_booking: ['callback', 'call back', 'call me', 'call later', 'schedule callback', 'book callback'],
  meeting_booking: ['meeting', 'meet', 'schedule meeting', 'book meeting', 'online call', 'video call'],
  human_handoff_request: ['talk to', 'speak to', 'contact rm', 'rm', 'human', 'manager', 'agent', 'need help', 'support', 'speak with someone'],
  property_interest: ['interested:', 'interested in', 'tell me more about', 'more info on'],
};

function detectIntent(message: string): string {
  const lower = message.toLowerCase();

  // Priority matching: check most specific intents first
  const intentPriority = [
    'site_visit_booking', 'callback_booking', 'meeting_booking', // booking intents (most specific)
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
    lead: ['Find Properties', 'View Projects', 'Book Site Visit'],
    property: ['Filter by BHK', 'Show price range', 'View on map', 'Book Site Visit'],
    project: ['Show units', 'View amenities', 'Check RERA', 'Contact developer'],
    visit: ['Schedule visit', 'View calendar', 'Book site visit'],
    status: ['Show properties', 'Show projects', 'Schedule visit'],
    analytics: ['Find Properties', 'View Projects'],
    general: ['Find property', 'View projects', 'Schedule visit']
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
  '🏠 Available Properties': { message: 'Show available properties' },
  '🏗️ Show Projects': { message: 'Show available projects' },
  '📅 Schedule Site Visit': { message: 'Schedule a site visit' },
  '📞 Schedule Callback': { message: 'Schedule a callback' },
  '🤝 Schedule Meeting': { message: 'Schedule a meeting' },
  '✅ Update Lead Status': { message: 'Update lead status' },
  '🏠 2BHK Properties': { message: 'Show 2BHK properties' },
  '🏠 3BHK Properties': { message: 'Show 3BHK properties' },
  '💰 Under 80 Lakhs': { message: 'Show properties under 80 lakhs' },
  '📋 Project Details': { message: 'Show project details' },
  '🏠 Available Units': { message: 'Show available units' },
  '💰 Price List': { message: 'Show price list' },
  '🔄 Try Again': { message: 'Try again' },
  '🏠 Show Properties': { message: 'Show properties' },
  'Schedule visit': { message: 'Schedule a property visit' },
  'View projects': { message: 'View all projects' },
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

async function callLeadratAPI(intent: string, searchTerm: string, originalMessage: string, conversationHistory: Message[] = [], language: string = 'en', tenantIdOverride?: string, backendUrlOverride?: string, flowStateOverride?: any): Promise<{ content: string; quickReplies: string[]; template?: string; data?: any[]; flowState?: any }> {
  const tenantId = tenantIdOverride || (typeof window !== 'undefined' ? (localStorage.getItem('tenantId') || 'dubait11') : 'dubait11');

  // Backend URL resolution with environment variable support
  let backendUrl = backendUrlOverride;
  if (!backendUrl && typeof window !== 'undefined') {
    backendUrl = localStorage.getItem('backendUrl');
  }
  if (!backendUrl) {
    backendUrl = process.env.NEXT_PUBLIC_CHAT_API_URL;
  }
  if (!backendUrl) {
    // Fallback to auto-detect
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    backendUrl = isLocalhost ? 'http://localhost:8000/api/v1/chat/message' : 'https://real-estate-rag-dev.onrender.com/api/v1/chat/message';
  }

  const maxRetries = 2;
  const apiTimeout = 30000; // 30 seconds (increased for debugging backend)

  console.log('[ChatAPI] Processing:', {
    intent,
    tenant: tenantId,
    backendUrl,
    message: originalMessage.substring(0, 40)
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const historyContext = conversationHistory
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-3)
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content.substring(0, 200)
        }));

      const requestPayload: any = {
        message: originalMessage,
        conversation_history: historyContext,
        language: language || 'en',
        tenant_id: tenantId,
        flow_state: flowStateOverride || {},
      };

      // Use the backend URL directly (should already have full path)
      const chatEndpoint = backendUrl;
      console.log(`[ChatAPI] Attempt ${attempt + 1}/${maxRetries + 1} - POST ${chatEndpoint}`);

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), apiTimeout)
      );

      const response = await Promise.race([
        fetch(chatEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestPayload),
        }).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
        timeoutPromise
      ]) as any;

      const routerResponse = response?.response || response?.data?.response || response?.data?.content || response?.content || '';
      const detectedIntent = response?.intent || intent || 'general';
      const source = response?.source || 'Leadrat';
      const template = response?.template;
      const dataItems = response?.data || [];
      const responseFlowState = response?.flow_state || {};

      console.log('[ChatAPI] Success:', { intent: detectedIntent, source, hasResponse: !!routerResponse, template, dataCount: dataItems.length });

      if (!routerResponse) {
        console.warn('[ChatAPI] Empty response - retrying...');
        if (attempt < maxRetries) continue;
        return {
          content: 'I\'m checking the latest CRM data. Please try again in a moment.',
          quickReplies: ['Try again', 'Help']
        };
      }

      let quickReplies = getQuickReplies(detectedIntent);

      // Backend can override quickReplies via metadata
      if (response?.metadata?.quickReplies && Array.isArray(response.metadata.quickReplies)) {
        quickReplies = response.metadata.quickReplies;
      } else if ((detectedIntent === 'property' || template === 'property_list') && dataItems.length > 0) {
        quickReplies = ['Filter results', 'Show more'];
      } else if ((detectedIntent === 'project' || template === 'project_list') && dataItems.length > 0) {
        quickReplies = ['Filter results', 'Show more'];
      }

      return {
        content: routerResponse,
        quickReplies: quickReplies,
        template: template,
        data: dataItems,
        flowState: responseFlowState
      };

    } catch (error: any) {
      const status = error.response?.status;
      const errorCode = error.code || error.message;
      const isTimeout = errorCode === 'ECONNABORTED' || error.message === 'Request timeout';

      console.warn(`[ChatAPI] Attempt ${attempt + 1} failed:`, {
        status,
        timeout: isTimeout,
        error: error.message,
        willRetry: attempt < maxRetries
      });

      // Retry on timeout or 5xx errors
      if (attempt < maxRetries && (isTimeout || (status && status >= 500))) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1))); // exponential backoff
        continue;
      }

      // Final error handling
      let friendlyMessage = 'I\'m checking the latest CRM data. Please try again in a moment.';

      if (status === 401) {
        friendlyMessage = 'Your session has expired. Please refresh and login again.';
      } else if (status === 403) {
        friendlyMessage = 'You do not have permission to access this data.';
      } else if (status === 404) {
        friendlyMessage = 'The requested data is not available. Please try a different search.';
      } else if (isTimeout) {
        friendlyMessage = 'The request took too long. Please try again or try a simpler search.';
      } else if (!status) {
        friendlyMessage = 'Unable to connect to the server. Please check your internet connection.';
      }

      console.error('[ChatAPI] Final error after retries:', {
        intent,
        tenant: tenantId,
        status,
        friendlyMessage,
        originalError: {
          message: error?.message,
          code: error?.code,
          type: error?.constructor?.name
        },
        url: backendUrl
      });

      return {
        content: friendlyMessage,
        quickReplies: ['Try again', 'Help'],
      };
    }
  }

  return {
    content: 'I\'m having trouble connecting right now. Please try again in a moment.',
    quickReplies: ['Try again', 'Help'],
  };
}

interface ChatInterfaceProps {
  isFloating?: boolean
  fullPage?: boolean
  embeddedMode?: boolean
}

export default function ChatInterface({ isFloating = true, fullPage = false, embeddedMode = false }: ChatInterfaceProps = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [convState, setConvState] = useState<ConversationState>({
    flow: 'none',
    step: '',
    data: {},
  });
  const [flowState, setFlowState] = useState<any>({});
  const [backendUrl, setBackendUrl] = useState<string>('');
  const [tenantId, setTenantId] = useState<string>('dubait11');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageCounterRef = useRef<number>(0);
  const { logChatMessage, logLeadCreate, logScheduling, logStatusUpdate } = useActivityLogger();
  const { language } = useLanguage();

  // Initialize tenant and backend URL from query params or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTenant = params.get('tenantId') || localStorage.getItem('tenantId') || process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'dubait11';
      const cleanTenant = urlTenant === 'dubai11' ? 'dubait11' : urlTenant;

      // Detect environment and use appropriate URLs
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      // Default backend URL (FULL PATH including /api/v1/chat/message)
      const defaultBackend = isLocalhost
        ? 'http://localhost:8000/api/v1/chat/message'
        : 'https://real-estate-rag-dev.onrender.com/api/v1/chat/message';

      // Priority: URL param > localStorage > env variable > auto-detect
      const urlBackend = params.get('apiUrl')
        || localStorage.getItem('backendUrl')
        || process.env.NEXT_PUBLIC_CHAT_API_URL
        || defaultBackend;

      setTenantId(cleanTenant);
      setBackendUrl(urlBackend || defaultBackend);
      localStorage.setItem('tenantId', cleanTenant);
      localStorage.setItem('backendUrl', urlBackend || defaultBackend);

      console.log('[ChatInterface] Initialized:', {
        tenant: urlTenant,
        chatApiUrl: urlBackend,
        isLocalhost,
        envChatApiUrl: process.env.NEXT_PUBLIC_CHAT_API_URL,
        envDefaultTenant: process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID
      });
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize welcome message when language changes
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm Aria, your real estate assistant. 🏠\n\nI can help you find your dream home, explore new projects, or schedule a visit. What would you like to do today?`,
      timestamp: new Date(),
      quickReplies: [
        '🏠 Properties',
        '🏗️ Projects',
        '📅 Appointments',
      ],
    };
    setMessages([welcomeMessage]);
  }, [language]);

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
          `Thanks **${text}**! 😊 Could you share your phone number so our team can contact you with more details?`,
          ['❌ Cancel']
        );
        break;

      case 'get_phone': {
        const phone = text.replace(/\D/g, '');
        if (phone.length < 10) {
          appendBotMessage("Please provide a valid phone number so we can reach out.", ['❌ Cancel']);
          return;
        }
        setConvState(prev => ({
          ...prev, step: 'get_preference',
          data: { ...prev.data, leadPhone: phone }
        }));
        appendBotMessage(
          `Got it. Would you like a **callback** or would you prefer to schedule a **site visit**?`,
          ['📞 Request Callback', '🏢 Book Site Visit', '❌ Cancel']
        );
        break;
      }

      case 'get_preference':
        if (text.includes('Cancel')) {
          setConvState({ flow: 'none', step: '', data: {} });
          appendBotMessage('No problem! How else can I help?', ['Find Properties', 'View Projects']);
          return;
        }

        const isNone = text.includes('Not now') || text.includes('Skip');
        const pref = text.includes('Callback') ? 'Callback' : (text.includes('Visit') ? 'Visit' : 'None');

        if (isNone || pref === 'None') {
          setConvState(prev => ({
            ...prev, step: 'confirm',
            data: { ...prev.data, appointmentType: 'None' }
          }));
          appendBotMessage(
            `Great. Just to confirm, I'll have our team contact you at **${data.leadPhone}**.\n\nShall I proceed?`,
            ['✅ Yes, please', '❌ Cancel']
          );
        } else {
          setConvState(prev => ({
            ...prev, step: 'select_date',
            data: { ...prev.data, appointmentType: pref }
          }));
          appendBotMessage(
            `Perfect! When would you like the **${pref}**?`,
            ['📅 Today', '📅 Tomorrow', '🗓️ Pick date', '❌ Cancel']
          );
        }
        break;

      case 'select_date': {
        let scheduledDate = '';
        const today = new Date();
        if (text.includes('Today')) scheduledDate = today.toISOString().split('T')[0];
        else if (text.includes('Tomorrow')) {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          scheduledDate = tomorrow.toISOString().split('T')[0];
        } else if (text.match(/\d{4}-\d{2}-\d{2}/)) {
          scheduledDate = text.match(/\d{4}-\d{2}-\d{2}/)![0];
        } else if (!text.includes('Cancel')) {
          appendBotMessage('Please select a date or enter in YYYY-MM-DD format.', ['📅 Today', '📅 Tomorrow', '🗓️ Pick date']);
          return;
        }

        setConvState(prev => ({
          ...prev,
          step: 'select_time',
          data: { ...prev.data, scheduledDate }
        }));
        appendBotMessage(
          `Date: ${scheduledDate}\n\nWhat time works best for you?`,
          ['🕙 10:00 AM', '🕛 12:00 PM', '🕒 3:00 PM', '🕔 5:00 PM', '❌ Cancel']
        );
        break;
      }

      case 'select_time': {
        let scheduledTime = '';
        if (text.includes('10:00')) scheduledTime = '10:00';
        else if (text.includes('12:00')) scheduledTime = '12:00';
        else if (text.includes('15:00') || text.includes('3:00')) scheduledTime = '15:00';
        else if (text.includes('17:00') || text.includes('5:00')) scheduledTime = '17:00';
        else if (text.match(/\d{1,2}:\d{2}/)) {
          scheduledTime = text.match(/\d{1,2}:\d{2}/)![0];
        } else if (!text.includes('Cancel')) {
          appendBotMessage('Please select a time or enter in HH:MM format.', ['🕙 10:00 AM', '🕛 12:00 PM', '🕒 3:00 PM', '🕔 5:00 PM']);
          return;
        }

        setConvState(prev => ({
          ...prev,
          step: 'confirm',
          data: { ...prev.data, scheduledTime }
        }));

        appendBotMessage(
          `Excellent. To summarize:\n\n` +
          `👤 **Name:** ${data.leadName}\n` +
          `📞 **Phone:** ${data.leadPhone}\n` +
          `📅 **${data.appointmentType}:** ${data.scheduledDate} at ${scheduledTime}\n\n` +
          `Shall I send this to our team?`,
          ['✅ Yes, proceed', '❌ Cancel']
        );
        break;
      }

      case 'confirm':
        if (text.includes('Yes') || text === '✅ Yes, proceed' || text === '✅ Yes, please') {
          appendBotMessage("Great! I'm sending your request to our team now...", []);
          try {
            const response = await api.post('/leads', {
              name: data.leadName,
              contactNo: data.leadPhone,
              alternateContactNo: '',
              projectInterest: data.selectedProjectName ?? data.selectedPropertyName,
              source: 'AI Assistant'
            });
            const lead = response.data?.data;
            logLeadCreate(data.leadName || 'Unknown', data.leadPhone || 'N/A');

            // If an appointment was requested, create it now
            if (data.appointmentType && data.appointmentType !== 'None' && lead?.id) {
              try {
                let statusId = data.appointmentType === 'Callback' ? PARENT_STATUS_IDS.callback : CHILD_STATUS_IDS.site_visit_first_visit;
                let meetingOrSiteVisit = data.appointmentType === 'Callback' ? 0 : 2;
                const scheduledDateTime = `${data.scheduledDate}T${data.scheduledTime}:00Z`;

                await api.put(`/leads/${lead.id}/status`, {
                  id: lead.id,
                  leadStatusId: statusId,
                  notes: `Auto-scheduled via AI Chatbot for ${data.selectedProjectName ?? data.selectedPropertyName}`,
                  IsNotesUpdated: true,
                  projectsList: [],
                  projectIds: null,
                  scheduledDate: scheduledDateTime,
                  meetingOrSiteVisit: meetingOrSiteVisit,
                  assignTo: lead.assignTo || '45abfce5-2746-42e6-bf66-ac7e00e75085',
                  secondaryUserId: '00000000-0000-0000-0000-000000000000'
                });
                logScheduling(data.leadName || 'Unknown', data.appointmentType, data.scheduledDate || '', data.scheduledTime || '');
              } catch (schedError) {
                console.error('[ChatInterface] Appointment creation failed:', schedError);
                // We don't fail the whole flow if only scheduling fails, as lead is already created
              }
            }

            setConvState({ flow: 'none', step: '', data: {} });
            appendBotMessage(
              `✅ **Success!**\n\nThanks **${data.leadName}**, I've shared your details with our team regarding **${data.selectedProjectName ?? data.selectedPropertyName}**.\n\n` +
              (data.appointmentType !== 'None'
                ? `They'll be prepared for your **${data.appointmentType}** on **${data.scheduledDate}** at **${data.scheduledTime}**.`
                : `They'll reach out to you shortly at **${data.leadPhone}**.`),
              ['View More Properties', 'Show Projects']
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
        appendBotMessage(getTranslation(language, 'searching_lead'), []);
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
        appendBotMessage(getTranslation(language, 'searching_lead'), []);
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

        appendBotMessage(`${getTranslation(language, 'checking_status')} **${selected.name}**...`, []);

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
          appendBotMessage('Back to main menu. What would you like to do?', ['🏠 Available Properties', '🏗️ Show Projects', '📅 Schedule Site Visit', '📞 Schedule Callback']);
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

          logScheduling(data.selectedLeadName || 'Unknown', appointmentType || 'Appointment', scheduledDate || '', scheduledTime || '');
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
        appendBotMessage(getTranslation(language, 'searching_lead'), []);
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

        appendBotMessage(`${getTranslation(language, 'checking_status')} **${selected.name}**...`, []);

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
        appendBotMessage(getTranslation(language, 'searching_lead'), []);
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

        appendBotMessage(`${getTranslation(language, 'checking_status')} **${selected.name}**...`, []);

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


      case 'property_interest': {
        const propertyName = text.replace(/interested:|\binterested in\b/i, '').trim();
        setConvState({
          flow: 'create_lead',
          step: 'get_name',
          data: { selectedProjectName: propertyName }
        });
        appendBotMessage(`Great choice! I'd love to help you with **${propertyName}**. May I know your name?`, ['❌ Cancel']);
        return;
      }


      // === ESCALATION ===
      case 'human_handoff_request':
        appendBotMessage(
          '🤝 **Connecting you with our team!**\n\n' +
          'A relationship manager will contact you shortly.\n' +
          'You can also reach our team directly.',
          ['📞 Call Sales Team', '🏠 Show Properties', '❌ Cancel']
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
          const { content, quickReplies, template, data, flowState: returnedFlowState } = await callLeadratAPI(intent, searchTerm, text_expanded, messages, language, tenantId, backendUrl, flowState);

          if (returnedFlowState) {
            setFlowState(returnedFlowState);
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === loadingId ? { ...msg, content, quickReplies, isLoading: false, data: data, template: template } : msg
            )
          );
        } catch {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === loadingId
                ? {
                    ...msg,
                    content: getTranslation(language, 'help_message'),
                    quickReplies: [
                      getTranslation(language, 'show_all_properties'),
                      getTranslation(language, 'show_all_projects'),
                      getTranslation(language, 'create_lead'),
                    ],
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
    // Handle go back action
    if (reply === '← Go Back' || reply === '← Go Back to Properties' || reply.includes('Go Back')) {
      handleGoBack();
      return;
    }

    // Handle filter expansion locally - inject filter chips inline
    if (reply === 'Filter results' || reply === 'Filter properties') {
      const filterChips = [
        '💰 Under 50 Lakhs',
        '💰 50L - 1 Cr',
        '💰 1 Cr - 2 Cr',
        '💰 Above 2 Cr',
        '🏠 1 BHK',
        '🏠 2 BHK',
        '🏠 3 BHK',
        '🏠 Villa',
        '📍 Dubai Marina',
        '📍 Downtown',
      ];
      setMessages((prev) => [
        ...prev,
        {
          id: `filter-${Date.now()}`,
          role: 'assistant',
          content: 'Choose a filter to refine your search:',
          quickReplies: filterChips,
          timestamp: new Date(),
        },
      ]);
      return;
    }

    if (reply === 'Show more' || reply === 'View more' || reply === 'Load more') {
      // Dispatch show_more structured action to backend
      handleShowMore();
      return;
    }

    // Map filter chip labels to clean search queries
    const filterMap: Record<string, string> = {
      '💰 Under 50 Lakhs': 'show properties under 50 lakhs',
      '💰 50L - 1 Cr': 'show properties between 50 lakhs and 1 crore',
      '💰 1 Cr - 2 Cr': 'show properties between 1 crore and 2 crore',
      '💰 Above 2 Cr': 'show properties above 2 crore',
      '🏠 1 BHK': 'show 1 BHK properties',
      '🏠 2 BHK': 'show 2 BHK properties',
      '🏠 3 BHK': 'show 3 BHK properties',
      '🏠 Villa': 'show villa properties',
      '📍 Dubai Marina': 'show properties in Dubai Marina',
      '📍 Downtown': 'show properties in Downtown',
    };

    if (filterMap[reply]) {
      handleSend(filterMap[reply]);
      return;
    }

    const params = QUICK_REPLY_PARAMS[reply];
    const messageToSend = params?.message || reply;
    handleSend(messageToSend);
  }

  async function handleGoBack() {
    const loadingId = Date.now().toString();

    setIsLoading(true);
    setMessages(prev => [...prev, {
      id: `bot-${loadingId}`,
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date()
    }]);

    try {
      const payload = {
        message: 'Go back',
        action: 'go_back',
        tenant_id: tenantId,
        flow_state: flowState
      };

      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const response = await res.json();
      const content = response?.response || 'Returning to property selection...';

      if (response.flow_state) setFlowState(response.flow_state);

      const dataItems = response?.data || [];
      const template = response?.template;
      let quickReplies = response?.metadata?.quickReplies || getQuickReplies('property');
      if (response?.metadata?.has_more) {
        quickReplies.push('Show more');
      }

      setMessages(prev => prev.map(m =>
        m.id === `bot-${loadingId}`
          ? { ...m, content, data: dataItems, template, quickReplies, isLoading: false }
          : m
      ));
    } catch (error) {
      setMessages(prev => prev.map(m =>
        m.id === `bot-${loadingId}`
          ? { ...m, content: "I'm sorry, I couldn't go back. Please try again.", isLoading: false }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleShowMore() {
    const loadingId = Date.now().toString();

    setIsLoading(true);
    setMessages(prev => [...prev, {
      id: `bot-${loadingId}`,
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date()
    }]);

    try {
      const payload = {
        message: 'Show more',
        action: 'show_more',
        tenant_id: tenantId,
        flow_state: flowState
      };

      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const response = await res.json();
      const content = response?.response || 'No more items to show';

      if (response.flow_state) setFlowState(response.flow_state);

      const dataItems = response?.data || [];
      const template = response?.template;
      let quickReplies = response?.metadata?.quickReplies || getQuickReplies('property');
      if (response?.metadata?.has_more) {
        quickReplies.push('Show more');
      }

      setMessages(prev => prev.map(m =>
        m.id === `bot-${loadingId}`
          ? { ...m, content, data: dataItems, template, quickReplies, isLoading: false }
          : m
      ));
    } catch (error) {
      setMessages(prev => prev.map(m =>
        m.id === `bot-${loadingId}`
          ? { ...m, content: "I'm sorry, I couldn't load more results. Please try again.", isLoading: false }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStructuredAction(action: string, item: any) {
    const loadingId = Date.now().toString();
    const itemName = item.name || item.title || 'this item';

    // Optimistically show user's action
    setMessages(prev => [...prev, {
      id: `user-${loadingId}`,
      role: 'user',
      content: `Interested in ${itemName}`,
      timestamp: new Date()
    }]);

    setIsLoading(true);
    setMessages(prev => [...prev, {
      id: `bot-${loadingId}`,
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date()
    }]);

    try {
      const payload = {
        message: `Interested in ${itemName}`,
        action: action,
        selectedItemId: item.id,
        selectedItemType: item.propertyType ? 'property' : 'project',
        selectedItemName: itemName,
        tenant_id: tenantId,
        flow_state: flowState
      };

      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const response = await res.json();
      const content = response?.response || response?.data?.response || '';

      if (response.flow_state) setFlowState(response.flow_state);

      setMessages(prev => prev.map(m =>
        m.id === `bot-${loadingId}`
          ? { ...m, content, quickReplies: response.quickReplies || [], isLoading: false }
          : m
      ));
    } catch (error) {
      setMessages(prev => prev.map(m =>
        m.id === `bot-${loadingId}`
          ? { ...m, content: "I'm sorry, I couldn't process that request. Please try again.", isLoading: false }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: embeddedMode ? '#ffffff' : 'hsl(220 25% 12%)',
        borderRadius: embeddedMode ? '0' : '1.5rem',
        border: embeddedMode ? 'none' : '1px solid hsl(195 85% 55% / 0.2)',
        overflow: 'hidden',
        boxShadow: embeddedMode ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
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
              REIA
            </h2>
            <p style={{ margin: 0, fontSize: '11px', color: 'hsl(195 85% 55%)', fontWeight: '500' }}>
              Real Estate CRM Assistant
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Status indicators hidden for chatbot-only mode */}
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
          background: embeddedMode ? '#ffffff' : undefined,
          color: embeddedMode ? '#1f2937' : undefined,
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
              {getTranslation(language, 'welcome_title')}
            </div>
            <p style={{
              color: embeddedMode ? '#4b5563' : 'hsl(220 10% 65%)',
              fontSize: '14px',
              margin: '0',
              maxWidth: '280px',
            }}>
              {getTranslation(language, 'welcome_desc')}
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              width: '100%',
              maxWidth: '320px',
            }}>
              {[
                '🏠 Available Properties',
                '🏗️ Show Projects',
                '📅 Schedule Site Visit',
                '📞 Schedule Callback',
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(action)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '1rem',
                    border: embeddedMode ? '1px solid #3b82f6' : '1px solid hsl(195 85% 55% / 0.4)',
                    background: embeddedMode ? '#dbeafe' : 'rgba(195, 100, 255, 0.08)',
                    color: embeddedMode ? '#0369a1' : 'hsl(195 85% 55%)',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: embeddedMode ? 'none' : 'blur(10px)',
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
          <div key={msg.id} style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: msg.quickReplies ? '8px' : '0',
                width: '100%',
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

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: (msg.data && msg.data.length > 0) ? 1 : 'initial',
                width: (msg.data && msg.data.length > 0) ? 'auto' : 'auto',
                maxWidth: (msg.data && msg.data.length > 0) ? 'calc(100% - 44px)' : '75%',
                minWidth: 0,
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div
                  style={{
                    backgroundColor: embeddedMode
                      ? (msg.role === 'user' ? '#e9d5ff' : '#dbeafe')
                      : (msg.role === 'user'
                        ? 'rgba(195, 100, 255, 0.15)'
                        : 'rgba(220, 40, 12%, 0.5)'),
                    border: `1px solid ${embeddedMode
                      ? (msg.role === 'user' ? '#c084fc' : '#7dd3fc')
                      : (msg.role === 'user'
                        ? 'hsl(270 60% 55% / 0.4)'
                        : 'hsl(195 85% 55% / 0.3)')}`,
                    backdropFilter: embeddedMode ? 'none' : 'blur(10px)',
                    borderRadius: '1rem',
                    padding: '12px 16px',
                    color: embeddedMode ? '#1f2937' : 'hsl(40 30% 95%)',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    boxShadow: embeddedMode
                      ? (msg.role === 'user' ? '0 2px 8px rgba(168, 85, 247, 0.1)' : '0 2px 8px rgba(59, 130, 246, 0.1)')
                      : (msg.role === 'user'
                        ? 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 0 15px hsl(270 60% 55% / 0.15)'
                        : 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 0 20px hsl(195 85% 55% / 0.2)'),
                    transition: 'all 0.3s ease',
                    width: 'fit-content',
                    maxWidth: '100%'
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
                      <span style={{ color: 'hsl(195 85% 55%)', fontSize: '12px' }}>{getTranslation(language, 'thinking')}</span>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>

                {/* Data Items Rendering */}
                {msg.role === 'assistant' && !msg.isLoading && msg.data && msg.data.length > 0 && (
                  <div style={{
                    marginTop: '12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                    gap: '14px',
                    width: '100%',
                    maxWidth: '100%',
                  }}>
                    {msg.data.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: embeddedMode ? '#ecf0f1' : 'rgba(6, 182, 212, 0.05)',
                          border: embeddedMode ? '1px solid #cbd5e0' : '1px solid rgba(6, 182, 212, 0.2)',
                          borderRadius: '1rem',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          justifyContent: 'space-between',
                          backdropFilter: 'blur(5px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                          if (embeddedMode) {
                            e.currentTarget.style.backgroundColor = '#e2e8f0';
                          } else {
                            e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (embeddedMode) {
                            e.currentTarget.style.backgroundColor = '#ecf0f1';
                          } else {
                            e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.05)';
                            e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                          }
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '700', color: embeddedMode ? '#1f2937' : 'hsl(195 85% 55%)', marginBottom: '8px', fontSize: '15px' }}>
                            {item.name || item.title || 'Item'}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                            {item.price && (
                              <div style={{ fontSize: '12px', color: embeddedMode ? '#059669' : 'hsl(40 100% 60%)', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                💰 {item.price}
                              </div>
                            )}
                            {item.propertyType && (
                              <div style={{ fontSize: '12px', color: embeddedMode ? '#4b5563' : 'hsl(270 60% 70%)', background: 'rgba(168, 85, 247, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                🏠 {item.propertyType}
                              </div>
                            )}
                          </div>
                          {item.location && (
                            <div style={{ fontSize: '12px', color: embeddedMode ? '#4b5563' : 'hsl(220 10% 75%)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              📍 {item.location}
                            </div>
                          )}
                          {item.status && (
                            <div style={{ fontSize: '11px', color: 'hsl(142 70% 45%)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                              {item.status}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStructuredAction('interest_selected', item); }}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, hsl(195 85% 55%), hsl(270 60% 55%))',
                              color: '#fff',
                              border: 'none',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            Interested
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStructuredAction('view_details', item); }}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: 'transparent',
                              color: embeddedMode ? '#4b5563' : 'hsl(195 85% 55%)',
                              border: '1px solid hsl(195 85% 55% / 0.4)',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                      border: embeddedMode ? '1px solid #3b82f6' : '1px solid hsl(195 85% 55% / 0.4)',
                      color: embeddedMode ? '#0369a1' : 'hsl(195 85% 55%)',
                      backgroundColor: embeddedMode ? '#dbeafe' : 'rgba(195, 100, 255, 0.08)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.5 : 1,
                      transition: 'all 0.3s ease',
                      fontWeight: '500',
                      backdropFilter: embeddedMode ? 'none' : 'blur(10px)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        if (embeddedMode) {
                          e.currentTarget.style.backgroundColor = '#bfdbfe';
                          e.currentTarget.style.borderColor = '#0284c7';
                        } else {
                          e.currentTarget.style.backgroundColor = 'rgba(195, 100, 255, 0.15)';
                          e.currentTarget.style.borderColor = 'hsl(195 85% 55% / 0.6)';
                        }
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = embeddedMode ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 4px 12px hsl(195 85% 55% / 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (embeddedMode) {
                        e.currentTarget.style.backgroundColor = '#dbeafe';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      } else {
                        e.currentTarget.style.backgroundColor = 'rgba(195, 100, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'hsl(195 85% 55% / 0.4)';
                      }
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
          borderTop: embeddedMode ? '1px solid #e5e7eb' : '1px solid hsl(195 85% 55% / 0.15)',
          background: embeddedMode ? '#ffffff' : 'rgba(220, 30% 6%, 0.7)',
          backdropFilter: embeddedMode ? 'none' : 'blur(10px)',
          display: 'flex',
          gap: '12px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={getTranslation(language, 'input_placeholder')}
          disabled={isLoading}
          style={{
            flex: 1,
            backgroundColor: embeddedMode ? '#f3f4f6' : 'rgba(220, 40, 12%, 0.4)',
            border: embeddedMode ? '1px solid #d1d5db' : '1px solid hsl(195 85% 55% / 0.3)',
            backdropFilter: embeddedMode ? 'none' : 'blur(10px)',
            borderRadius: '1rem',
            padding: '12px 16px',
            color: '#000000',
            fontSize: '13px',
            outline: 'none',
            transition: 'all 0.3s ease',
            opacity: isLoading ? 0.6 : 1,
            boxShadow: embeddedMode ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'inset 0 1px 2px rgba(255, 255, 255, 0.1)',
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
