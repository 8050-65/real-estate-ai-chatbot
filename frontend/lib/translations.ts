// Simple translation system for multilingual UI
export const translations: Record<string, Record<string, string>> = {
  en: {
    // Welcome
    welcome_title: "Welcome to REIA",
    welcome_subtitle: "Your AI Real Estate Assistant",
    welcome_desc: "Ask me anything about properties, leads, and real estate business.",

    // Input
    input_placeholder: "Ask about properties, leads, or schedule meetings...",
    send_button: "Send",

    // Action Buttons
    search_leads: "🔍 Search Leads",
    find_properties: "🏢 Find Properties",
    schedule_visit: "📅 Schedule Visit",
    book_callback: "📞 Book Callback",

    // Templates
    template_leads: "Show me leads",
    template_properties: "Find properties",
    template_schedule: "Schedule appointment",
    template_insights: "Get insights",

    // Status messages
    online: "Online",
    leadrat_connected: "Leadrat Connected",
    analyzing: "Analyzing...",
    processing: "Processing your request...",
    thinking: "thinking...",
    searching_lead: "Searching for lead...",
    checking_status: "Checking status for",
    creating_lead: "Creating lead in Leadrat CRM...",
    updating_status: "Updating lead status in Leadrat...",
    scheduling_appointment: "Scheduling appointment in Leadrat CRM...",
    no_leads_found: "No leads found",
    failed_search: "Failed to search leads",

    // Flow messages
    create_new_lead: "Let me create a new lead!",
    customer_name_prompt: "What is the customer's name?",
    phone_number_prompt: "What is the phone number?",
    valid_phone_required: "Please enter a valid 10-digit phone number.",
    confirm_lead_details: "Please confirm the enquiry details:",
    confirm_create_lead: "Shall I create this lead in Leadrat CRM?",
    lead_created_success: "Lead Created Successfully!",
    help_message: "I'm here to help! Ask me about leads, properties, projects, or scheduling visits.",
    im_here_to_help: "Hello! I'm your AI Real Estate Assistant.",

    // Buttons
    confirm: "Confirm",
    cancel: "Cancel",
    create_lead: "Create Lead",
    ask_ai: "Ask AI",
    show_all_properties: "Show All Properties",
    show_all_projects: "Show All Projects",

    // Messages
    no_results: "No results found",
    error_occurred: "An error occurred",
    success: "Success!",
  },

  hi: {
    welcome_title: "REIA में आपका स्वागत है",
    welcome_subtitle: "आपका AI रियल एस्टेट सहायक",
    welcome_desc: "मुझसे संपत्तियों, लीड्स और रियल एस्टेट व्यवसाय के बारे में कुछ भी पूछें।",

    input_placeholder: "संपत्तियों, लीड्स या मीटिंग शेड्यूल के बारे में पूछें...",
    send_button: "भेजें",

    search_leads: "🔍 लीड्स खोजें",
    find_properties: "🏢 संपत्तियां खोजें",
    schedule_visit: "📅 साइट विजिट शेड्यूल करें",
    book_callback: "📞 कॉलबैक बुक करें",

    template_leads: "लीड्स दिखाएं",
    template_properties: "संपत्तियां खोजें",
    template_schedule: "अपॉइंटमेंट शेड्यूल करें",
    template_insights: "इनसाइट्स प्राप्त करें",

    online: "ऑनलाइन",
    leadrat_connected: "लीडरैट जुड़ा हुआ",
    analyzing: "विश्लेषण जारी है...",
    processing: "आपके अनुरोध को संसाधित किया जा रहा है...",
    thinking: "सोच रहा है...",
    searching_lead: "लीड खोज रहा है...",
    checking_status: "के लिए स्थिति जांच रहा है",
    creating_lead: "Leadrat CRM में लीड बना रहा है...",
    updating_status: "Leadrat में लीड स्थिति अपडेट कर रहा है...",
    scheduling_appointment: "Leadrat CRM में अपॉइंटमेंट शेड्यूल कर रहा है...",
    no_leads_found: "कोई लीड नहीं मिला",
    failed_search: "लीड खोजने में विफल रहा",

    create_new_lead: "मुझे एक नई लीड बनाने दें!",
    customer_name_prompt: "ग्राहक का नाम क्या है?",
    phone_number_prompt: "फोन नंबर क्या है?",
    valid_phone_required: "कृपया 10 अंकों का वैध फोन नंबर दर्ज करें।",
    confirm_lead_details: "कृपया अनुसूची विवरण की पुष्टि करें:",
    confirm_create_lead: "क्या मैं इस लीड को Leadrat CRM में बनाऊं?",
    lead_created_success: "लीड सफलतापूर्वक बनाई गई!",
    help_message: "मैं यहाँ मदद करने के लिए हूँ! मुझसे लीड्स, संपत्तियों, प्रोजेक्ट्स या शेड्यूलिंग के बारे में पूछें।",
    im_here_to_help: "नमस्ते! मैं आपका AI रियल एस्टेट सहायक हूँ।",

    confirm: "पुष्टि करें",
    cancel: "रद्द करें",
    create_lead: "लीड बनाएं",
    ask_ai: "AI से पूछें",
    show_all_properties: "सभी संपत्तियां दिखाएं",
    show_all_projects: "सभी परियोजनाएं दिखाएं",

    no_results: "कोई परिणाम नहीं मिला",
    error_occurred: "एक त्रुटि हुई",
    success: "सफल!",
  },

  kn: {
    welcome_title: "REIA ಗೆ ಸ್ವಾಗತ",
    welcome_subtitle: "ನಿಮ್ಮ AI ರಿಯಲ್ ಎಸ್ಟೇಟ್ ಸಹಾಯಕ",
    welcome_desc: "ಆಸ್ತಿ, ಲೀಡ್‌ಗಳು ಮತ್ತು ರಿಯಲ್ ಎಸ್ಟೇಟ್ ವ್ಯವಸಾಯ ಬಗ್ಗೆ ನನ್ನನ್ನು ಏನೂ ಕೇಳಿ.",

    input_placeholder: "ಆಸ್ತಿ, ಲೀಡ್‌ಗಳು ಅಥವಾ ಮೀಟಿಂಗ್ ಶೆಡ್ಯೂಲ್ ಬಗ್ಗೆ ಕೇಳಿ...",
    send_button: "ಕಳುಹಿಸು",

    search_leads: "🔍 ಲೀಡ್‌ಗಳನ್ನು ಹುಡುಕಿ",
    find_properties: "🏢 ಆಸ್ತಿ ಹುಡುಕಿ",
    schedule_visit: "📅 ಸೈಟ್ ಭೇಟಿ ಶೆಡ್ಯೂಲ್ ಮಾಡಿ",
    book_callback: "📞 ಕಾಲ್‌ಬ್ಯಾಕ್ ಬುಕ್ ಮಾಡಿ",

    template_leads: "ಲೀಡ್‌ಗಳನ್ನು ತೋರಿಸು",
    template_properties: "ಆಸ್ತಿ ಹುಡುಕಿ",
    template_schedule: "ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಶೆಡ್ಯೂಲ್ ಮಾಡು",
    template_insights: "ಒಳನೋಟಗಳನ್ನು ಪಡೆಯಿರಿ",

    online: "ಆನ್‌ಲೈನ್",
    leadrat_connected: "ಲೀಡ್‌ರ್ಯಾಟ್ ಸಂಪರ್ಕಿತ",
    analyzing: "ವಿಶ್ಲೇಷಣ ಜಾರಿಯಲ್ಲಿದೆ...",
    processing: "ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...",
    thinking: "ಯೋಚಿಸುತ್ತಿದೆ...",
    searching_lead: "ಲೀಡ್ ಹುಡುಕುತ್ತಿದೆ...",
    checking_status: "ಗೆ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸುತ್ತಿದೆ",
    creating_lead: "Leadrat CRM ನಲ್ಲಿ ಲೀಡ್ ರಚಿಸುತ್ತಿದೆ...",
    updating_status: "Leadrat ನಲ್ಲಿ ಲೀಡ್ ಸ್ಥಿತಿ ಅಪ್‌ಡೇಟ್ ಮಾಡುತ್ತಿದೆ...",
    scheduling_appointment: "Leadrat CRM ನಲ್ಲಿ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಶೆಡ್ಯೂಲ್ ಮಾಡುತ್ತಿದೆ...",
    no_leads_found: "ಯಾವುದೇ ಲೀಡ್ ಕಂಡುಬಂದಿಲ್ಲ",
    failed_search: "ಲೀಡ್ ಹುಡುಕಲು ವಿಫಲವಾಯಿತು",

    create_new_lead: "ನನ್ನನ್ನು ಹೊಸ ಲೀಡ್ ರಚಿಸಲು ನಿಮ್ಮನ್ನು ಬಿಡಿ!",
    customer_name_prompt: "ಗ್ರಾಹಕರ ಹೆಸರು ಏನು?",
    phone_number_prompt: "ಫೋನ್ ಸಂಖ್ಯೆ ಏನು?",
    valid_phone_required: "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 10-ಅಂಕಿ ಫೋನ್ ಸಂಖ್ಯೆ ನಿರ್ವಹಿಸಿ.",
    confirm_lead_details: "ದಯವಿಟ್ಟು ವಿಚಾರಣೆ ವಿವರಗಳನ್ನು ಖಚಿತಪಡಿಸಿ:",
    confirm_create_lead: "ನಾನು ಈ ಲೀಡ್ ಅನ್ನು Leadrat CRM ನಲ್ಲಿ ರಚಿಸಬೇಕೇ?",
    lead_created_success: "ಲೀಡ್ ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಯಿತು!",
    help_message: "ನಾನು ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೆ! ಲೀಡ್‌ಗಳು, ಆಸ್ತಿಗಳು, ಯೋಜನೆಗಳು ಅಥವಾ ಶೆಡ್ಯೂಲಿಂಗ್ ಬಗ್ಗೆ ನನ್ನನ್ನು ಕೇಳಿ.",
    im_here_to_help: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ರಿಯಲ್ ಎಸ್ಟೇಟ್ ಸಹಾಯಕ.",

    confirm: "ಖಚಿತಪಡಿಸಿ",
    cancel: "ರದ್ದುಮಾಡಿ",
    create_lead: "ಲೀಡ್ ರಚಿಸಿ",
    ask_ai: "AI ನನ್ನನ್ನು ಕೇಳಿ",
    show_all_properties: "ಎಲ್ಲಾ ಆಸ್ತಿಗಳನ್ನು ತೋರಿಸು",
    show_all_projects: "ಎಲ್ಲಾ ಯೋಜನೆಗಳನ್ನು ತೋರಿಸು",

    no_results: "ಫಲಿತಾಂಶಗಳನ್ನು ಕಂಡುಹಿಡಿಯಲಾಗಲಿಲ್ಲ",
    error_occurred: "ಒಂದು ದೋಷ ಸಂಭವಿಸಿದೆ",
    success: "ಯಶಸ್ವಿ!",
  },

  ta: {
    welcome_title: "REIA க்கு வரவேற்கிறோம்",
    welcome_subtitle: "உங்கள் AI ரியல் எஸ்டேட் உதவியாளர்",
    welcome_desc: "சম்பத்து, லீடுகள் மற்றும் ரியல் எஸ்டேட் வணிகம் பற்றி என்னிடம் எதையும் கேளுங்கள்.",

    input_placeholder: "சம்பத்து, லீடுகள் அல்லது சந்திப்பு நிர்ணயிக்க பற்றி கேளுங்கள்...",
    send_button: "அனுப்பு",

    search_leads: "🔍 லீடுகளைத் தேடு",
    find_properties: "🏢 சம்பத்தை தேடு",
    schedule_visit: "📅 தளம் பார்வையை நிர்ணயம் செய்",
    book_callback: "📞 கால்பேக்கை புக் செய்",

    template_leads: "லீடுகளைக் காட்டு",
    template_properties: "சம்பத்தை தேடு",
    template_schedule: "சந்திப்பை நிர்ணயம் செய்",
    template_insights: "நுண்ணறிவு பெறு",

    online: "ஆன்லைன்",
    leadrat_connected: "லீடரேட் இணைக்கப்பட்டுள்ளது",
    analyzing: "பகுப்பாய்வு செய்யப்படுகிறது...",
    processing: "உங்கள் கோரிக்கை செயல்படுத்தப்படுகிறது...",

    thinking: "சிந்திக்கிறது...",
    searching_lead: "லீடை தேடுகிறது...",
    checking_status: "க்கு நிலைமையை சரிபார்க்கிறது",

    confirm: "உறுதிப்படுத்து",
    cancel: "ரத்துசெய்",
    create_lead: "லீடை உருவாக்கு",
    ask_ai: "AI ஐக் கேள்",
    show_all_properties: "அனைத்து சம்பத்தையும் காட்டு",
    show_all_projects: "அனைத்து கட்ட இட்டைக்கும் காட்டு",

    no_results: "முடிவுகள் கண்டுபிடிக்கப்படவில்லை",
    error_occurred: "ஒரு பிழை ஏற்பட்டது",
    success: "வெற்றி!",
  },

  te: {
    welcome_title: "REIA కు స్వాగతం",
    welcome_subtitle: "మీ AI రియల్ ఎస్టేట్ సహాయకుడు",
    welcome_desc: "సম్పత్తి, లీడ్‌లు మరియు రియల్ ఎస్టేట్ వ్యాపారం గురించి నన్ను ఏదైనా అడగండి.",

    input_placeholder: "సంపత్తి, లీడ్‌లు లేదా సమావేశాలను షెడ్యూల్ చేయడం గురించి అడగండి...",
    send_button: "పంపించు",

    search_leads: "🔍 లీడ్‌లను చెందు",
    find_properties: "🏢 ఆస్తి కనుగొనండి",
    schedule_visit: "📅 సైట్ సందర్శన షెడ్యూల్ చేయండి",
    book_callback: "📞 కాల్‌బ్యాక్ బుక్ చేయండి",

    template_leads: "లీడ్‌లను చూపించు",
    template_properties: "ఆస్తి కనుగొనండి",
    template_schedule: "నియామకం షెడ్యూల్ చేయండి",
    template_insights: "అంతర్దృష్టిని పొందండి",

    online: "ఆన్‌లైన్",
    leadrat_connected: "లీడ్‌రాట్ అనుసంధానించబడినది",
    analyzing: "విశ్లేషణ జరుగుతుంది...",
    processing: "మీ అభ్యర్థన ప్రక్రియ చేయబడుతుంది...",

    thinking: "ఆలోచిస్తోంది...",
    searching_lead: "లీడ్‌ను చెందుతోంది...",
    checking_status: "కి స్థితిని తనిఖీ చేస్తోంది",

    confirm: "ఖచ్చితం చేయండి",
    cancel: "రద్దుచేయండి",
    create_lead: "లీడ్ సృష్టించండి",
    ask_ai: "AI ని అడగండి",
    show_all_properties: "అన్ని ఆస్తులను చూపించండి",
    show_all_projects: "అన్ని ప్రాజెక్టులను చూపించండి",

    no_results: "ఫలితాలు కనుగొనబడలేదు",
    error_occurred: "ఒక లోపం సంభవించింది",
    success: "విజయం!",
  },

  bn: {
    welcome_title: "REIA এ স্বাগতম",
    welcome_subtitle: "আপনার AI রিয়েল এস্টেট সহায়ক",
    welcome_desc: "সম্পত্তি, লিড এবং রিয়েল এস্টেট ব্যবসা সম্পর্কে আমাকে যেকোনো প্রশ্ন জিজ্ঞাসা করুন।",

    input_placeholder: "সম্পত্তি, লিড বা সভা নির্ধারণ সম্পর্কে জিজ্ঞাসা করুন...",
    send_button: "পাঠান",

    search_leads: "🔍 লিড খুঁজুন",
    find_properties: "🏢 সম্পত্তি খুঁজুন",
    schedule_visit: "📅 সাইট পরিদর্শন নির্ধারণ করুন",
    book_callback: "📞 কলব্যাক বুক করুন",

    template_leads: "লিড দেখান",
    template_properties: "সম্পত্তি খুঁজুন",
    template_schedule: "অ্যাপয়েন্টমেন্ট নির্ধারণ করুন",
    template_insights: "অন্তর্দৃষ্টি পান",

    online: "অনলাইন",
    leadrat_connected: "লিডরেট সংযুক্ত",
    analyzing: "বিশ্লেষণ চলছে...",
    processing: "আপনার অনুরোধ প্রক্রিয়া করা হচ্ছে...",

    thinking: "চিন্তা করছে...",
    searching_lead: "লিড খুঁজছে...",
    checking_status: "এর জন্য অবস্থা পরীক্ষা করছে",

    confirm: "নিশ্চিত করুন",
    cancel: "বাতিল করুন",
    create_lead: "লিড তৈরি করুন",
    ask_ai: "AI কে জিজ্ঞাসা করুন",
    show_all_properties: "সমস্ত সম্পত্তি দেখান",
    show_all_projects: "সমস্ত প্রকল্প দেখান",

    no_results: "কোনো ফলাফল পাওয়া যায়নি",
    error_occurred: "একটি ত্রুটি ঘটেছে",
    success: "সফল!",
  },

  ur: {
    welcome_title: "REIA میں خوش آمدید",
    welcome_subtitle: "آپ کا AI Real Estate معاون",
    welcome_desc: "مجھ سے جائیداد، لیڈز اور ریئل اسٹیٹ کاروبار کے بارے میں کچھ بھی پوچھیں۔",

    input_placeholder: "جائیداد، لیڈز یا میٹنگ شیڈول کے بارے میں پوچھیں...",
    send_button: "بھیجیں",

    search_leads: "🔍 لیڈز تلاش کریں",
    find_properties: "🏢 جائیداد تلاش کریں",
    schedule_visit: "📅 سائٹ کی زیارت شیڈول کریں",
    book_callback: "📞 کال بیک بک کریں",

    template_leads: "لیڈز دیکھائیں",
    template_properties: "جائیداد تلاش کریں",
    template_schedule: "ملاقات کا شیڈول بنائیں",
    template_insights: "بصیرتیں حاصل کریں",

    online: "آن لائن",
    leadrat_connected: "Leadrat منسلک",
    analyzing: "تجزیہ جاری ہے...",
    processing: "آپ کی درخواست پر کارعمل ہو رہا ہے...",

    thinking: "سوچ رہا ہے...",
    searching_lead: "لیڈ تلاش کر رہا ہے...",
    checking_status: "کے لیے حالت چیک کر رہا ہے",

    confirm: "تصدیق کریں",
    cancel: "منسوخ کریں",
    create_lead: "لیڈ بنائیں",
    ask_ai: "AI سے پوچھیں",
    show_all_properties: "تمام جائیدادیں دیکھائیں",
    show_all_projects: "تمام منصوبے دیکھائیں",

    no_results: "کوئی نتائج نہیں ملے",
    error_occurred: "ایک خرابی واقع ہوگئی",
    success: "کامیاب!",
  },

  fr: {
    welcome_title: "Bienvenue à REIA",
    welcome_subtitle: "Votre assistant IA Immobilier",
    welcome_desc: "Posez-moi n'importe quelle question sur les propriétés, les prospects et le secteur immobilier.",

    input_placeholder: "Posez des questions sur les propriétés, les prospects ou les réunions à planifier...",
    send_button: "Envoyer",

    search_leads: "🔍 Chercher les prospects",
    find_properties: "🏢 Trouver une propriété",
    schedule_visit: "📅 Planifier une visite",
    book_callback: "📞 Réserver un rappel",

    template_leads: "Afficher les prospects",
    template_properties: "Trouver une propriété",
    template_schedule: "Planifier un rendez-vous",
    template_insights: "Obtenir des informations",

    online: "En ligne",
    leadrat_connected: "Leadrat connecté",
    analyzing: "Analyse en cours...",
    processing: "Traitement de votre demande...",

    thinking: "réfléchir...",
    searching_lead: "Recherche de prospect...",
    checking_status: "Vérification du statut de",

    confirm: "Confirmer",
    cancel: "Annuler",
    create_lead: "Créer un prospect",
    ask_ai: "Demander à l'IA",
    show_all_properties: "Afficher tous les biens",
    show_all_projects: "Afficher tous les projets",

    no_results: "Aucun résultat trouvé",
    error_occurred: "Une erreur s'est produite",
    success: "Succès!",
  },

  ar: {
    welcome_title: "مرحبا بك في REIA",
    welcome_subtitle: "مساعدك الذكي في العقارات",
    welcome_desc: "اسأني أي شيء عن العقارات والعملاء والأعمال العقارية.",

    input_placeholder: "اسأل عن العقارات أو العملاء أو جدولة الاجتماعات...",
    send_button: "إرسال",

    search_leads: "🔍 البحث عن العملاء",
    find_properties: "🏢 البحث عن العقارات",
    schedule_visit: "📅 جدولة الزيارة",
    book_callback: "📞 حجز المكالمة",

    template_leads: "عرض العملاء",
    template_properties: "البحث عن العقارات",
    template_schedule: "جدولة الموعد",
    template_insights: "الحصول على البيانات",

    online: "متصل",
    leadrat_connected: "Leadrat متصل",
    analyzing: "جاري التحليل...",
    processing: "جاري معالجة طلبك...",

    thinking: "التفكير...",
    searching_lead: "البحث عن العميل...",
    checking_status: "فحص الحالة لـ",
    creating_lead: "إنشاء عميل في Leadrat CRM...",
    updating_status: "تحديث حالة العميل في Leadrat...",
    scheduling_appointment: "جدولة الموعد في Leadrat CRM...",
    no_leads_found: "لم يتم العثور على عملاء",
    failed_search: "فشل البحث عن العملاء",

    create_new_lead: "اسمح لي بإنشاء عميل جديد!",
    customer_name_prompt: "ما اسم العميل؟",
    phone_number_prompt: "ما رقم الهاتف؟",
    valid_phone_required: "يرجى إدخال رقم هاتف صحيح مكون من 10 أرقام.",
    confirm_lead_details: "يرجى تأكيد تفاصيل الاستفسار:",
    confirm_create_lead: "هل تريد مني إنشاء هذا العميل في Leadrat CRM؟",
    lead_created_success: "تم إنشاء العميل بنجاح!",
    help_message: "أنا هنا لمساعدتك! اسأني عن العملاء أو العقارات أو المشاريع أو جدولة الزيارات.",
    im_here_to_help: "مرحبا! أنا مساعدك الذكي في العقارات.",

    show_all_properties: "عرض جميع العقارات",
    show_all_projects: "عرض جميع المشاريع",

    confirm: "تأكيد",
    cancel: "إلغاء",
    create_lead: "إنشاء عميل",
    ask_ai: "اسأل الذكاء الاصطناعي",

    no_results: "لم يتم العثور على نتائج",
    error_occurred: "حدث خطأ",
    success: "نجاح!",
  },

  es: {
    welcome_title: "Bienvenido a REIA",
    welcome_subtitle: "Tu Asistente de Inteligencia Artificial Inmobiliaria",
    welcome_desc: "Pregúntame cualquier cosa sobre propiedades, clientes y negocios inmobiliarios.",

    input_placeholder: "Pregunta sobre propiedades, clientes o programación de reuniones...",
    send_button: "Enviar",

    search_leads: "🔍 Buscar Clientes",
    find_properties: "🏢 Buscar Propiedades",
    schedule_visit: "📅 Programar Visita",
    book_callback: "📞 Programar Llamada",

    template_leads: "Mostrar Clientes",
    template_properties: "Buscar Propiedades",
    template_schedule: "Programar Cita",
    template_insights: "Obtener Perspectivas",

    online: "En línea",
    leadrat_connected: "Leadrat Conectado",
    analyzing: "Analizando...",
    processing: "Procesando tu solicitud...",

    thinking: "pensando...",
    searching_lead: "Buscando cliente...",
    checking_status: "Verificando estado de",
    creating_lead: "Creando cliente en Leadrat CRM...",
    updating_status: "Actualizando estado del cliente en Leadrat...",
    scheduling_appointment: "Programando cita en Leadrat CRM...",
    no_leads_found: "No se encontraron clientes",
    failed_search: "Falló la búsqueda de clientes",

    create_new_lead: "¡Déjame crear un nuevo cliente!",
    customer_name_prompt: "¿Cuál es el nombre del cliente?",
    phone_number_prompt: "¿Cuál es el número de teléfono?",
    valid_phone_required: "Ingrese un número de teléfono válido de 10 dígitos.",
    confirm_lead_details: "Confirme los detalles de la consulta:",
    confirm_create_lead: "¿Debo crear este cliente en Leadrat CRM?",
    lead_created_success: "¡Cliente creado exitosamente!",
    help_message: "¡Estoy aquí para ayudarte! Pregúntame sobre clientes, propiedades, proyectos o programación de visitas.",
    im_here_to_help: "¡Hola! Soy tu Asistente de Inteligencia Artificial Inmobiliaria.",

    show_all_properties: "Mostrar Todas las Propiedades",
    show_all_projects: "Mostrar Todos los Proyectos",

    confirm: "Confirmar",
    cancel: "Cancelar",
    create_lead: "Crear Cliente",
    ask_ai: "Preguntar a la IA",

    no_results: "No se encontraron resultados",
    error_occurred: "Ocurrió un error",
    success: "¡Éxito!",
  },

  pt: {
    welcome_title: "Bem-vindo ao REIA",
    welcome_subtitle: "Seu Assistente de IA Imobiliária",
    welcome_desc: "Pergunte-me qualquer coisa sobre imóveis, clientes e negócios imobiliários.",

    input_placeholder: "Pergunte sobre imóveis, clientes ou agendamento de reuniões...",
    send_button: "Enviar",

    search_leads: "🔍 Buscar Clientes",
    find_properties: "🏢 Encontrar Imóveis",
    schedule_visit: "📅 Agendar Visita",
    book_callback: "📞 Agendar Chamada",

    template_leads: "Mostrar Clientes",
    template_properties: "Encontrar Imóveis",
    template_schedule: "Agendar Consulta",
    template_insights: "Obter Informações",

    online: "Online",
    leadrat_connected: "Leadrat Conectado",
    analyzing: "Analisando...",
    processing: "Processando sua solicitação...",

    thinking: "pensando...",
    searching_lead: "Procurando cliente...",
    checking_status: "Verificando status de",
    creating_lead: "Criando cliente em Leadrat CRM...",
    updating_status: "Atualizando status do cliente em Leadrat...",
    scheduling_appointment: "Agendando consulta em Leadrat CRM...",
    no_leads_found: "Nenhum cliente encontrado",
    failed_search: "Falha na busca de clientes",

    create_new_lead: "Deixe-me criar um novo cliente!",
    customer_name_prompt: "Qual é o nome do cliente?",
    phone_number_prompt: "Qual é o número de telefone?",
    valid_phone_required: "Digite um número de telefone válido com 10 dígitos.",
    confirm_lead_details: "Confirme os detalhes da consulta:",
    confirm_create_lead: "Devo criar este cliente em Leadrat CRM?",
    lead_created_success: "Cliente criado com sucesso!",
    help_message: "Estou aqui para ajudar! Pergunte-me sobre clientes, imóveis, projetos ou agendamento de visitas.",
    im_here_to_help: "Olá! Sou seu Assistente de IA Imobiliária.",

    show_all_properties: "Mostrar Todos os Imóveis",
    show_all_projects: "Mostrar Todos os Projetos",

    confirm: "Confirmar",
    cancel: "Cancelar",
    create_lead: "Criar Cliente",
    ask_ai: "Perguntar à IA",

    no_results: "Nenhum resultado encontrado",
    error_occurred: "Ocorreu um erro",
    success: "Sucesso!",
  },

  de: {
    welcome_title: "Willkommen bei REIA",
    welcome_subtitle: "Dein KI-Assistent für Immobilien",
    welcome_desc: "Frag mich alles über Immobilien, Kunden und Immobiliengeschäfte.",

    input_placeholder: "Frag nach Immobilien, Kunden oder Terminplanung...",
    send_button: "Senden",

    search_leads: "🔍 Kunden Suchen",
    find_properties: "🏢 Immobilien Finden",
    schedule_visit: "📅 Besuch Vereinbaren",
    book_callback: "📞 Rückruf Buchen",

    template_leads: "Kunden Anzeigen",
    template_properties: "Immobilien Finden",
    template_schedule: "Termin Vereinbaren",
    template_insights: "Informationen Abrufen",

    online: "Online",
    leadrat_connected: "Leadrat Verbunden",
    analyzing: "Analysiere...",
    processing: "Verarbeite deine Anfrage...",

    thinking: "denke...",
    searching_lead: "Suche Kunde...",
    checking_status: "Überprüfe Status von",
    creating_lead: "Erstelle Kunde in Leadrat CRM...",
    updating_status: "Aktualisiere Kundenstatus in Leadrat...",
    scheduling_appointment: "Vereinbare Termin in Leadrat CRM...",
    no_leads_found: "Keine Kunden gefunden",
    failed_search: "Kundensuche fehlgeschlagen",

    create_new_lead: "Lass mich einen neuen Kunde erstellen!",
    customer_name_prompt: "Wie ist der Name des Kunden?",
    phone_number_prompt: "Wie ist die Telefonnummer?",
    valid_phone_required: "Bitte geben Sie eine gültige 10-stellige Telefonnummer ein.",
    confirm_lead_details: "Bitte bestätigen Sie die Anfrageinformationen:",
    confirm_create_lead: "Soll ich diesen Kunde in Leadrat CRM erstellen?",
    lead_created_success: "Kunde erfolgreich erstellt!",
    help_message: "Ich bin hier, um zu helfen! Frag mich nach Kunden, Immobilien, Projekten oder Terminplanung.",
    im_here_to_help: "Hallo! Ich bin dein KI-Assistent für Immobilien.",

    show_all_properties: "Alle Immobilien Anzeigen",
    show_all_projects: "Alle Projekte Anzeigen",

    confirm: "Bestätigen",
    cancel: "Abbrechen",
    create_lead: "Kunde Erstellen",
    ask_ai: "KI Fragen",

    no_results: "Keine Ergebnisse gefunden",
    error_occurred: "Ein Fehler ist aufgetreten",
    success: "Erfolg!",
  },

  zh: {
    welcome_title: "欢迎来到 REIA",
    welcome_subtitle: "您的房地产人工智能助手",
    welcome_desc: "询问我有关房产、客户和房地产业务的任何信息。",

    input_placeholder: "询问房产、客户或安排会议...",
    send_button: "发送",

    search_leads: "🔍 搜索客户",
    find_properties: "🏢 查找房产",
    schedule_visit: "📅 安排访问",
    book_callback: "📞 预订回电",

    template_leads: "显示客户",
    template_properties: "查找房产",
    template_schedule: "安排约会",
    template_insights: "获取见解",

    online: "在线",
    leadrat_connected: "Leadrat 已连接",
    analyzing: "分析中...",
    processing: "正在处理您的请求...",

    thinking: "思考中...",
    searching_lead: "搜索客户中...",
    checking_status: "检查状态",
    creating_lead: "在 Leadrat CRM 中创建客户...",
    updating_status: "更新 Leadrat 中的客户状态...",
    scheduling_appointment: "在 Leadrat CRM 中安排约会...",
    no_leads_found: "未找到客户",
    failed_search: "客户搜索失败",

    create_new_lead: "让我创建一个新客户!",
    customer_name_prompt: "客户的名字是什么?",
    phone_number_prompt: "电话号码是多少?",
    valid_phone_required: "请输入有效的 10 位电话号码。",
    confirm_lead_details: "请确认查询详情:",
    confirm_create_lead: "我应该在 Leadrat CRM 中创建这个客户吗?",
    lead_created_success: "客户创建成功!",
    help_message: "我在这里帮助您! 询问我有关客户、房产、项目或访问安排的任何信息。",
    im_here_to_help: "您好! 我是您的房地产人工智能助手。",

    show_all_properties: "显示所有房产",
    show_all_projects: "显示所有项目",

    confirm: "确认",
    cancel: "取消",
    create_lead: "创建客户",
    ask_ai: "询问人工智能",

    no_results: "未找到结果",
    error_occurred: "发生错误",
    success: "成功!",
  },

  ja: {
    welcome_title: "REIAへようこそ",
    welcome_subtitle: "あなたの不動産AI助手",
    welcome_desc: "物件、顧客、不動産ビジネスについて何でも聞いてください。",

    input_placeholder: "物件、顧客、または会議のスケジュールについて質問してください...",
    send_button: "送信",

    search_leads: "🔍 顧客を検索",
    find_properties: "🏢 物件を検索",
    schedule_visit: "📅 訪問をスケジュール",
    book_callback: "📞 コールバックを予約",

    template_leads: "顧客を表示",
    template_properties: "物件を検索",
    template_schedule: "予約をスケジュール",
    template_insights: "インサイトを取得",

    online: "オンライン",
    leadrat_connected: "Leadrat接続済み",
    analyzing: "分析中...",
    processing: "リクエストを処理中...",

    thinking: "考え中...",
    searching_lead: "顧客を検索中...",
    checking_status: "ステータスを確認",
    creating_lead: "Leadrat CRMで顧客を作成中...",
    updating_status: "Leadratで顧客ステータスを更新中...",
    scheduling_appointment: "Leadrat CRMで予約をスケジュール中...",
    no_leads_found: "顧客が見つかりません",
    failed_search: "顧客検索に失敗しました",

    create_new_lead: "新しい顧客を作成させてください!",
    customer_name_prompt: "顧客のお名前は?",
    phone_number_prompt: "電話番号は?",
    valid_phone_required: "有効な10桁の電話番号を入力してください。",
    confirm_lead_details: "お問い合わせの詳細をご確認ください:",
    confirm_create_lead: "この顧客をLeadrat CRMに作成しましょうか?",
    lead_created_success: "顧客が正常に作成されました!",
    help_message: "お手伝いします!顧客、物件、プロジェクト、訪問スケジュールについて何でも聞いてください。",
    im_here_to_help: "こんにちは!あなたの不動産AI助手です。",

    show_all_properties: "すべての物件を表示",
    show_all_projects: "すべてのプロジェクトを表示",

    confirm: "確認",
    cancel: "キャンセル",
    create_lead: "顧客を作成",
    ask_ai: "AIに質問",

    no_results: "結果が見つかりません",
    error_occurred: "エラーが発生しました",
    success: "成功!",
  },
};

// Function to get translated text
export function getTranslation(language: string, key: string): string {
  const lang = translations[language] || translations['en'];
  return lang[key] || translations['en'][key] || key;
}

// Function to translate a whole object
export function translateUI(language: string): Record<string, string> {
  return translations[language] || translations['en'];
}
