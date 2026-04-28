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
  flow: 'none' | 'create_lead' | 'update_status' | 'schedule_visit';
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
  };
}

const INTENT_PATTERNS = {
  lead: ['lead', 'leads', 'enquiry', 'inquiry', 'customer', 'contact', 'hot lead', 'new lead', 'follow up', 'prospect', 'potential'],
  property: ['property', 'properties', 'flat', 'apartment', '2bhk', '3bhk', 'bhk', 'unit', 'available', 'inventory', 'sqft', 'carpet area', 'residential', 'commercial', 'plot', 'land', 'villa', 'house', 'penthouse'],
  project: ['project', 'projects', 'tower', 'block', 'phase', 'rera', 'possession', 'launch', 'development', 'builder', 'developer', 'complex', 'society', 'community'],
  visit: ['visit', 'site visit', 'meeting', 'schedule', 'appointment', 'callback', 'book a visit', 'site see', 'tour', 'show', 'walkthrough'],
  budget: ['price', 'cost', 'budget', 'rate', 'amount', 'range', 'affordable', 'expensive', 'discount', 'offer', 'deal'],
  status: ['mark done', 'mark complete', 'completed', 'site visit done', 'visit done', 'visit completed', 'meeting done', 'callback done', 'not done', 'no show', 'missed visit', 'missed call', 'update status', 'change status', 'lead status', 'mark visited', 'visited', 'site done'],
  analytics: ['how many', 'total', 'count', 'analytics', 'report', 'conversion', 'performance', 'stats', 'metric', 'trend'],
};

function detectIntent(message: string): string {
  const lower = message.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return intent;
    }
  }
  return 'general';
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
  'Daily report': { message: 'Show daily analytics report' },
  'Weekly summary': { message: 'Show weekly summary' },
  'Monthly metrics': { message: 'Show monthly metrics' },
  'Export report': { message: 'Export analytics report' },
  'Show leads': { message: 'Show all leads' },
  'Find property': { message: 'Find properties' },
  'View projects': { message: 'View all projects' },
};

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

    const response = await fastApiClient.post('/api/v1/chat/message', requestPayload);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function appendBotMessage(content: string, quickReplies: string[] = []) {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
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
            const response = await api.post('/api/v1/leads', {
              name: data.leadName,
              contactNo: data.leadPhone,
              alternateContactNo: '',
              projectInterest: data.selectedProjectName ?? data.selectedPropertyName,
              source: 'AI Assistant'
            });
            const lead = response.data?.data;
            setConvState({ flow: 'none', step: '', data: {} });
            appendBotMessage(
              `✅ **Lead Created Successfully!**\n\n` +
              `👤 ${data.leadName} has been added to Leadrat CRM.\n` +
              `📞 Phone: ${data.leadPhone}\n` +
              `🏠 Interest: ${data.selectedPropertyName ?? data.selectedProjectName}`,
              ['Schedule Site Visit', 'View All Leads', 'Create Another Lead']
            );
          } catch (error) {
            appendBotMessage(
              '❌ Failed to create lead. Please try again or add manually in Leadrat.',
              ['Try Again', 'Show Leads']
            );
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
          const res = await api.get('/api/v1/leads', {
            params: { search: text, page: 0, size: 5 }
          });
          const leads = res.data?.content || [];
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
              `Select: ${l.name ?? 'Unknown'} - ${l.phone ?? l.contactNo ?? ''}`
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
          `${l.name ?? ''} - ${l.phone ?? l.contactNo ?? ''}`.includes(leadInfo.split(' - ')[0].trim())
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
          const statusRes = await api.get('/api/v1/leads/statuses');
          const statuses = statusRes.data?.data ?? [];

          const activityMap: Record<string, string[]> = {
            '✅ Site Visit Done': ['site visit', 'visited', 'visit done', 'visit completed'],
            '❌ Site Visit Not Done': ['site visit', 'not', 'missed', 'no show'],
            '✅ Meeting Done': ['meeting', 'done', 'completed', 'met'],
            '❌ Meeting Not Done': ['meeting', 'not', 'missed', 'rescheduled'],
            '✅ Callback Done': ['callback', 'called', 'done', 'connected'],
            '❌ Callback Not Done': ['callback', 'not', 'no answer', 'missed'],
          };

          const keywords = activityMap[text] ?? [];
          const matchedStatus = statuses.find((s: any) =>
            keywords.every(kw =>
              s.name.toLowerCase().includes(kw.toLowerCase())
            )
          ) ?? statuses.find((s: any) =>
            keywords[0] && s.name.toLowerCase().includes(keywords[0])
          );

          if (!matchedStatus) {
            appendBotMessage(
              `Could not auto-match status. Please select from Leadrat statuses:`,
              statuses.slice(0, 8).map((s: any) =>
                `Status: ${s.name}`
              ).concat(['❌ Cancel'])
            );
            setConvState(prev => ({
              ...prev,
              step: 'manual_status',
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

      case 'confirm_status': {
        if (text !== '✅ Update Status') return;
        appendBotMessage('Updating lead status in Leadrat...', []);
        try {
          await api.put(`/api/v1/leads/${data.leadId}/status`, {
            id: data.leadId,
            leadStatusId: data.statusId,
            assignTo: ''
          });
          setConvState({ flow: 'none', step: '', data: {} });
          appendBotMessage(
            `✅ **Status Updated Successfully!**\n\n` +
            `👤 Lead: ${data.leadName}\n` +
            `📋 New Status: ${data.statusName}\n` +
            `✓ Updated in Leadrat CRM`,
            ['Update Another Lead', 'Show All Leads', 'Schedule Visit']
          );
        } catch {
          appendBotMessage(
            '❌ Failed to update status. Please try again.',
            ['Try Again', '❌ Cancel']
          );
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

    // Detect status update intent
    const statusKeywords = [
      'mark done', 'mark complete', 'site visit done',
      'meeting done', 'callback done', 'not done',
      'no show', 'missed', 'update status', 'visited'
    ];
    if (statusKeywords.some(kw => text.toLowerCase().includes(kw))) {
      setConvState({ flow: 'update_status', step: 'get_lead', data: {} });
      appendBotMessage(
        'Which lead do you want to update?\nEnter the lead name or phone number:',
        ['❌ Cancel']
      );
      return;
    }

    // Handle property/project selection for lead creation
    if (text.startsWith('Interested:') || text.startsWith('Interested in')) {
      const propertyName = text.replace(/^Interested:?\s*/i, '').trim();
      setConvState({
        flow: 'create_lead',
        step: 'get_name',
        data: { selectedPropertyName: propertyName }
      });
      appendBotMessage(
        `Great choice! 🏠 **${propertyName}**\n\nLet me create an enquiry.\nWhat is the customer's name?`,
        ['❌ Cancel']
      );
      return;
    }

    // Normal intent detection
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
      const intent = detectIntent(text_expanded);
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
                content: 'Something went wrong. Please try again.',
                quickReplies: ['Try again', 'Show all leads'],
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
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
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
          backgroundColor: '#1e293b',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            animation: 'pulse 2s infinite',
          }}
        />
        <span style={{ fontWeight: '600', color: '#ffffff', fontSize: '14px' }}>AI Assistant</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(226, 232, 240, 0.5)' }}>Online</span>
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
                  backgroundColor: msg.role === 'user' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.2)'}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.isLoading ? (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: '#06b6d4' }} />
                    <span style={{ color: 'rgba(226, 232, 240, 0.7)' }}>AI is thinking...</span>
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
                {msg.quickReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleQuickReply(reply)}
                    disabled={isLoading}
                    style={{
                      fontSize: '11px',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1px solid rgba(6, 182, 212, 0.5)',
                      color: '#06b6d4',
                      backgroundColor: 'transparent',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.8)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
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
          borderTop: '1px solid rgba(6, 182, 212, 0.2)',
          backgroundColor: '#1e293b',
          display: 'flex',
          gap: '12px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask me anything about your real estate business..."
          disabled={isLoading}
          style={{
            flex: 1,
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: '12px',
            padding: '10px 14px',
            color: '#ffffff',
            fontSize: '13px',
            outline: 'none',
            transition: 'all 0.2s',
            opacity: isLoading ? 0.6 : 1,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.2)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
            e.currentTarget.style.boxShadow = 'none';
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
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            border: 'none',
            borderRadius: '12px',
            color: '#ffffff',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !input.trim() ? 0.5 : 1,
            transition: 'all 0.3s',
            boxShadow: '0 10px 30px rgba(6, 182, 212, 0.3)',
          }}
          onMouseEnter={(e) => {
            if (!isLoading && input.trim()) {
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(6, 182, 212, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.3)';
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
      `}</style>
    </div>
  );
}
