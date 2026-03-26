import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

// Checklist Components
import ChecklistDrawer from './components/Checklist/ChecklistDrawer';
import InlineChecklist from './components/Checklist/InlineChecklist';
import { useAuth } from "./contexts/AuthContext";

const API_BASE = "http://localhost:8000";


/* ═══════════════════════════════════════════════════════════════
   TRANSLATIONS
═══════════════════════════════════════════════════════════════ */
const TRANSLATIONS = {
  en: {
    appTitle: "Eligibility Assistant",
    newChat: "New Chat",
    searchPlaceholder: "Search chats…",
    recentChats: "Recent Chats",
    browseSchemes: "Browse Schemes",
    citizenProfile: "Citizen Profile Form",
    inputPlaceholder: "Describe your situation in simple language…",
    sendLabel: "Send",
    voiceLabel: "Voice",
    uploadLabel: "Upload",
    stopListening: "Stop",
    listening: "● Listening…",
    micDenied: "Microphone access required",
    micUnsupported: "Voice not supported in this browser",
    matchedSchemes: "Matched Schemes",
    found: "found",
    schemeResultsHint: "Scheme results will appear here once you describe your situation in the chat.",
    disclaimer: "PolicyPilot uses AI to suggest schemes. Always verify eligibility at official government portals.",
    emptyTitle: "Namaste! I'm PolicyPilot",
    emptySub: "Tell me about your situation and I'll guide you through the government schemes you qualify for — in any language.",
    saveProfile: "Save & Find Schemes",
    uploadMoreDocs: "Upload more docs",
    language: "Language",
    uploadedPrefix: "Uploaded:",
    profileTitle: "Citizen Profile",
    profileDesc: "Fill in your details to receive personalised scheme recommendations. All data stays on your device.",
    personalInfo: "Personal Information",
    economicProfile: "Economic Profile",
    location: "Location",
    documents: "Documents",
    schemeInterest: "Scheme Interest",
    // Step tracker
    stepProfile: "Profile", stepSchemes: "Schemes", stepChecklist: "Checklist", stepApply: "Apply",
    // Result card
    findMySchemes: "🔍 Find My Schemes",
    viewChecklist: "View Checklist →",
    draftReady: "Draft Ready ✓",
    matchLabel: "match",
    whyEligible: "Why am I eligible?",
    aiInsight: "AI Insight",
    conflictLabel: "conflict",
    // Login modal
    modalTitle: "🔐 Citizen Portal Access",
    loginTab: "Login", signupTab: "Create Account",
    emailLabel: "Email / Mobile Number", passwordLabel: "Password",
    forgotPassword: "Forgot password?", signIn: "Sign In →",
    fullNameLabel: "Full Name", mobileLabel: "Mobile Number",
    stateLabel: "State", confirmPasswordLabel: "Confirm Password",
    createAccount: "Create Account →",
    orVerifyUsing: "OR VERIFY USING",
    digiLockerBtn: "Continue with DigiLocker",
    digiLockerConnecting: "🔒 Connecting to Government Secure Document Gateway…",
    govtTrusted: "Govt Trusted",
    // Profile form fields
    ageLabel: "Age", occupationLabel: "Occupation", bplLabel: "BPL / APL Status",
    stateUTLabel: "State / Union Territory", districtLabel: "District / Taluka",
    aadhaarLabel: "Aadhaar Number", incomeLabel: "Annual Family Income",
    genderLabel: "Gender", educationLabel: "Education / Stream",
    residenceLabel: "Residence Type", socialCatLabel: "Social Category",
    schemeScopeLabel: "Scheme Coverage Preference",
    primaryNeedLabel: "Primary Need Category", familySizeLabel: "Family Size",
    incomeCertLabel: "Income Certificate", casteCertLabel: "Caste Certificate",
    eligibilityHeader: "Eligibility Details for Scheme Matching",
    centralSchemesBtn: "🏛 Central Schemes", stateSchemesBtn: "🗺 State Schemes",
    centralSchemeHint: "🌐 Central schemes are available nationwide.",
    stateSchemeHint: "📍 Select your state to match regional schemes.",
    centralStateHint: "🌐 Central schemes are available nationwide — state not required.",
    regionalStateHint: "📍 Currently supporting selected western region schemes.",
    schemeScopeHint: "AI will combine central and regional welfare programs for better recommendations.",
    socialCatHint: "Used to match government reservation-based schemes.",
    incomeFamilyHint: "Annual family income helps determine scheme eligibility.",
    orFetchFrom: "OR FETCH FROM DIGILOCKER",
    digiLockerFetch: "Fetch Documents from DigiLocker",
    digiLockerHint: "Securely import verified documents from your DigiLocker account.",
    secureDoc: "Secure Document Processing Enabled",
    signInToStoreDocs: "Sign in to securely store uploaded documents.",
    // Auth section
    saveProgress: "🔐 Save Your Progress",
    signInDesc: "Sign in to securely save your profile and scheme matches for future access.",
    signInToSave: "🔐 Sign in to Save & Continue",
    continueGuest: "Continue as Guest",
    // Trust bar
    poweredByAI: "🤖 Powered by AI Policy Engine",
    verifiedSources: "✅ Verified Government Sources",
    dataOnDevice: "🔒 Data Stays on Your Device",
    // Dropdown
    profileDropdown: "Profile", savedSchemes: "📋 Saved Schemes", logout: "⬅ Logout",
    signInBtn: "🔐 Sign In",
    // Upload helpers
    dragDrop: "Drag & drop or click",
    aadhaarPlaceholder: "12-digit Aadhaar number",
    agePlaceholder: "Years",
    aadhaarAs: "As on Aadhaar",
    districtPlaceholder: "e.g. Anand, Surat",
    familySizePlaceholder: "Number of family members",
    occupationPlaceholder: "e.g. Agriculture, Daily wage, Business",
    incomeCertHint: "PDF or image, issued by tehsildar",
    casteCertHint: "PDF or image — if applicable",
    selectLabel: "Select", selectCategory: "Select category",
  },
  hi: {
    appTitle: "पात्रता सहायक", newChat: "नई चैट", searchPlaceholder: "चैट खोजें…", recentChats: "हाल की चैट",
    browseSchemes: "योजनाएं देखें", citizenProfile: "नागरिक प्रोफाइल फॉर्म", inputPlaceholder: "अपनी स्थिति सरल भाषा में बताएं…",
    sendLabel: "भेजें", voiceLabel: "आवाज़", uploadLabel: "अपलोड", stopListening: "रोकें", listening: "● सुन रहा है…",
    micDenied: "माइक्रोफ़ोन एक्सेस आवश्यक है", micUnsupported: "इस ब्राउज़र में वॉइस समर्थित नहीं",
    matchedSchemes: "मिली योजनाएं", found: "मिली", schemeResultsHint: "चैट में अपनी स्थिति बताने के बाद यहाँ योजना परिणाम दिखेंगे।",
    disclaimer: "PolicyPilot योजनाएं सुझाने के लिए AI का उपयोग करता है।", emptyTitle: "नमस्ते! मैं PolicyPilot हूँ",
    emptySub: "अपनी स्थिति बताएं और मैं आपको उन सरकारी योजनाओं के बारे में बताऊंगा जिनके आप पात्र हैं।",
    saveProfile: "सहेजें और योजनाएं खोजें", uploadMoreDocs: "और दस्तावेज़ अपलोड करें", language: "भाषा",
    uploadedPrefix: "अपलोड किया:", profileTitle: "नागरिक प्रोफाइल",
    profileDesc: "व्यक्तिगत योजना सुझाव पाने के लिए अपनी जानकारी भरें।",
    personalInfo: "व्यक्तिगत जानकारी", economicProfile: "आर्थिक प्रोफाइल", location: "स्थान", documents: "दस्तावेज़", schemeInterest: "योजना रुचि",
    stepProfile: "प्रोफाइल", stepSchemes: "योजनाएं", stepChecklist: "चेकलिस्ट", stepApply: "आवेदन",
    findMySchemes: "🔍 मेरी योजनाएं खोजें", viewChecklist: "चेकलिस्ट देखें →", draftReady: "ड्राफ्ट तैयार ✓",
    matchLabel: "मिलान", whyEligible: "मैं पात्र क्यों हूँ?", aiInsight: "AI अंतर्दृष्टि", conflictLabel: "विरोध",
    modalTitle: "🔐 नागरिक पोर्टल प्रवेश", loginTab: "लॉगिन", signupTab: "खाता बनाएं",
    emailLabel: "ईमेल / मोबाइल नंबर", passwordLabel: "पासवर्ड", forgotPassword: "पासवर्ड भूल गए?",
    signIn: "साइन इन करें →", fullNameLabel: "पूरा नाम", mobileLabel: "मोबाइल नंबर",
    stateLabel: "राज्य", confirmPasswordLabel: "पासवर्ड की पुष्टि करें", createAccount: "खाता बनाएं →",
    orVerifyUsing: "या इससे सत्यापित करें", digiLockerBtn: "DigiLocker से जारी रखें",
    digiLockerConnecting: "🔒 सरकारी सुरक्षित गेटवे से जुड़ रहे हैं…", govtTrusted: "सरकारी विश्वसनीय",
    ageLabel: "आयु", occupationLabel: "व्यवसाय", bplLabel: "BPL / APL स्थिति",
    stateUTLabel: "राज्य / केंद्र शासित प्रदेश", districtLabel: "जिला / तालुका",
    aadhaarLabel: "आधार नंबर", incomeLabel: "वार्षिक पारिवारिक आय",
    genderLabel: "लिंग", educationLabel: "शिक्षा / धारा", residenceLabel: "निवास प्रकार",
    socialCatLabel: "सामाजिक श्रेणी", schemeScopeLabel: "योजना कवरेज प्राथमिकता",
    primaryNeedLabel: "प्राथमिक आवश्यकता श्रेणी", familySizeLabel: "परिवार का आकार",
    incomeCertLabel: "आय प्रमाण पत्र", casteCertLabel: "जाति प्रमाण पत्र",
    eligibilityHeader: "योजना मिलान के लिए पात्रता विवरण",
    centralSchemesBtn: "🏛 केंद्रीय योजनाएं", stateSchemesBtn: "🗺 राज्य योजनाएं",
    centralSchemeHint: "🌐 केंद्रीय योजनाएं पूरे देश में उपलब्ध हैं।",
    stateSchemeHint: "📍 क्षेत्रीय योजनाओं के लिए अपना राज्य चुनें।",
    centralStateHint: "🌐 केंद्रीय योजनाओं के लिए राज्य आवश्यक नहीं।",
    regionalStateHint: "📍 अभी पश्चिमी क्षेत्र की योजनाएं उपलब्ध हैं।",
    schemeScopeHint: "AI बेहतर सुझावों के लिए केंद्रीय और राज्य कार्यक्रमों को जोड़ेगा।",
    socialCatHint: "सरकारी आरक्षण-आधारित योजनाएं मिलाने के लिए।",
    incomeFamilyHint: "वार्षिक पारिवारिक आय से योजना पात्रता तय होती है।",
    orFetchFrom: "या DIGILOCKER से लाएं", digiLockerFetch: "DigiLocker से दस्तावेज़ लाएं",
    digiLockerHint: "अपने DigiLocker से सत्यापित दस्तावेज़ सुरक्षित रूप से आयात करें।",
    secureDoc: "सुरक्षित दस्तावेज़ प्रसंस्करण सक्रिय", signInToStoreDocs: "दस्तावेज़ सुरक्षित रखने के लिए साइन इन करें।",
    saveProgress: "🔐 अपनी प्रगति सहेजें", signInDesc: "भविष्य के लिए अपनी प्रोफ़ाइल सुरक्षित करें।",
    signInToSave: "🔐 सहेजने के लिए साइन इन करें", continueGuest: "अतिथि के रूप में जारी रखें",
    poweredByAI: "🤖 AI नीति इंजन द्वारा संचालित", verifiedSources: "✅ सत्यापित सरकारी स्रोत",
    dataOnDevice: "🔒 डेटा आपके डिवाइस पर",
    profileDropdown: "प्रोफाइल", savedSchemes: "📋 सहेजी गई योजनाएं", logout: "⬅ लॉगआउट",
    signInBtn: "🔐 साइन इन", dragDrop: "खींचें और छोड़ें या क्लिक करें",
    aadhaarPlaceholder: "12-अंकीय आधार नंबर", agePlaceholder: "वर्ष", aadhaarAs: "आधार के अनुसार",
    districtPlaceholder: "जैसे अनंद, सूरत", familySizePlaceholder: "परिवार के सदस्यों की संख्या",
    occupationPlaceholder: "जैसे कृषि, दैनिक मजदूरी, व्यापार",
    incomeCertHint: "PDF या छवि, तहसीलदार द्वारा जारी", casteCertHint: "PDF या छवि — यदि लागू हो",
    selectLabel: "चुनें", selectCategory: "श्रेणी चुनें",
  },
  bn: {
    appTitle: "যোগ্যতা সহকারী", newChat: "নতুন চ্যাট", searchPlaceholder: "চ্যাট খুঁজুন…", recentChats: "সাম্প্রতিক চ্যাট",
    browseSchemes: "প্রকল্প দেখুন", citizenProfile: "নাগরিক প্রোফাইল ফর্ম", inputPlaceholder: "আপনার পরিস্থিতি সহজ ভাষায় বর্ণনা করুন…",
    sendLabel: "পাঠান", voiceLabel: "ভয়েস", uploadLabel: "আপলোড", stopListening: "থামুন", listening: "● শুনছি…",
    micDenied: "মাইক্রোফোন অ্যাক্সেস প্রয়োজন", micUnsupported: "এই ব্রাউজারে ভয়েস সমর্থিত নয়",
    matchedSchemes: "মিলানো প্রকল্প", found: "পাওয়া গেছে", schemeResultsHint: "চ্যাটে আপনার পরিস্থিতি বর্ণনা করলে এখানে প্রকল্পের ফলাফল দেখাবে।",
    disclaimer: "PolicyPilot প্রকল্প পরামর্শ দিতে AI ব্যবহার করে।", emptyTitle: "নমস্কার! আমি PolicyPilot",
    emptySub: "আপনার পরিস্থিতি বলুন এবং আমি আপনাকে যোগ্য সরকারি প্রকল্পগুলি সম্পর্কে গাইড করব।",
    saveProfile: "সংরক্ষণ করুন ও প্রকল্প খুঁজুন", uploadMoreDocs: "আরও নথি আপলোড করুন", language: "ভাষা",
    uploadedPrefix: "আপলোড করা হয়েছে:", profileTitle: "নাগরিক প্রোফাইল", profileDesc: "ব্যক্তিগতকৃত প্রকল্প সুপারিশের জন্য আপনার বিবরণ পূরণ করুন।",
    personalInfo: "ব্যক্তিগত তথ্য", economicProfile: "অর্থনৈতিক প্রোফাইল", location: "অবস্থান", documents: "নথিপত্র", schemeInterest: "প্রকল্পের আগ্রহ",
    stepProfile: "প্রোফাইল", stepSchemes: "প্রকল্প", stepChecklist: "তালিকা", stepApply: "আবেদন",
    findMySchemes: "🔍 আমার প্রকল্প খুঁজুন", viewChecklist: "তালিকা দেখুন →", draftReady: "খসড়া প্রস্তুত ✓",
    matchLabel: "মিল", whyEligible: "আমি কেন যোগ্য?", aiInsight: "AI অন্তর্দৃষ্টি", conflictLabel: "দ্বন্দ্ব",
    modalTitle: "🔐 নাগরিক পোর্টাল প্রবেশ", loginTab: "লগইন", signupTab: "অ্যাকাউন্ট তৈরি করুন",
    emailLabel: "ইমেইল / মোবাইল নম্বর", passwordLabel: "পাসওয়ার্ড", forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    signIn: "সাইন ইন →", fullNameLabel: "পুরো নাম", mobileLabel: "মোবাইল নম্বর",
    stateLabel: "রাজ্য", confirmPasswordLabel: "পাসওয়ার্ড নিশ্চিত করুন", createAccount: "অ্যাকাউন্ট তৈরি করুন →",
    orVerifyUsing: "অথবা যাচাই করুন", digiLockerBtn: "DigiLocker দিয়ে চালিয়ে যান",
    digiLockerConnecting: "🔒 সরকারি সুরক্ষিত গেটওয়েতে সংযুক্ত হচ্ছে…", govtTrusted: "সরকার অনুমোদিত",
    ageLabel: "বয়স", occupationLabel: "পেশা", bplLabel: "BPL / APL অবস্থা",
    stateUTLabel: "রাজ্য / কেন্দ্রশাসিত অঞ্চল", districtLabel: "জেলা / তালুকা",
    aadhaarLabel: "আধার নম্বর", incomeLabel: "বার্ষিক পারিবারিক আয়",
    genderLabel: "লিঙ্গ", educationLabel: "শিক্ষা / বিভাগ", residenceLabel: "বাসস্থানের ধরন",
    socialCatLabel: "সামাজিক বিভাগ", schemeScopeLabel: "প্রকল্প কভারেজ পছন্দ",
    primaryNeedLabel: "প্রাথমিক প্রয়োজন বিভাগ", familySizeLabel: "পরিবারের আকার",
    incomeCertLabel: "আয় সনদ", casteCertLabel: "জাত সনদ",
    eligibilityHeader: "প্রকল্প মিলানোর যোগ্যতার বিবরণ",
    centralSchemesBtn: "🏛 কেন্দ্রীয় প্রকল্প", stateSchemesBtn: "🗺 রাজ্য প্রকল্প",
    orFetchFrom: "অথবা DIGILOCKER থেকে আনুন", digiLockerFetch: "DigiLocker থেকে নথি আনুন",
    digiLockerHint: "আপনার DigiLocker অ্যাকাউন্ট থেকে যাচাইকৃত নথি নিরাপদে আমদানি করুন।",
    secureDoc: "নিরাপদ নথি প্রক্রিয়াকরণ সক্ষম", signInToStoreDocs: "নথি সুরক্ষিত রাখতে সাইন ইন করুন।",
    saveProgress: "🔐 আপনার অগ্রগতি সংরক্ষণ করুন", signInDesc: "ভবিষ্যতের জন্য আপনার প্রোফাইল সুরক্ষিত করুন।",
    signInToSave: "🔐 সংরক্ষণ করতে সাইন ইন করুন", continueGuest: "অতিথি হিসেবে চালিয়ে যান",
    poweredByAI: "🤖 AI নীতি ইঞ্জিন দ্বারা চালিত", verifiedSources: "✅ যাচাইকৃত সরকারি উৎস",
    dataOnDevice: "🔒 ডেটা আপনার ডিভাইসে",
    profileDropdown: "প্রোফাইল", savedSchemes: "📋 সংরক্ষিত প্রকল্প", logout: "⬅ লগআউট",
    signInBtn: "🔐 সাইন ইন", dragDrop: "টেনে আনুন বা ক্লিক করুন",
    selectLabel: "বেছে নিন", selectCategory: "বিভাগ বেছে নিন",
  },
  te: {
    appTitle: "అర్హత సహాయకుడు", newChat: "కొత్త చాట్", searchPlaceholder: "చాట్‌లు వెతకండి…", recentChats: "ఇటీవలి చాట్‌లు",
    browseSchemes: "పథకాలు చూడండి", citizenProfile: "పౌర ప్రొఫైల్ ఫారం", inputPlaceholder: "మీ పరిస్థితిని సాధారణ భాషలో వివరించండి…",
    sendLabel: "పంపు", voiceLabel: "వాయిస్", uploadLabel: "అప్లోడ్", stopListening: "ఆపు", listening: "● వినడం…",
    micDenied: "మైక్రోఫోన్ యాక్సెస్ అవసరం", micUnsupported: "ఈ బ్రౌజర్‌లో వాయిస్ మద్దతు లేదు",
    matchedSchemes: "సరిపోయిన పథకాలు", found: "దొరికాయి", schemeResultsHint: "చాట్‌లో మీ పరిస్థితి వివరించిన తర్వాత పథక ఫలితాలు ఇక్కడ కనిపిస్తాయి.",
    disclaimer: "PolicyPilot పథకాలను సూచించడానికి AI ఉపయోగిస్తుంది.", emptyTitle: "నమస్కారం! నేను PolicyPilot",
    emptySub: "మీ పరిస్థితిని చెప్పండి, మీకు అర్హత ఉన్న ప్రభుత్వ పథకాల గురించి నేను మార్గనిర్దేశం చేస్తాను.",
    saveProfile: "సేవ్ చేసి పథకాలు వెతకండి", uploadMoreDocs: "మరిన్ని పత్రాలు అప్లోడ్ చేయండి", language: "భాష",
    uploadedPrefix: "అప్లోడ్ అయింది:", profileTitle: "పౌర ప్రొఫైల్", profileDesc: "వ్యక్తిగతీకరించిన పథక సిఫారసుల కోసం మీ వివరాలు నింపండి.",
    personalInfo: "వ్యక్తిగత సమాచారం", economicProfile: "ఆర్థిక ప్రొఫైల్", location: "స్థానం", documents: "పత్రాలు", schemeInterest: "పథక ఆసక్తి",
    stepProfile: "ప్రొఫైల్", stepSchemes: "పథకాలు", stepChecklist: "జాబితా", stepApply: "దరఖాస్తు",
    findMySchemes: "🔍 నా పథకాలు వెతకండి", viewChecklist: "జాబితా చూడండి →", draftReady: "ముసాయిదా సిద్ధం ✓",
    matchLabel: "సరిపోయింది", whyEligible: "నేను ఎందుకు అర్హుడిని?", aiInsight: "AI అంతర్దృష్టి", conflictLabel: "వివాదం",
    modalTitle: "🔐 పౌర పోర్టల్ ప్రవేశం", loginTab: "లాగిన్", signupTab: "ఖాతా తయారు చేయండి",
    emailLabel: "ఇమెయిల్ / మొబైల్ నంబర్", passwordLabel: "పాస్‌వర్డ్", forgotPassword: "పాస్‌వర్డ్ మర్చిపోయారా?",
    signIn: "సైన్ ఇన్ →", fullNameLabel: "పూర్తి పేరు", mobileLabel: "మొబైల్ నంబర్",
    stateLabel: "రాష్ట్రం", confirmPasswordLabel: "పాస్‌వర్డ్ నిర్ధారించండి", createAccount: "ఖాతా తయారు చేయండి →",
    orVerifyUsing: "లేదా ద్వారా ధృవీకరించండి", digiLockerBtn: "DigiLocker తో కొనసాగండి",
    govtTrusted: "ప్రభుత్వ విశ్వసనీయ", ageLabel: "వయసు", occupationLabel: "వృత్తి",
    stateUTLabel: "రాష్ట్రం / కేంద్రపాలిత ప్రాంతం", districtLabel: "జిల్లా / తాలూకా",
    aadhaarLabel: "ఆధార్ నంబర్", incomeLabel: "వార్షిక కుటుంబ ఆదాయం",
    genderLabel: "లింగం", educationLabel: "విద్య / విభాగం", residenceLabel: "నివాస రకం",
    orFetchFrom: "లేదా DIGILOCKER నుండి తీయండి", digiLockerFetch: "DigiLocker నుండి పత్రాలు తీయండి",
    secureDoc: "సురక్షిత పత్ర ప్రాసెసింగ్ ఎనేబుల్", signInToSave: "🔐 సేవ్ చేయడానికి సైన్ ఇన్",
    continueGuest: "అతిథిగా కొనసాగండి", signInBtn: "🔐 సైన్ ఇన్",
    poweredByAI: "🤖 AI పాలసీ ఇంజిన్ ద్వారా", verifiedSources: "✅ ధృవీకరించిన ప్రభుత్వ వనరులు",
    dataOnDevice: "🔒 డేటా మీ పరికరంలో",
    selectLabel: "ఎంచుకోండి", selectCategory: "వర్గం ఎంచుకోండి",
  },
  mr: {
    appTitle: "पात्रता सहाय्यक", newChat: "नवीन चॅट", searchPlaceholder: "चॅट शोधा…", recentChats: "अलीकडील चॅट",
    browseSchemes: "योजना पहा", citizenProfile: "नागरिक प्रोफाइल फॉर्म", inputPlaceholder: "तुमची परिस्थिती सोप्या भाषेत सांगा…",
    sendLabel: "पाठवा", voiceLabel: "आवाज", uploadLabel: "अपलोड", stopListening: "थांबा", listening: "● ऐकत आहे…",
    micDenied: "मायक्रोफोन प्रवेश आवश्यक आहे", micUnsupported: "या ब्राउझरमध्ये व्हॉइस समर्थित नाही",
    matchedSchemes: "जुळलेल्या योजना", found: "आढळल्या", schemeResultsHint: "चॅटमध्ये परिस्थिती सांगितल्यानंतर येथे योजना निकाल दिसतील.",
    disclaimer: "PolicyPilot योजना सुचवण्यासाठी AI वापरतो.", emptyTitle: "नमस्कार! मी PolicyPilot आहे",
    emptySub: "तुमची परिस्थिती सांगा आणि मी तुम्हाला पात्र सरकारी योजनांबद्दल मार्गदर्शन करेन.",
    saveProfile: "जतन करा आणि योजना शोधा", uploadMoreDocs: "अधिक कागदपत्रे अपलोड करा", language: "भाषा",
    uploadedPrefix: "अपलोड केले:", profileTitle: "नागरिक प्रोफाइल", profileDesc: "वैयक्तिकृत योजना शिफारसींसाठी तुमचे तपशील भरा.",
    personalInfo: "वैयक्तिक माहिती", economicProfile: "आर्थिक प्रोफाइल", location: "स्थान", documents: "कागदपत्रे", schemeInterest: "योजना आवड",
    stepProfile: "प्रोफाइल", stepSchemes: "योजना", stepChecklist: "यादी", stepApply: "अर्ज",
    findMySchemes: "🔍 माझ्या योजना शोधा", viewChecklist: "यादी पहा →", draftReady: "मसुदा तयार ✓",
    matchLabel: "जुळणी", whyEligible: "मी पात्र का आहे?", aiInsight: "AI अंतर्दृष्टी", conflictLabel: "विरोधाभास",
    modalTitle: "🔐 नागरिक पोर्टल प्रवेश", loginTab: "लॉगिन", signupTab: "खाते तयार करा",
    emailLabel: "ईमेल / मोबाइल नंबर", passwordLabel: "पासवर्ड", forgotPassword: "पासवर्ड विसरलात?",
    signIn: "साइन इन करा →", fullNameLabel: "पूर्ण नाव", mobileLabel: "मोबाइल नंबर",
    stateLabel: "राज्य", confirmPasswordLabel: "पासवर्ड पुष्टी करा", createAccount: "खाते तयार करा →",
    orVerifyUsing: "किंवा द्वारे सत्यापित करा", digiLockerBtn: "DigiLocker ने सुरू ठेवा",
    govtTrusted: "सरकार विश्वसनीय", ageLabel: "वय", occupationLabel: "व्यवसाय",
    stateUTLabel: "राज्य / केंद्रशासित प्रदेश", districtLabel: "जिल्हा / तालुका",
    aadhaarLabel: "आधार क्रमांक", incomeLabel: "वार्षिक कौटुंबिक उत्पन्न",
    genderLabel: "लिंग", educationLabel: "शिक्षण / शाखा", residenceLabel: "निवासाचा प्रकार",
    orFetchFrom: "किंवा DIGILOCKER मधून आणा", digiLockerFetch: "DigiLocker मधून कागदपत्रे आणा",
    secureDoc: "सुरक्षित दस्तऐवज प्रक्रिया सक्षम", signInToSave: "🔐 जतन करण्यासाठी साइन इन करा",
    continueGuest: "पाहुणे म्हणून सुरू ठेवा", signInBtn: "🔐 साइन इन",
    poweredByAI: "🤖 AI धोरण इंजिनद्वारे", verifiedSources: "✅ सत्यापित सरकारी स्रोत",
    dataOnDevice: "🔒 डेटा तुमच्या डिव्हाइसवर",
    selectLabel: "निवडा", selectCategory: "श्रेणी निवडा",
  },
  ta: {
    appTitle: "தகுதி உதவியாளர்", newChat: "புதிய அரட்டை", searchPlaceholder: "அரட்டைகளை தேடுங்கள்…", recentChats: "சமீபத்திய அரட்டைகள்",
    browseSchemes: "திட்டங்களை பார்க்கவும்", citizenProfile: "குடிமக்கள் சுயவிவரம்", inputPlaceholder: "உங்கள் நிலைமையை எளிய மொழியில் விவரிக்கவும்…",
    sendLabel: "அனுப்பு", voiceLabel: "குரல்", uploadLabel: "பதிவேற்று", stopListening: "நிறுத்து", listening: "● கேட்கிறது…",
    micDenied: "மைக்ரோஃபோன் அணுகல் தேவை", micUnsupported: "இந்த உலாவியில் குரல் ஆதரிக்கப்படவில்லை",
    matchedSchemes: "பொருந்திய திட்டங்கள்", found: "கிடைத்தன", schemeResultsHint: "அரட்டையில் நிலைமையை விவரித்த பிறகு திட்ட முடிவுகள் இங்கே தோன்றும்.",
    disclaimer: "PolicyPilot திட்டங்களை பரிந்துரைக்க AI பயன்படுத்துகிறது.", emptyTitle: "வணக்கம்! நான் PolicyPilot",
    emptySub: "உங்கள் நிலைமையை சொல்லுங்கள், தகுதியான அரசு திட்டங்களை நான் வழிகாட்டுவேன்.",
    saveProfile: "சேமி மற்றும் திட்டங்களை தேடு", uploadMoreDocs: "மேலும் ஆவணங்களை பதிவேற்று", language: "மொழி",
    uploadedPrefix: "பதிவேற்றப்பட்டது:", profileTitle: "குடிமக்கள் சுயவிவரம்", profileDesc: "தனிப்பயனாக்கப்பட்ட திட்ட பரிந்துரைகளுக்கு உங்கள் விவரங்களை நிரப்பவும்.",
    personalInfo: "தனிப்பட்ட தகவல்", economicProfile: "பொருளாதார சுயவிவரம்", location: "இடம்", documents: "ஆவணங்கள்", schemeInterest: "திட்ட ஆர்வம்",
    stepProfile: "சுயவிவரம்", stepSchemes: "திட்டங்கள்", stepChecklist: "பட்டியல்", stepApply: "விண்ணப்பி",
    findMySchemes: "🔍 என் திட்டங்களை கண்டுபிடி", viewChecklist: "பட்டியல் பார்க்கவும் →", draftReady: "வரைவு தயார் ✓",
    matchLabel: "பொருந்தல்", whyEligible: "நான் ஏன் தகுதியானவன்?", aiInsight: "AI நுண்ணறிவு", conflictLabel: "முரண்பாடு",
    modalTitle: "🔐 குடிமக்கள் போர்டல் அணுகல்", loginTab: "உள்நுழைவு", signupTab: "கணக்கு உருவாக்கு",
    emailLabel: "மின்னஞ்சல் / மொபைல் எண்", passwordLabel: "கடவுச்சொல்", forgotPassword: "கடவுச்சொல் மறந்தீர்களா?",
    signIn: "உள்நுழை →", fullNameLabel: "முழு பெயர்", mobileLabel: "மொபைல் எண்",
    stateLabel: "மாநிலம்", confirmPasswordLabel: "கடவுச்சொல் உறுதிப்படுத்தவும்", createAccount: "கணக்கு உருவாக்கு →",
    orVerifyUsing: "அல்லது இதன் மூலம் சரிபார்க்கவும்", digiLockerBtn: "DigiLocker மூலம் தொடரவும்",
    govtTrusted: "அரசு நம்பகமான", ageLabel: "வயது", occupationLabel: "தொழில்",
    stateUTLabel: "மாநிலம் / யூனியன் பிரதேசம்", districtLabel: "மாவட்டம் / தாலூகா",
    aadhaarLabel: "ஆதார் எண்", incomeLabel: "வருடாந்திர குடும்ப வருமானம்",
    genderLabel: "பாலினம்", educationLabel: "கல்வி / பிரிவு", residenceLabel: "வசிப்பிட வகை",
    orFetchFrom: "அல்லது DIGILOCKER இலிருந்து பெறுக", digiLockerFetch: "DigiLocker இலிருந்து ஆவணங்கள் பெறுக",
    secureDoc: "பாதுகாப்பான ஆவண செயலாக்கம் இயக்கப்பட்டது", signInToSave: "🔐 சேமிக்க உள்நுழைக",
    continueGuest: "விருந்தினராக தொடரவும்", signInBtn: "🔐 உள்நுழைக",
    poweredByAI: "🤖 AI கொள்கை இயந்திரம் மூலம்", verifiedSources: "✅ சரிபார்க்கப்பட்ட அரசு ஆதாரங்கள்",
    dataOnDevice: "🔒 தரவு உங்கள் சாதனத்தில்",
    selectLabel: "தேர்ந்தெடுக்கவும்", selectCategory: "வகை தேர்ந்தெடுக்கவும்",
  },
  gu: {
    appTitle: "પાત્રતા સહાયક", newChat: "નવી ચેટ", searchPlaceholder: "ચેટ શોધો…", recentChats: "તાજેતરની ચેટ",
    browseSchemes: "યોજનાઓ જુઓ", citizenProfile: "નાગરિક પ્રોફાઇલ ફોર્મ", inputPlaceholder: "તમારી પરિસ્થિતિ સરળ ભાષામાં જણાવો…",
    sendLabel: "મોકલો", voiceLabel: "અવાજ", uploadLabel: "અપલોડ", stopListening: "અટકો", listening: "● સાંભળી રહ્યો છું…",
    micDenied: "માઇક્રોફોન ઍક્સેસ જરૂરી છે", micUnsupported: "આ બ્રાઉઝરમાં વૉઇસ સપોર્ટ નથી",
    matchedSchemes: "મળેલી યોજનાઓ", found: "મળ્યા", schemeResultsHint: "ચેટમાં પરિસ્થિતિ જણાવ્યા બાદ અહીં યોજના પરિણામો દેખાશે.",
    disclaimer: "PolicyPilot યોજનાઓ સૂચવવા AI નો ઉપયોગ કરે છે.", emptyTitle: "નમસ્તે! હું PolicyPilot છું",
    emptySub: "તમારી પરિસ્થિતિ જણાવો અને હું તમને પાત્ર સરકારી યોજનાઓ વિશે માર્ગદર્શન આપીશ.",
    saveProfile: "સાચવો અને યોજનાઓ શોધો", uploadMoreDocs: "વધુ દસ્તાવેજ અપલોડ કરો", language: "ભાષા",
    uploadedPrefix: "અપલોડ થયું:", profileTitle: "નાગરિક પ્રોફાઇલ", profileDesc: "વ્યક્તિગત યોજના ભલામણો માટે તમારી વિગતો ભરો.",
    personalInfo: "વ્યક્તિગત માહિતી", economicProfile: "આર્થિક પ્રોફાઇલ", location: "સ્થાન", documents: "દસ્તાવેજો", schemeInterest: "યોજના રુચિ",
  },
  kn: {
    appTitle: "ಅರ್ಹತೆ ಸಹಾಯಕ", newChat: "ಹೊಸ ಚಾಟ್", searchPlaceholder: "ಚಾಟ್‌ಗಳನ್ನು ಹುಡುಕಿ…", recentChats: "ಇತ್ತೀಚಿನ ಚಾಟ್‌ಗಳು",
    browseSchemes: "ಯೋಜನೆಗಳನ್ನು ನೋಡಿ", citizenProfile: "ನಾಗರಿಕ ಪ್ರೊಫೈಲ್ ಫಾರ್ಮ್", inputPlaceholder: "ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಯನ್ನು ಸರಳ ಭಾಷೆಯಲ್ಲಿ ವಿವರಿಸಿ…",
    sendLabel: "ಕಳುಹಿಸಿ", voiceLabel: "ಧ್ವನಿ", uploadLabel: "ಅಪ್‌ಲೋಡ್", stopListening: "ನಿಲ್ಲಿಸಿ", listening: "● ಆಲಿಸುತ್ತಿದೆ…",
    micDenied: "ಮೈಕ್ರೋಫೋನ್ ಪ್ರವೇಶ ಅಗತ್ಯ", micUnsupported: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಬೆಂಬಲಿತವಲ್ಲ",
    matchedSchemes: "ಹೊಂದಿಕೆಯಾದ ಯೋಜನೆಗಳು", found: "ಕಂಡುಬಂದಿವೆ", schemeResultsHint: "ಚಾಟ್‌ನಲ್ಲಿ ಪರಿಸ್ಥಿತಿ ವಿವರಿಸಿದ ನಂತರ ಯೋಜನೆ ಫಲಿತಾಂಶಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
    disclaimer: "PolicyPilot ಯೋಜನೆಗಳನ್ನು ಸೂಚಿಸಲು AI ಬಳಸುತ್ತದೆ.", emptyTitle: "ನಮಸ್ಕಾರ! ನಾನು PolicyPilot",
    emptySub: "ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿ ಹೇಳಿ, ಅರ್ಹ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ನಾನು ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತೇನೆ.",
    saveProfile: "ಉಳಿಸಿ ಮತ್ತು ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ", uploadMoreDocs: "ಹೆಚ್ಚಿನ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ", language: "ಭಾಷೆ",
    uploadedPrefix: "ಅಪ್‌ಲೋಡ್ ಆಯಿತು:", profileTitle: "ನಾಗರಿಕ ಪ್ರೊಫೈಲ್", profileDesc: "ವೈಯಕ್ತಿಕ ಯೋಜನೆ ಶಿಫಾರಸುಗಳಿಗಾಗಿ ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.",
    personalInfo: "ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ", economicProfile: "ಆರ್ಥಿಕ ಪ್ರೊಫೈಲ್", location: "ಸ್ಥಳ", documents: "ದಾಖಲೆಗಳು", schemeInterest: "ಯೋಜನೆ ಆಸಕ್ತಿ",
  },
  ml: {
    appTitle: "യോഗ്യത സഹായി", newChat: "പുതിയ ചാറ്റ്", searchPlaceholder: "ചാറ്റുകൾ തിരയുക…", recentChats: "സമീപകാല ചാറ്റുകൾ",
    browseSchemes: "പദ്ധതികൾ കാണുക", citizenProfile: "പൗര പ്രൊഫൈൽ ഫോം", inputPlaceholder: "നിങ്ങളുടെ സ്ഥിതി ലളിതമായ ഭാഷയിൽ വിവരിക്കുക…",
    sendLabel: "അയക്കുക", voiceLabel: "ശബ്ദം", uploadLabel: "അപ്‌ലോഡ്", stopListening: "നിർത്തുക", listening: "● കേൾക്കുന്നു…",
    micDenied: "മൈക്രോഫോൺ ആക്സസ് ആവശ്യമാണ്", micUnsupported: "ഈ ബ്രൗസറിൽ ശബ്ദം പിന്തുണയ്ക്കുന്നില്ല",
    matchedSchemes: "യോജിച്ച പദ്ധതികൾ", found: "കണ്ടെത്തി", schemeResultsHint: "ചാറ്റിൽ സ്ഥിതി വിവരിച്ചതിന് ശേഷം ഇവിടെ ഫലങ്ങൾ ദൃശ്യമാകും.",
    disclaimer: "PolicyPilot പദ്ധതികൾ നിർദ്ദേശിക്കാൻ AI ഉപയോഗിക്കുന്നു.", emptyTitle: "നമസ്കാരം! ഞാൻ PolicyPilot",
    emptySub: "നിങ്ങളുടെ സ്ഥിതി പറയൂ, അർഹതയുള്ള സർക്കാർ പദ്ധതികളെക്കുറിച്ച് ഞാൻ നയിക്കാം.",
    saveProfile: "സേവ് ചെയ്ത് പദ്ധതികൾ കണ്ടെത്തുക", uploadMoreDocs: "കൂടുതൽ രേഖകൾ അപ്‌ലോഡ് ചെയ്യുക", language: "ഭാഷ",
    uploadedPrefix: "അപ്‌ലോഡ് ചെയ്തു:", profileTitle: "പൗര പ്രൊഫൈൽ", profileDesc: "വ്യക്തിഗതമാക്കിയ ശുപാർശകൾക്കായി വിശദാംശങ്ങൾ പൂരിപ്പിക്കുക.",
    personalInfo: "വ്യക്തിഗത വിവരങ്ങൾ", economicProfile: "സാമ്പത്തിക പ്രൊഫൈൽ", location: "സ്ഥലം", documents: "രേഖകൾ", schemeInterest: "പദ്ധതി താൽപ്പര്യം",
  },
  or: {
    appTitle: "ଯୋଗ୍ୟତା ସହାୟକ", newChat: "ନୂଆ ଚାଟ", searchPlaceholder: "ଚାଟ ଖୋଜନ୍ତୁ…", recentChats: "ସୁ ଚାଟ",
    browseSchemes: "ଯୋଜନା ଦେଖନ୍ତୁ", citizenProfile: "ନାଗରିକ ଫର୍ମ", inputPlaceholder: "ଆପଣଙ୍କ ସ୍ଥିତି ବର୍ଣ୍ଣନା କରନ୍ତୁ…",
    sendLabel: "ପଠାନ୍ତୁ", voiceLabel: "ଭଏସ", uploadLabel: "ଅପଲୋଡ", stopListening: "ବନ୍ଦ", listening: "● ଶୁଣୁଛି…",
    micDenied: "ମାଇକ ପ୍ରବେଶ ଦରକାର", micUnsupported: "ଭଏସ ସମ୍ଭାଳିତ ନୁହଁ",
    matchedSchemes: "ମିଳିଥିବା ଯୋଜନା", found: "ମିଳିଲା", schemeResultsHint: "ଚାଟରେ ସ୍ଥିତି ବର୍ଣ୍ଣନା ପରେ ଯୋଜନା ଫଳ ଦେଖାଯିବ।",
    disclaimer: "PolicyPilot AI ବ୍ୟବହାର କରେ।", emptyTitle: "ନମସ୍କାର! ମୁଁ PolicyPilot", emptySub: "ଆପଣଙ୍କ ସ୍ଥିତି କୁହନ୍ତୁ।",
    saveProfile: "ସଂରକ୍ଷଣ କରନ୍ତୁ", uploadMoreDocs: "ଅଧିକ ଦଲିଲ ଅପଲୋଡ", language: "ଭାଷା",
    uploadedPrefix: "ଅପଲୋଡ ହେଲା:", profileTitle: "ନାଗରିକ ପ୍ରୋଫାଇଲ", profileDesc: "ବ୍ୟକ୍ତିଗତ ସୁପାରିଶ ପାଇଁ ଆପଣଙ୍କ ବିବରଣ ଭର୍ତ୍ତି କରନ୍ତୁ।",
    personalInfo: "ବ୍ୟକ୍ତିଗତ ସୂଚନା", economicProfile: "ଆର୍ଥିକ ପ୍ରୋଫାଇଲ", location: "ସ୍ଥାନ", documents: "ଦଲିଲ", schemeInterest: "ଯୋଜନା ଆଗ୍ରହ",
  },
  pa: {
    appTitle: "ਯੋਗਤਾ ਸਹਾਇਕ", newChat: "ਨਵੀਂ ਚੈਟ", searchPlaceholder: "ਚੈਟ ਖੋਜੋ…", recentChats: "ਤਾਜ਼ੀਆਂ ਚੈਟਾਂ",
    browseSchemes: "ਯੋਜਨਾਵਾਂ ਦੇਖੋ", citizenProfile: "ਨਾਗਰਿਕ ਫਾਰਮ", inputPlaceholder: "ਆਪਣੀ ਸਥਿਤੀ ਸਧਾਰਨ ਭਾਸ਼ਾ ਵਿੱਚ ਦੱਸੋ…",
    sendLabel: "ਭੇਜੋ", voiceLabel: "ਆਵਾਜ਼", uploadLabel: "ਅਪਲੋਡ", stopListening: "ਰੋਕੋ", listening: "● ਸੁਣ ਰਿਹਾ ਹੈ…",
    micDenied: "ਮਾਈਕ੍ਰੋਫੋਨ ਪਹੁੰਚ ਲੋੜੀਂਦੀ ਹੈ", micUnsupported: "ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਆਵਾਜ਼ ਸਮਰਥਿਤ ਨਹੀਂ",
    matchedSchemes: "ਮਿਲੀਆਂ ਯੋਜਨਾਵਾਂ", found: "ਮਿਲੀਆਂ", schemeResultsHint: "ਚੈਟ ਵਿੱਚ ਸਥਿਤੀ ਦੱਸਣ ਤੋਂ ਬਾਅਦ ਇੱਥੇ ਨਤੀਜੇ ਦਿਖਾਈ ਦੇਣਗੇ।",
    disclaimer: "PolicyPilot ਯੋਜਨਾਵਾਂ ਸੁਝਾਉਣ ਲਈ AI ਵਰਤਦਾ ਹੈ।", emptyTitle: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ PolicyPilot ਹਾਂ", emptySub: "ਆਪਣੀ ਸਥਿਤੀ ਦੱਸੋ।",
    saveProfile: "ਸੰਭਾਲੋ ਅਤੇ ਯੋਜਨਾਵਾਂ ਲੱਭੋ", uploadMoreDocs: "ਹੋਰ ਦਸਤਾਵੇਜ਼ ਅਪਲੋਡ ਕਰੋ", language: "ਭਾਸ਼ਾ",
    uploadedPrefix: "ਅਪਲੋਡ ਕੀਤਾ:", profileTitle: "ਨਾਗਰਿਕ ਪ੍ਰੋਫਾਈਲ", profileDesc: "ਵਿਅਕਤੀਗਤ ਸਿਫ਼ਾਰਸ਼ਾਂ ਲਈ ਆਪਣੇ ਵੇਰਵੇ ਭਰੋ।",
    personalInfo: "ਨਿੱਜੀ ਜਾਣਕਾਰੀ", economicProfile: "ਆਰਥਿਕ ਪ੍ਰੋਫਾਈਲ", location: "ਸਥਾਨ", documents: "ਦਸਤਾਵੇਜ਼", schemeInterest: "ਯੋਜਨਾ ਰੁਚੀ",
  },
  as: {
    appTitle: "যোগ্যতা সহায়ক", newChat: "নতুন চেট", searchPlaceholder: "চেট বিচাৰক…", recentChats: "শেহতীয়া চেট",
    browseSchemes: "আঁচনি চাওক", citizenProfile: "নাগৰিক প্ৰফাইল", inputPlaceholder: "আপোনাৰ পৰিস্থিতি সহজ ভাষাত বৰ্ণনা কৰক…",
    sendLabel: "পঠাওক", voiceLabel: "কণ্ঠস্বৰ", uploadLabel: "আপলোড", stopListening: "বন্ধ কৰক", listening: "● শুনি আছে…",
    micDenied: "মাইক্ৰোফোন অ্যাক্সেস প্ৰয়োজন", micUnsupported: "এই ব্ৰাউজাৰত ভইচ সমৰ্থিত নহয়",
    matchedSchemes: "মিল খোৱা আঁচনি", found: "পোৱা গ'ল", schemeResultsHint: "চেটত পৰিস্থিতি বৰ্ণনা কৰাৰ পিছত আঁচনিৰ ফলাফল দেখা যাব।",
    disclaimer: "PolicyPilot AI ব্যৱহাৰ কৰে।", emptyTitle: "নমস্কাৰ! মই PolicyPilot", emptySub: "আপোনাৰ পৰিস্থিতি কওক।",
    saveProfile: "সংৰক্ষণ কৰক", uploadMoreDocs: "অধিক নথিপত্ৰ আপলোড কৰক", language: "ভাষা",
    uploadedPrefix: "আপলোড হ'ল:", profileTitle: "নাগৰিক প্ৰফাইল", profileDesc: "ব্যক্তিগতকৃত পৰামৰ্শৰ বাবে আপোনাৰ বিৱৰণ পূৰণ কৰক।",
    personalInfo: "ব্যক্তিগত তথ্য", economicProfile: "অৰ্থনৈতিক প্ৰফাইল", location: "স্থান", documents: "নথিপত্ৰ", schemeInterest: "আঁচনিৰ আগ্ৰহ",
  },
};

function useT(lang) {
  return useCallback((key) => {
    const map = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return map[key] ?? (TRANSLATIONS.en[key] ?? key);
  }, [lang]);
}

/* ═══════════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --left-w:   260px;
    --right-w:  310px;
    --header-h: 52px;
    --announce-h: 32px;
    --bg-app:           #F7F3EB;
    --surface-card:     #ffffff;
    --surface-elevated: #faf8f5;
    --sidebar-bg:       #0F2A44;
    --sidebar-border:   rgba(255,255,255,0.07);
    --right-bg:         #f7f5f0;
    --right-border:     rgba(58,52,46,0.09);
    --gold:             #c4a574;
    --gold-dim:         #a8874e;
    --gold-light:       rgba(196,165,116,0.14);
    --gold-border:      rgba(196,165,116,0.32);
    --navy:             #0F2A44;
    --navy-mid:         #1a3d5c;
    --navy-light:       rgba(15,42,68,0.08);
    --text:             #26211c;
    --text-muted:       #7a7068;
    --text-sidebar:     rgba(228,222,212,0.82);
    --text-xs:          rgba(122,112,104,0.7);
    --border:           rgba(58,52,46,0.09);
    --border-strong:    rgba(58,52,46,0.15);
    --shadow-sm:  0 1px 3px rgba(58,52,46,0.07);
    --shadow-md:  0 3px 12px rgba(58,52,46,0.09), 0 1px 3px rgba(58,52,46,0.05);
    --shadow-lg:  0 8px 32px rgba(58,52,46,0.12), 0 2px 8px rgba(58,52,46,0.06);
    --ring-gold:  0 0 0 3px rgba(196,165,116,0.16);
    --r-sm:  8px; --r-md:  12px; --r-lg:  16px; --r-pill:999px;
  }

  html, body, #root {
    height: 100%; font-family: 'DM Sans', system-ui, sans-serif;
    background: var(--bg-app); color: var(--text); -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(58,52,46,0.18); border-radius: 4px; }

  .app { display:flex; flex-direction:column; height:100vh; overflow:hidden; }

  /* ── ANNOUNCEMENT BAR ── */
  .announce-bar {
    height: var(--announce-h);
    background: linear-gradient(90deg, #0a1f33 0%, #0F2A44 40%, #1a3d5c 70%, #0a1f33 100%);
    display: flex; align-items: center; overflow: hidden; flex-shrink: 0;
    border-bottom: 1px solid rgba(196,165,116,0.2);
    position: relative;
  }
  .announce-emblem {
    display: flex; align-items: center; padding: 0 10px;
    border-right: 1px solid rgba(196,165,116,0.2);
    flex-shrink: 0; z-index: 2; background: #0a1f33;
    height: 100%;
  }
  .announce-emblem img { width: 18px; height: 18px; object-fit: contain; filter: brightness(1.2); }
  .announce-track-wrap {
    flex: 1; overflow: hidden; position: relative;
    mask-image: linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%);
  }
  .announce-track {
    display: flex; align-items: center; white-space: nowrap;
    animation: marquee 28s linear infinite;
  }
  .announce-text {
    font-size: 11px; font-weight: 600; letter-spacing: 0.05em; color: rgba(228,222,212,0.9);
    padding: 0 60px;
  }
  .announce-flag { font-size: 13px; margin-right: 6px; }
  @keyframes marquee {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  /* ── HEADER ── */
  .hdr {
    height: var(--header-h); background: var(--navy);
    border-bottom: 1px solid rgba(196,165,116,0.18); flex-shrink:0; z-index:100;
    box-shadow: 0 2px 16px rgba(15,42,68,0.35);
  }
  .hdr-in {
    height:100%; display:flex; align-items:center;
    justify-content:space-between; padding:0 18px;
  }
  .hdr-l, .hdr-r { display:flex; align-items:center; gap:10px; }
  .hdr-title-wrap { display: flex; flex-direction: column; gap: 1px; }
  .hdr-title { font-size:13.5px; font-weight:600; color: rgba(228,222,212,0.96); letter-spacing:-0.01em; }
  .hdr-motto { font-size: 9px; color: rgba(196,165,116,0.65); letter-spacing: 0.04em; font-weight: 400; }
  .ai-badge {
    font-size:8.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase;
    color:var(--gold); background:rgba(196,165,116,0.15); border:1px solid var(--gold-border);
    padding:2px 7px; border-radius:var(--r-pill);
  }
  .lang-wrap { display:flex; align-items:center; gap:6px; }
  .lang-lbl  { font-size:11px; color:rgba(196,165,116,0.7); font-weight:500; }
  .lang-sel  {
    font-size:12px; font-weight:500; color:rgba(228,222,212,0.9);
    background:rgba(255,255,255,0.08); border:1px solid rgba(196,165,116,0.28);
    border-radius:var(--r-sm); padding:4px 8px; font-family:inherit; cursor:pointer; outline:none; transition:border-color 0.18s;
  }
  .lang-sel:focus { border-color:var(--gold); box-shadow:0 0 0 2px rgba(196,165,116,0.2); }
  .lang-sel option { background: #0F2A44; color: rgba(228,222,212,0.9); }

  /* Dark mode toggle */
  .theme-toggle {
    width: 32px; height: 32px; border-radius: var(--r-sm); border: 1px solid rgba(196,165,116,0.28);
    background: rgba(255,255,255,0.07); color: rgba(196,165,116,0.8); cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all 0.18s; font-size: 14px;
  }
  .theme-toggle:hover { background: rgba(196,165,116,0.15); color: var(--gold); }

  /* Auth button in header */
  .auth-btn-hdr {
    display: flex; align-items: center; gap: 6px; padding: 5px 12px;
    border-radius: var(--r-pill); border: 1px solid rgba(196,165,116,0.35);
    background: rgba(196,165,116,0.1); color: rgba(228,222,212,0.9);
    font-size: 11.5px; font-weight: 600; cursor: pointer; font-family: inherit;
    transition: all 0.18s; letter-spacing: 0.02em;
  }
  .auth-btn-hdr:hover { background: rgba(196,165,116,0.2); border-color: var(--gold); }
  .auth-avatar {
    width: 26px; height: 26px; border-radius: 50%; background: var(--gold);
    color: var(--navy); font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    cursor: pointer; border: 1.5px solid rgba(196,165,116,0.5);
    position: relative;
  }
  .auth-dropdown {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: var(--surface-card); border: 1px solid var(--border-strong);
    border-radius: var(--r-md); min-width: 160px; box-shadow: var(--shadow-lg);
    z-index: 200; overflow: hidden; animation: fadeUp 0.15s ease both;
  }
  .auth-dropdown-item {
    display: flex; align-items: center; gap: 8px; padding: 9px 13px;
    font-size: 12.5px; color: var(--text); cursor: pointer; transition: background 0.13s;
    border: none; background: transparent; width: 100%; font-family: inherit; text-align: left;
  }
  .auth-dropdown-item:hover { background: var(--bg-app); }
  .auth-dropdown-item.danger { color: #c0392b; }

  .app-body { display:flex; flex:1; overflow:hidden; }

  /* ── SIDEBAR ── */
  .sidebar {
    width:var(--left-w); flex-shrink:0; background:var(--sidebar-bg);
    display:flex; flex-direction:column; height:100%; overflow:hidden;
    border-right:1px solid var(--sidebar-border); position:relative; z-index:10;
    transition: width 0.25s cubic-bezier(0.22,1,0.36,1);
  }
  .sidebar.collapsed { width: 0; }
  .sb-brand {
    display:flex; align-items:center; gap:9px; padding:14px 14px 10px;
    border-bottom:1px solid rgba(255,255,255,0.06);
  }
  .sb-name { font-family:'DM Serif Display',serif; font-size:15px; color:rgba(228,222,212,0.96); letter-spacing:-0.01em; }
  .sb-tag  { font-size:9px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; color:rgba(196,165,116,0.55); line-height:1; }
  .new-chat-btn {
    margin:10px 10px 6px; padding:9px 13px; border-radius:var(--r-md);
    border:1px solid rgba(196,165,116,0.3); background:rgba(196,165,116,0.09);
    color:var(--gold); font-size:12px; font-weight:600; font-family:inherit;
    cursor:pointer; transition:all 0.18s; letter-spacing:0.02em;
    display:flex; align-items:center; justify-content:center; gap:6px;
    position: relative; overflow: hidden;
  }
  .new-chat-btn::after {
    content: ''; position: absolute; inset: 0; border-radius: inherit;
    background: radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%);
    opacity: 0; transition: opacity 0.3s;
  }
  .new-chat-btn:active::after { opacity: 1; }
  .new-chat-btn:hover { background:rgba(196,165,116,0.17); border-color:rgba(196,165,116,0.52); box-shadow:0 2px 8px rgba(196,165,116,0.12); }
  .sb-search { padding:0 10px 6px; }
  .sb-search-wrap { position:relative; display:flex; align-items:center; }
  .sb-search-icon { position:absolute; left:9px; pointer-events:none; opacity:0.38; }
  .sb-search-inp {
    width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.07);
    border-radius:var(--r-sm); padding:7px 10px 7px 29px;
    color:var(--text-sidebar); font-size:12px; font-family:inherit; outline:none; transition:border-color 0.18s;
  }
  .sb-search-inp::placeholder { color:rgba(225,233,246,0.22); }
  .sb-search-inp:focus { border-color:rgba(196,165,116,0.38); }
  .sb-div { height:1px; background:rgba(255,255,255,0.055); margin:3px 10px; }
  .sb-scroll { flex:1; overflow-y:auto; padding:0 6px 6px; }
  .sb-lbl { font-size:9px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:rgba(255,255,255,0.22); padding:8px 8px 4px; margin:0; }
  .hist-list { list-style:none; }
  .hist-btn {
    display:flex; align-items:center; justify-content:space-between; gap:6px; width:100%; padding:7px 10px; border-radius:var(--r-sm);
    border:none; background:transparent; cursor:pointer; transition:background 0.14s; color:var(--text-sidebar); font-family:inherit;
    position: relative; overflow: hidden;
  }
  .hist-btn::after {
    content: ''; position: absolute; inset: 0; border-radius: inherit;
    background: radial-gradient(circle at var(--rx, 50%) var(--ry, 50%), rgba(255,255,255,0.12) 0%, transparent 60%);
    opacity: 0; transition: opacity 0.3s;
  }
  .hist-btn:active::after { opacity: 1; }
  .hist-btn:hover  { background:rgba(255,255,255,0.065); }
  .hist-btn.active { background:rgba(196,165,116,0.15); color:var(--gold); }
  .hist-ttl { font-size:12px; font-weight:500; text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:150px; }
  .hist-meta { font-size:10px; color:rgba(255,255,255,0.24); flex-shrink:0; }
  .scheme-nav-btn {
    display:flex; align-items:center; gap:8px; width:100%; padding:7px 10px;
    border-radius:var(--r-sm); border:none; background:transparent; cursor:pointer;
    transition:background 0.14s; color:rgba(228,222,212,0.65); font-family:inherit; text-align:left;
  }
  .scheme-nav-btn:hover  { background:rgba(255,255,255,0.06); color:rgba(228,222,212,0.9); }
  .scheme-nav-btn.active { background:rgba(196,165,116,0.13); color:var(--gold); }
  .sn-dot  { width:7px; height:7px; border-radius:50%; flex-shrink:0; opacity:0.8; }
  .sn-name { font-size:13px; font-weight:500; }
  .sn-cat  { font-size:10px; color:rgba(255,255,255,0.24); margin-left:auto; flex-shrink:0; }
  .sb-footer { padding:10px; border-top:1px solid rgba(255,255,255,0.06); flex-shrink:0; }
  .profile-btn {
    width:100%; padding:9px 12px; border-radius:var(--r-md);
    border:1px solid rgba(255,255,255,0.10); background:rgba(255,255,255,0.04);
    color:rgba(228,222,212,0.62); font-size:12px; font-weight:500; font-family:inherit;
    cursor:pointer; transition:all 0.18s; display:flex; align-items:center; justify-content:center; gap:6px;
  }
  .profile-btn:hover { background:rgba(255,255,255,0.09); color:rgba(228,222,212,0.92); border-color:rgba(255,255,255,0.18); }

  /* ── SIDEBAR TOGGLE BUTTON (close — inside sidebar, above New Chat) ── */
  .sidebar-toggle {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 50%; background: transparent;
    border: 1.5px solid rgba(196,165,116,0.28); cursor: pointer;
    color: rgba(196,165,116,0.75); font-size: 13px; transition: all 0.18s;
    flex-shrink: 0;
  }
  .sidebar-toggle:hover { background: rgba(196,165,116,0.15); color: var(--gold); border-color: rgba(196,165,116,0.55); }

  /* ── SIDEBAR OPEN BUTTON (floating, shown when sidebar is collapsed) ── */
  .sidebar-open-btn {
    position: fixed; left: 10px; top: calc(var(--announce-h) + var(--header-h) + 10px); z-index: 300;
    width: 32px; height: 32px; border-radius: 50%; background: var(--navy);
    border: 1.5px solid rgba(196,165,116,0.4); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--gold); font-size: 13px; transition: all 0.18s; box-shadow: var(--shadow-md);
  }
  .sidebar-open-btn:hover { background: #1a3d5c; border-color: var(--gold); box-shadow: 0 4px 14px rgba(15,42,68,0.35); }

  /* ── STEP PROGRESS TRACKER ── */
  .step-tracker {
    display: flex; align-items: center; gap: 0;
    padding: 10px 22px 0; flex-shrink: 0;
  }
  .step-item {
    display: flex; align-items: center; gap: 6px; flex: 1; position: relative;
  }
  .step-item:last-child { flex: 0; }
  .step-circle {
    width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center;
    justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0;
    transition: all 0.3s ease; border: 2px solid transparent;
  }
  .step-circle.done { background: #2d6a4f; color: white; border-color: #2d6a4f; }
  .step-circle.active { background: var(--navy); color: rgba(228,222,212,0.95); border-color: var(--navy); box-shadow: 0 0 0 3px rgba(15,42,68,0.15); }
  .step-circle.pending { background: #E8DFC9; color: var(--text-muted); border-color: rgba(58,52,46,0.15); }
  .step-label { font-size: 10px; font-weight: 600; letter-spacing: 0.03em; white-space: nowrap; }
  .step-label.done { color: #2d6a4f; }
  .step-label.active { color: var(--navy); }
  .step-label.pending { color: var(--text-muted); }
  .step-connector {
    flex: 1; height: 2px; margin: 0 6px; border-radius: 1px;
    transition: background 0.3s;
  }
  .step-connector.done { background: #2d6a4f; }
  .step-connector.pending { background: rgba(58,52,46,0.12); }
  .step-lock { font-size: 10px; margin-left: 2px; }

  /* ── CHAT CANVAS ── */
  .chat-canvas {
    flex:1; overflow-y:auto;
    background:linear-gradient(168deg, #F7F3EB 0%, #ece7db 100%); position:relative;
    display: flex; flex-direction: column;
  }
  .chat-canvas::before {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background: radial-gradient(ellipse at 65% 18%, rgba(196,165,116,0.05) 0%, transparent 55%), radial-gradient(ellipse at 18% 82%, rgba(15,42,68,0.04) 0%, transparent 50%);
  }
  .canvas-in { position:relative; z-index:1; max-width:680px; margin:0 auto; padding:28px 22px 0; display:flex; flex-direction:column; min-height:100%; width: 100%; }
  .msgs-col { display:flex; flex-direction:column; gap:24px; flex:1; }
  .turn { display:flex; gap:10px; }
  .ai-turn   { align-items:flex-start; }
  .user-turn { justify-content:flex-end; }
  .turn-av {
    width:28px; height:28px; border-radius:50%;
    background:rgba(15,42,68,0.1); border:1px solid rgba(15,42,68,0.2);
    display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:4px;
  }
  .turn-av-dot { width:8px; height:8px; border-radius:50%; background:var(--navy); }
  .turn-body { display:flex; flex-direction:column; gap:5px; max-width:600px; }
  .turn-meta { display:flex; align-items:center; gap:6px; }
  .user-meta { justify-content:flex-end; }
  .turn-name { font-size:12px; font-weight:650; color:var(--text); }
  .turn-time { font-size:10.5px; color:var(--text-muted); }
  .ai-card {
    background:var(--surface-card); border:1px solid var(--border);
    border-left:3px solid rgba(15,42,68,0.35); border-radius:var(--r-lg);
    padding:17px 19px; box-shadow:var(--shadow-md);
    animation: fadeUp 0.3s ease both;
  }
  .ai-txt { font-size:15px; color:var(--text); line-height:1.68; }
  .ai-steps { margin:10px 0 0; display:flex; flex-direction:column; gap:7px; }
  .ai-step  { display:flex; align-items:flex-start; gap:9px; font-size:13px; color:var(--text); line-height:1.55; }
  .ai-step-n {
    width:20px; height:20px; border-radius:50%;
    background:rgba(15,42,68,0.08); border:1px solid rgba(15,42,68,0.2);
    color:var(--navy); font-size:10px; font-weight:700;
    display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px;
  }
  .user-bubble {
    background:linear-gradient(135deg, #0F2A44 0%, #1a3d5c 100%);
    color:rgba(240,236,228,0.95); padding:12px 17px;
    border-radius:14px 14px 3px 14px; font-size:15px; line-height:1.6;
    box-shadow:0 2px 10px rgba(15,42,68,0.28); max-width:480px;
    animation: fadeUp 0.25s ease both;
  }
  .quick-chips { display:flex; flex-wrap:wrap; gap:7px; margin-top:13px; }
  .chip {
    padding:6px 13px; border-radius:var(--r-pill); border:1px solid var(--border-strong);
    background:var(--bg-app); color:var(--text-muted); font-size:13.5px; font-weight:500;
    font-family:inherit; cursor:pointer; transition:all 0.18s; position: relative; overflow: hidden;
  }
  .chip::after {
    content: ''; position: absolute; inset: 0; border-radius: inherit;
    background: radial-gradient(circle at center, rgba(15,42,68,0.12) 0%, transparent 70%);
    opacity: 0; transition: opacity 0.3s;
  }
  .chip:active::after { opacity: 1; }
  .chip:hover { background:rgba(15,42,68,0.07); border-color:rgba(15,42,68,0.2); color:var(--navy); }

  .empty-state {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    flex:1; gap:14px; padding:40px 20px; text-align:center; animation:fadeUp 0.4s ease both;
  }
  .empty-orb {
    width:64px; height:64px; border-radius:50%;
    background:radial-gradient(circle at 38% 32%, rgba(15,42,68,0.15), rgba(15,42,68,0.04));
    border:1.5px solid rgba(15,42,68,0.2); display:flex; align-items:center; justify-content:center;
  }
  .empty-ttl { font-family:'DM Serif Display',serif; font-size:22px; color:var(--text); line-height:1.2; }
  .empty-sub { font-size:15px; color:var(--text-muted); max-width:310px; line-height:1.6; }

  /* Primary CTA button */
  .find-schemes-cta {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 32px; border-radius: 12px; border: none;
    background: var(--navy); color: rgba(228,222,212,0.95);
    font-size: 14px; font-weight: 700; font-family: inherit;
    cursor: pointer; letter-spacing: 0.02em;
    box-shadow: 0 4px 16px rgba(15,42,68,0.3), 0 1px 4px rgba(15,42,68,0.2);
    transition: all 0.2s; position: relative; overflow: hidden;
    margin-top: 6px;
  }
  .find-schemes-cta:hover {
    background: #1a3d5c; transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(15,42,68,0.38), 0 2px 6px rgba(15,42,68,0.2);
  }
  .find-schemes-cta::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at center, rgba(196,165,116,0.25) 0%, transparent 70%);
    opacity: 0; transition: opacity 0.3s;
  }
  .find-schemes-cta:active::after { opacity: 1; }

  /* ── AI LOADING SHIMMER ── */
  .ai-thinking {
    background: var(--surface-card); border: 1px solid var(--border);
    border-left: 3px solid rgba(15,42,68,0.35); border-radius: var(--r-lg);
    padding: 17px 19px; box-shadow: var(--shadow-md);
    display: flex; flex-direction: column; gap: 10px;
  }
  .thinking-msg {
    font-size: 12.5px; color: var(--navy); font-weight: 500;
    display: flex; align-items: center; gap: 8px;
    animation: fadeIn 0.35s ease both;
  }
  .thinking-emoji { font-size: 15px; }
  .shimmer-lines { display: flex; flex-direction: column; gap: 7px; margin-top: 4px; }
  .shimmer-line {
    height: 11px; border-radius: 6px;
    background: linear-gradient(90deg, rgba(15,42,68,0.06) 0%, rgba(15,42,68,0.12) 50%, rgba(15,42,68,0.06) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── ERROR PANEL ── */
  .error-panel {
    background: #fdf6f0; border: 1px solid rgba(181,85,10,0.25); border-radius: var(--r-lg);
    padding: 14px 16px; display: flex; align-items: flex-start; gap: 10px;
    animation: fadeUp 0.3s ease both;
  }
  .error-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  .error-body { flex: 1; }
  .error-msg { font-size: 13px; color: #7a3d10; font-weight: 500; line-height: 1.5; }
  .error-retry {
    margin-top: 8px; padding: 5px 14px; border-radius: 8px;
    border: 1px solid rgba(181,85,10,0.3); background: transparent;
    color: #7a3d10; font-size: 11.5px; font-weight: 600; font-family: inherit;
    cursor: pointer; transition: all 0.18s;
  }
  .error-retry:hover { background: rgba(181,85,10,0.08); }

  /* ── INPUT ── */
  .input-shell {
    position:sticky; bottom:0; padding:14px 0 10px;
    background:linear-gradient(to top, rgba(235,229,218,1) 55%, transparent); z-index:20;
  }
  .input-box {
    display:flex; align-items:center; gap:4px; background:var(--surface-card);
    border:1px solid var(--border-strong); border-radius:14px; padding:5px 7px;
    box-shadow:var(--shadow-lg); transition:box-shadow 0.2s, border-color 0.2s;
  }
  .input-box:focus-within { border-color:rgba(15,42,68,0.3); box-shadow:var(--shadow-lg), 0 0 0 3px rgba(15,42,68,0.1); }
  .input-tools { display:flex; align-items:center; gap:2px; }
  .itool {
    width:33px; height:33px; border-radius:var(--r-sm); border:none; background:transparent;
    color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center;
    transition:background 0.14s, color 0.14s; position: relative; overflow: hidden;
  }
  .itool::after {
    content: ''; position: absolute; inset: 0; border-radius: inherit;
    background: radial-gradient(circle at center, rgba(15,42,68,0.15) 0%, transparent 70%);
    opacity: 0; transition: opacity 0.3s;
  }
  .itool:active::after { opacity: 1; }
  .itool:hover { background:var(--bg-app); color:var(--text); }
  .itool.listening {
    background:rgba(220,50,50,0.08); color:#c0392b;
    animation: micPulse 1.2s ease-in-out infinite;
  }
  @keyframes micPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(192,57,43,0.35); }
    50%      { box-shadow: 0 0 0 6px rgba(192,57,43,0); }
  }
  .ifield {
    flex:1; border:none; outline:none; background:transparent; font-family:inherit;
    font-size:15px; color:var(--text); padding:6px 8px;
  }
  .ifield::placeholder { color:var(--text-muted); transition: opacity 0.4s ease; }
  .ifield.fade-placeholder::placeholder { opacity: 0; }
  .isend {
    width:35px; height:35px; border-radius:var(--r-sm); border:none;
    background:var(--navy); color:var(--gold); cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:background 0.15s, transform 0.15s;
    position: relative; overflow: hidden;
  }
  .isend::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at center, rgba(196,165,116,0.3) 0%, transparent 70%);
    opacity: 0; transition: opacity 0.3s;
  }
  .isend:active::after { opacity: 1; }
  .isend:hover { background:#1a3d5c; transform:scale(1.04); }
  .listen-pill { text-align:center; font-size:11.5px; color:#c0392b; font-weight:500; margin-top:5px; animation:fadeIn 0.2s ease; }
  .mic-error   { text-align:center; font-size:11.5px; color:#c0392b; font-weight:500; margin-top:5px; }
  .chat-note   { text-align:center; font-size:10.5px; color:var(--text-xs); padding:8px 0 14px; }

  /* Chat upload preview */
  .chat-upload-preview {
    display:flex; align-items:center; gap:6px; padding:5px 10px;
    background:rgba(15,42,68,0.06); border:1px solid rgba(15,42,68,0.15);
    border-radius:var(--r-sm); margin:3px 0;
    font-size:11.5px; color:var(--navy); font-weight:500;
    animation: fadeIn 0.2s ease;
  }
  .chat-upload-preview span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px; }

  /* Drag & drop upload zone */
  .drag-zone {
    border: 2px dashed rgba(15,42,68,0.2); border-radius: var(--r-md);
    padding: 18px; text-align: center; cursor: pointer; transition: all 0.2s;
    background: rgba(15,42,68,0.02);
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .drag-zone.drag-over {
    border-color: var(--navy); background: rgba(15,42,68,0.07);
    box-shadow: 0 0 0 3px rgba(15,42,68,0.1);
  }
  .drag-zone:hover { border-color: rgba(15,42,68,0.35); background: rgba(15,42,68,0.04); }
  .drag-icon { font-size: 24px; }
  .drag-label { font-size: 12.5px; font-weight: 600; color: var(--navy); }
  .drag-hint  { font-size: 11px; color: var(--text-muted); }
  .upload-progress-wrap { width: 100%; }
  .upload-progress-bar {
    width: 100%; height: 4px; border-radius: 2px; background: rgba(15,42,68,0.1); overflow: hidden;
  }
  .upload-progress-fill {
    height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--navy), rgba(15,42,68,0.7));
    transition: width 0.3s ease;
  }
  .upload-success {
    display: flex; align-items: center; gap: 6px; padding: 6px 10px;
    background: rgba(45,106,79,0.09); border: 1px solid rgba(45,106,79,0.22);
    border-radius: 7px; font-size: 11.5px; color: #2d6a4f; font-weight: 600;
    animation: fadeIn 0.25s ease;
  }
  .upload-success-tick {
    width: 16px; height: 16px; border-radius: 50%; background: #2d6a4f;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    font-size: 9px; color: white;
    animation: popIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes popIn {
    from { transform: scale(0); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }

  /* DigiLocker button */
  .digilocker-btn {
    display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px;
    border-radius: var(--r-md); border: 1.5px solid rgba(15,42,68,0.25);
    background: #F7F3EB; color: var(--navy); font-size: 12.5px; font-weight: 600;
    font-family: inherit; cursor: pointer; transition: all 0.2s; text-align: left;
  }
  .digilocker-btn:hover {
    border-color: var(--navy); background: rgba(15,42,68,0.04);
    box-shadow: 0 0 0 3px rgba(15,42,68,0.08);
  }
  .digilocker-icon { font-size: 16px; flex-shrink: 0; }
  .digilocker-trusted {
    margin-left: auto; font-size: 9px; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; color: #2d6a4f; background: rgba(45,106,79,0.1);
    border: 1px solid rgba(45,106,79,0.25); padding: 2px 7px; border-radius: var(--r-pill);
    flex-shrink: 0;
  }
  .digilocker-hint {
    font-size: 10.5px; color: var(--text-muted); margin-top: 4px; line-height: 1.4;
  }
  .digilocker-divider {
    display: flex; align-items: center; gap: 8px; margin: 8px 0;
  }
  .digilocker-divider-line { flex: 1; height: 1px; background: var(--border); }
  .digilocker-divider-text { font-size: 10px; color: var(--text-muted); font-weight: 600; letter-spacing: 0.06em; white-space: nowrap; }
  .secure-badge {
    display: flex; align-items: center; gap: 6px; padding: 6px 10px;
    background: rgba(45,106,79,0.08); border: 1px solid rgba(45,106,79,0.2);
    border-radius: 8px; font-size: 11px; color: #2d6a4f; font-weight: 600; margin-top: 6px;
  }
  .secure-badge-lock { font-size: 13px; }

  /* Auth section in form */
  .auth-section {
    margin: 12px 22px 4px;
    border-radius: var(--r-lg);
    border: 1.5px solid var(--border);
    padding: 14px 16px;
    background: rgba(255,255,255,0.5);
    display: flex; flex-direction: column; gap: 10px;
  }
  .auth-section-title {
    font-size: 10px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 2px;
  }
  .auth-sign-in-btn {
    width: 100%; padding: 11px 16px; border-radius: 11px; border: none;
    background: var(--navy); color: rgba(228,222,212,0.95);
    font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer;
    transition: background 0.18s; box-shadow: 0 2px 8px rgba(15,42,68,0.2);
    position: relative; overflow: hidden;
  }
  .auth-sign-in-btn::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at center, rgba(196,165,116,0.25) 0%, transparent 70%);
    opacity: 0; transition: opacity 0.3s;
  }
  .auth-sign-in-btn:active::after { opacity: 1; }
  .auth-sign-in-btn:hover { background: #1a3d5c; }
  .auth-guest-link {
    text-align: center; font-size: 12px; color: var(--text-muted); font-weight: 500;
    cursor: pointer; padding: 4px; text-decoration: underline; text-underline-offset: 3px;
    background: none; border: none; font-family: inherit; width: 100%;
  }
  .auth-guest-link:hover { color: var(--text); }

  /* ── TYPING ── */
  @keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
  .typing-dots { display:flex; gap:4px; align-items:center; }
  .tdot { width:6px; height:6px; border-radius:50%; background:var(--navy); animation:blink 1.2s infinite; }
  .tdot:nth-child(2){animation-delay:0.2s} .tdot:nth-child(3){animation-delay:0.4s}

  /* ── RIGHT PANEL ── */
  .right-panel {
    width:var(--right-w); flex-shrink:0; background:var(--right-bg);
    border-left:1px solid var(--right-border); display:flex; flex-direction:column;
    height:100%; overflow:hidden;
  }
  .rp-hdr {
    padding:13px 15px 11px; border-bottom:1px solid var(--right-border);
    display:flex; align-items:center; justify-content:space-between; flex-shrink:0;
    background:var(--surface-elevated);
  }
  .rp-hdr-l { display:flex; align-items:center; gap:7px; }
  .rp-ttl { font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-muted); }
  .rp-count { font-size:10px; font-weight:700; letter-spacing:0.04em; background:rgba(15,42,68,0.08); color:var(--navy); border:1px solid rgba(15,42,68,0.18); padding:2px 8px; border-radius:var(--r-pill); }
  .rp-scroll { flex:1; overflow-y:auto; padding:13px 11px; display:flex; flex-direction:column; gap:11px; }
  .rp-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:10px; text-align:center; padding:24px; color:var(--text-muted); }
  .rp-empty-ico { width:48px; height:48px; border-radius:50%; background:rgba(58,52,46,0.05); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:20px; }
  .rp-empty-txt { font-size:14px; line-height:1.55; max-width:195px; }

  /* ── RESULT CARD ── */
  .rc {
    background:var(--surface-card); border:1px solid var(--border); border-radius:13px;
    padding:13px 14px; box-shadow:var(--shadow-sm);
    transition:box-shadow 0.2s, transform 0.2s, opacity 0.4s;
    cursor:default;
    opacity: 0; transform: translateY(10px);
  }
  .rc.visible {
    opacity: 1; transform: translateY(0);
    animation: cardReveal 0.35s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes cardReveal {
    from { opacity: 0; transform: translateY(12px); box-shadow: none; }
    to   { opacity: 1; transform: translateY(0); }
  }
  .rc:hover { box-shadow:var(--shadow-md); transform:translateY(-2px); }
  .rc-top { display:flex; align-items:flex-start; justify-content:space-between; gap:6px; margin-bottom:7px; }
  .rc-tag { font-size:9.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:2px 8px; border-radius:var(--r-pill); flex-shrink:0; }
  .rc-draft { font-size:9px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#1d6fa4; background:rgba(29,111,164,0.09); border:1px solid rgba(29,111,164,0.2); padding:2px 7px; border-radius:var(--r-pill); white-space:nowrap; flex-shrink:0; }
  .rc-ttl { font-size:15px; font-weight:700; color:var(--text); line-height:1.3; margin-bottom:5px; }
  .rc-rsn { font-size:13px; color:var(--text-muted); line-height:1.5; margin-bottom:7px; }
  .rc-match { display: flex; align-items: center; gap: 5px; margin-bottom: 7px; }
  .rc-match-bar { flex: 1; height: 5px; border-radius: 3px; background: rgba(58,52,46,0.08); overflow: hidden; }
  .rc-match-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
  .rc-match-pct { font-size: 10px; font-weight: 700; flex-shrink: 0; }
  .rc-buls { display:flex; flex-direction:column; gap:4px; margin-bottom: 10px; }
  .rc-bul  { display:flex; align-items:flex-start; gap:7px; font-size:13px; color:var(--text); line-height:1.45; }
  .rc-dot  { width:5px; height:5px; border-radius:50%; flex-shrink:0; margin-top:5px; opacity:0.7; }
  .rc-cta {
    width: 100%; padding: 7px 10px; border-radius: 8px; border: 1px solid rgba(15,42,68,0.18);
    background: rgba(15,42,68,0.05); color: var(--navy); font-size: 11.5px; font-weight: 600;
    font-family: inherit; cursor: pointer; transition: all 0.18s; text-align: center;
    position: relative; overflow: hidden;
  }
  .rc-cta::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at center, rgba(15,42,68,0.12) 0%, transparent 70%);
    opacity: 0; transition: opacity 0.3s;
  }
  .rc-cta:active::after { opacity: 1; }
  .rc-cta:hover { background: rgba(15,42,68,0.1); border-color: rgba(15,42,68,0.3); }

  /* Explainability panel */
  .explain-toggle {
    display: flex; align-items: center; gap: 6px; width: 100%;
    padding: 6px 0; background: none; border: none; cursor: pointer;
    color: var(--navy); font-size: 11px; font-weight: 600; font-family: inherit;
    letter-spacing: 0.02em; margin-bottom: 6px;
  }
  .explain-toggle:hover { color: var(--navy-mid); }
  .explain-chevron { transition: transform 0.22s; font-size: 10px; }
  .explain-chevron.open { transform: rotate(90deg); }
  .explain-panel {
    overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease;
    max-height: 0; opacity: 0;
  }
  .explain-panel.open { max-height: 200px; opacity: 1; }
  .explain-inner {
    background: #E8DFC9; border-radius: 9px; padding: 10px 12px;
    display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;
  }
  .explain-row { display: flex; align-items: center; gap: 7px; font-size: 11px; color: var(--text); }
  .explain-tick { color: #2d6a4f; font-size: 11px; flex-shrink: 0; }
  .explain-ai-badge {
    display: flex; align-items: center; gap: 4px; padding: 2px 7px;
    background: rgba(15,42,68,0.08); border-radius: var(--r-pill);
    font-size: 9px; font-weight: 700; color: var(--navy); letter-spacing: 0.05em;
    margin-bottom: 6px; width: fit-content;
  }

  /* Conflict graph */
  .conflict-graph {
    display: flex; align-items: center; gap: 6px; padding: 8px 10px;
    background: rgba(220,50,50,0.04); border: 1px solid rgba(220,50,50,0.18);
    border-radius: 9px; margin-top: 6px; margin-bottom: 4px;
    animation: fadeIn 0.4s ease both;
  }
  .conflict-pill {
    padding: 4px 10px; border-radius: var(--r-pill);
    border: 1px solid rgba(58,52,46,0.18); background: var(--surface-card);
    font-size: 10px; font-weight: 600; color: var(--text); white-space: nowrap;
    flex-shrink: 0;
  }
  .conflict-line {
    flex: 1; display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .conflict-line-inner {
    width: 100%; height: 2px; background: rgba(220,50,50,0.4);
    border-radius: 1px; position: relative;
    animation: conflictPulse 2s ease-in-out infinite;
  }
  @keyframes conflictPulse {
    0%,100% { opacity: 0.4; } 50% { opacity: 1; }
  }
  .conflict-badge {
    position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
    background: white; padding: 1px 4px; border-radius: 4px;
    font-size: 9px; font-weight: 700; color: #c0392b; letter-spacing: 0.04em;
    border: 1px solid rgba(192,57,43,0.25); white-space: nowrap;
  }

  /* ── PROFILE SHEET ── */
  .overlay { position:fixed; inset:0; background:rgba(26,23,20,0.42); backdrop-filter:blur(3px); z-index:300; cursor:pointer; animation:fadeIn 0.2s ease; }
  .sheet {
    position:fixed; right:0; top:0; bottom:0; width:480px; max-width:95vw;
    background:var(--surface-elevated); z-index:400; transform:translateX(100%);
    transition:transform 0.3s cubic-bezier(0.22,1,0.36,1);
    display:flex; flex-direction:column; box-shadow:-8px 0 48px rgba(26,23,20,0.16);
  }
  .sheet.open { transform:translateX(0); }
  .sheet-inner { flex:1; overflow-y:auto; padding:0 0 20px; display:flex; flex-direction:column; }
  .sheet-head {
    display:flex; align-items:center; justify-content:space-between;
    padding:18px 22px 14px; background:var(--navy);
    border-bottom:1px solid rgba(255,255,255,0.06); flex-shrink:0;
  }
  .sheet-head-l { display:flex; align-items:center; gap:10px; }
  .sheet-head h2 { font-family:'DM Serif Display',serif; font-size:17px; color:rgba(228,222,212,0.96); margin:0; }
  .sheet-cls {
    width:30px; height:30px; border-radius:var(--r-sm); border:1px solid rgba(255,255,255,0.12);
    background:rgba(255,255,255,0.06); color:rgba(228,222,212,0.65); font-size:17px;
    display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background 0.15s;
  }
  .sheet-cls:hover { background:rgba(255,255,255,0.13); color:white; }
  .sheet-desc { font-size:14px; color:var(--text-muted); line-height:1.55; padding:14px 22px 6px; }
  .form-stack { display:flex; flex-direction:column; gap:12px; padding:12px 22px 4px; }
  .fsec { border-radius:13px; border:1.5px solid var(--border); overflow:hidden; }
  .fsec-hd { display:flex; align-items:center; gap:8px; padding:10px 14px 9px; border-bottom:1px solid var(--border); background:rgba(255,255,255,0.5); }
  .fsec-ico { width:24px; height:24px; border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0; }
  .fsec-lbl { font-size:10px; font-weight:700; letter-spacing:0.09em; text-transform:uppercase; }
  .fsec-body { padding:12px 14px 14px; display:flex; flex-direction:column; gap:11px; }
  .fld { display:flex; flex-direction:column; gap:4px; }
  .fld-lbl { font-size:12.5px; font-weight:600; color:var(--text-muted); letter-spacing:0.03em; }
  .fld-req { color:#c0392b; font-size:9px; margin-left:3px; }
  .fld-hint { font-size:11.5px; color:var(--text-xs); margin-top:2px; display:flex; align-items:center; gap:4px; }

  /* Pill toggle buttons */
  .pill-toggle-group { display: flex; gap: 6px; flex-wrap: wrap; }
  .pill-toggle {
    padding: 6px 14px; border-radius: var(--r-pill);
    border: 1.5px solid rgba(58,52,46,0.18); background: transparent;
    color: var(--text-muted); font-size: 12px; font-weight: 600;
    font-family: inherit; cursor: pointer; transition: all 0.18s; letter-spacing: 0.02em;
  }
  .pill-toggle.selected {
    background: var(--navy); color: rgba(228,222,212,0.95); border-color: var(--navy);
    box-shadow: 0 2px 8px rgba(15,42,68,0.2);
  }
  .pill-toggle:hover:not(.selected) { border-color: rgba(15,42,68,0.35); color: var(--navy); background: rgba(15,42,68,0.04); }

  /* Segmented toggle */
  .seg-toggle { display: flex; border-radius: 9px; border: 1.5px solid rgba(58,52,46,0.15); overflow: hidden; background: rgba(255,255,255,0.5); }
  .seg-btn {
    flex: 1; padding: 7px 10px; border: none; background: transparent;
    color: var(--text-muted); font-size: 12px; font-weight: 600; font-family: inherit;
    cursor: pointer; transition: all 0.18s; border-right: 1px solid rgba(58,52,46,0.1);
  }
  .seg-btn:last-child { border-right: none; }
  .seg-btn.selected { background: var(--navy); color: rgba(228,222,212,0.95); }
  .seg-btn:hover:not(.selected) { background: rgba(15,42,68,0.06); color: var(--navy); }

  /* Scheme scope toggle */
  .scope-toggle { display: flex; border-radius: 10px; border: 1.5px solid rgba(15,42,68,0.18); overflow: hidden; background: #E8DFC9; }
  .scope-btn {
    flex: 1; padding: 8px 12px; border: none; background: transparent;
    color: var(--text-muted); font-size: 11.5px; font-weight: 600; font-family: inherit;
    cursor: pointer; transition: all 0.2s; text-align: center;
  }
  .scope-btn.active { background: var(--navy); color: rgba(228,222,212,0.95); }
  .scope-btn:hover:not(.active) { background: rgba(15,42,68,0.07); color: var(--navy); }

  /* Income slider */
  .income-range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; background: rgba(15,42,68,0.15); outline: none; cursor: pointer; }
  .income-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--navy); cursor: pointer; box-shadow: 0 1px 4px rgba(15,42,68,0.3); }
  .income-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--navy); cursor: pointer; border: none; }
  .income-labels { display: flex; justify-content: space-between; margin-top: 4px; }
  .income-label { font-size: 9px; color: var(--text-xs); }
  .income-selected { font-size: 12px; font-weight: 700; color: var(--navy); margin-bottom: 4px; }

  /* Upload in profile sheet */
  .upload-ph {
    display:flex; align-items:center; gap:10px; padding:10px 12px;
    border-radius:var(--r-md); border:1.5px dashed var(--border-strong);
    background:rgba(255,255,255,0.4); cursor:pointer; transition:all 0.18s;
    position:relative;
  }
  .upload-ph:hover { border-color:rgba(15,42,68,0.35); background:rgba(15,42,68,0.04); }
  .upload-ico { width:30px; height:30px; border-radius:var(--r-sm); background:rgba(15,42,68,0.07); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .upload-info { display:flex; flex-direction:column; gap:1px; flex:1; min-width:0; }
  .upload-name { font-size:12px; font-weight:600; color:var(--text); }
  .upload-hint { font-size:10.5px; color:var(--text-muted); }
  .upload-preview {
    display:flex; align-items:center; gap:5px; margin-top:5px; padding:4px 8px;
    background:rgba(45,106,79,0.08); border:1px solid rgba(45,106,79,0.22);
    border-radius:6px; font-size:11px; color:#2d6a4f; font-weight:600;
    animation: fadeIn 0.2s ease;
  }
  .upload-preview .up-tick { font-size:12px; }
  .upload-preview span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px; }

  .sheet-acts { display:flex; gap:9px; padding:14px 22px 2px; border-top:1px solid var(--border); margin-top:6px; flex-shrink:0; }
  .btn-pri {
    flex:1; padding:11px 16px; border-radius:11px; border:none;
    background:var(--navy); color:var(--gold); font-size:13px; font-weight:600;
    font-family:inherit; cursor:pointer; transition:background 0.18s;
    position: relative; overflow: hidden;
  }
  .btn-pri::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at center, rgba(196,165,116,0.25) 0%, transparent 70%);
    opacity: 0; transition: opacity 0.3s;
  }
  .btn-pri:active::after { opacity: 1; }
  .btn-pri:hover { background:#1a3d5c; }
  .btn-sec {
    padding:11px 14px; border-radius:11px; border:1px solid var(--border-strong);
    background:transparent; color:var(--text-muted); font-size:13px; font-weight:500;
    font-family:inherit; cursor:pointer; transition:all 0.18s;
  }
  .btn-sec:hover { background:var(--bg-app); color:var(--text); }

  /* ── LOGIN MODAL ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(15,42,68,0.5); backdrop-filter: blur(4px);
    z-index: 500; display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease;
  }
  .modal-box {
    width: 420px; max-width: 95vw; background: var(--surface-elevated);
    border-radius: 18px; overflow: hidden; box-shadow: 0 24px 80px rgba(15,42,68,0.35);
    animation: modalIn 0.28s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.93) translateY(16px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .modal-head {
    padding: 18px 22px 16px; background: var(--navy);
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-head h3 { font-family: 'DM Serif Display', serif; font-size: 16px; color: rgba(228,222,212,0.95); margin: 0; }
  .modal-close {
    width: 28px; height: 28px; border-radius: var(--r-sm); border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06); color: rgba(228,222,212,0.65); font-size: 16px;
    display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;
  }
  .modal-close:hover { background: rgba(255,255,255,0.14); color: white; }
  .modal-tabs { display: flex; border-bottom: 1px solid var(--border); }
  .modal-tab {
    flex: 1; padding: 11px 16px; border: none; background: transparent;
    font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer;
    color: var(--text-muted); border-bottom: 2px solid transparent; transition: all 0.18s;
    margin-bottom: -1px;
  }
  .modal-tab.active { color: var(--navy); border-bottom-color: var(--navy); }
  .modal-tab:hover:not(.active) { color: var(--navy); }
  .modal-body { padding: 18px 22px 22px; display: flex; flex-direction: column; gap: 11px; }
  .modal-divider { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
  .modal-divider-line { flex: 1; height: 1px; background: var(--border); }
  .modal-divider-text { font-size: 10.5px; color: var(--text-muted); font-weight: 600; letter-spacing: 0.06em; }
  .modal-submit {
    width: 100%; padding: 11px 16px; border-radius: 11px; border: none;
    background: var(--navy); color: rgba(228,222,212,0.95); font-size: 13px; font-weight: 600;
    font-family: inherit; cursor: pointer; transition: background 0.18s; margin-top: 4px;
  }
  .modal-submit:hover { background: #1a3d5c; }
  .modal-forgot { font-size: 11.5px; color: var(--text-muted); text-align: right; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }

  /* Toast */
  .toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #2d6a4f; color: white; padding: 10px 20px; border-radius: var(--r-pill);
    font-size: 13px; font-weight: 600; z-index: 9999; box-shadow: var(--shadow-lg);
    animation: toastIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(16px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  /* ── FOOTER TRUST BAR ── */
  .trust-bar {
    background: var(--navy); border-top: 1px solid rgba(196,165,116,0.15);
    padding: 5px 18px; display: flex; align-items: center; justify-content: center; gap: 18px;
    flex-shrink: 0;
  }
  .trust-item { display: flex; align-items: center; gap: 5px; font-size: 9.5px; font-weight: 600; letter-spacing: 0.05em; color: rgba(196,165,116,0.65); text-transform: uppercase; }
  .trust-dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(196,165,116,0.35); }

  /* Dark mode */
  .app.dark {
    --bg-app: #0d1824;
    --surface-card: #162232;
    --surface-elevated: #111e2d;
    --right-bg: #0f1c2b;
    --right-border: rgba(196,165,116,0.1);
    --text: rgba(228,222,212,0.92);
    --text-muted: rgba(196,165,116,0.6);
    --text-xs: rgba(196,165,116,0.4);
    --border: rgba(196,165,116,0.12);
    --border-strong: rgba(196,165,116,0.2);
  }
  .app.dark .chat-canvas { background: linear-gradient(168deg, #0d1824 0%, #0a1520 100%); }
  .app.dark .input-shell { background: linear-gradient(to top, rgba(10,21,32,1) 55%, transparent); }
  .app.dark .hdr { background: #080f18; border-bottom-color: rgba(196,165,116,0.15); }
  .app.dark .trust-bar { background: #080f18; }
  .app.dark .state-dd-btn { background: rgba(255,255,255,0.05) !important; color: rgba(228,222,212,0.75) !important; border-color: rgba(196,165,116,0.25) !important; }
  .app.dark .explain-inner { background: rgba(232,223,201,0.12); }
  .app.dark .scope-toggle { background: rgba(255,255,255,0.06); }
  .app.dark .digilocker-btn { background: rgba(255,255,255,0.04); }
  .app.dark .auth-section { background: rgba(255,255,255,0.04); }
  .app.dark .modal-body .fld-lbl { color: var(--text-muted); }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  /* ── ROUTE TRANSITIONS ── */
  .page-transition {
    width: 100%; height: 100%; display: flex; flex-direction: column; flex: 1;
    animation: routeSlideFade 400ms ease-in-out both;
  }
  @keyframes routeSlideFade {
    0%   { opacity: 0; transform: translateX(20px); }
    100% { opacity: 1; transform: translateX(0); }
  }

  /* ── LANDING PAGE ── */
  .landing-page { display:flex; flex-direction:column; min-height:100vh; background:linear-gradient(160deg,#0a1f33 0%,#0F2A44 40%,#1a3d5c 80%,#0a1f33 100%); font-family:'DM Sans',system-ui,sans-serif; overflow-x:hidden; }
  .landing-hero { display:flex; align-items:center; justify-content:center; flex:1; padding:60px 24px 40px; }
  .landing-hero-in { max-width:860px; width:100%; display:flex; flex-direction:column; align-items:center; text-align:center; gap:28px; }
  .landing-badge { display:flex; align-items:center; gap:10px; background:rgba(196,165,116,0.12); border:1px solid rgba(196,165,116,0.28); border-radius:999px; padding:7px 18px; }
  .landing-badge-txt { font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--gold); }
  .landing-h1 { font-family:'DM Serif Display',serif; font-size:clamp(36px,6vw,64px); color:rgba(228,222,212,0.97); line-height:1.15; margin:0; }
  .landing-h1-accent { color:var(--gold); }
  .landing-sub { font-size:clamp(15px,2vw,18px); color:rgba(228,222,212,0.65); max-width:500px; line-height:1.7; margin:0; }
  .landing-scheme-strip { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
  .landing-scheme-card { display:flex; flex-direction:column; align-items:center; gap:6px; padding:16px 20px; border-radius:14px; border:1.5px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.04); transition:all 0.35s ease; opacity:0.45; transform:scale(0.94); cursor:default; min-width:130px; }
  .landing-scheme-card.active { opacity:1; transform:scale(1); border-color:rgba(196,165,116,0.4); background:rgba(196,165,116,0.1); box-shadow:0 0 28px rgba(196,165,116,0.12); }
  .landing-scheme-icon { font-size:28px; }
  .landing-scheme-label { font-size:13px; font-weight:700; color:rgba(228,222,212,0.9); }
  .landing-scheme-desc { font-size:11px; color:rgba(228,222,212,0.45); text-align:center; line-height:1.4; }
  .landing-btn-primary { width:100%; padding:13px 20px; border-radius:12px; border:none; background:var(--gold); color:var(--navy); font-size:14px; font-weight:700; font-family:inherit; cursor:pointer; transition:all 0.2s; letter-spacing:0.02em; box-shadow:0 4px 20px rgba(196,165,116,0.35); }
  .landing-btn-primary:hover { background:#d4b58a; transform:translateY(-2px); box-shadow:0 8px 28px rgba(196,165,116,0.4); }
  .landing-btn-google { width:100%; padding:12px 20px; border-radius:12px; border:1.5px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.07); color:rgba(228,222,212,0.92); font-size:14px; font-weight:600; font-family:inherit; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:9px; }
  .landing-btn-google:hover { background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.28); }
  .landing-btn-ghost { width:100%; padding:11px 20px; border-radius:12px; border:none; background:transparent; color:rgba(196,165,116,0.65); font-size:13.5px; font-weight:500; font-family:inherit; cursor:pointer; transition:color 0.18s; }
  .landing-btn-ghost:hover { color:var(--gold); }
  .landing-features { background:rgba(0,0,0,0.25); padding:56px 24px; }
  .landing-features-in { max-width:900px; margin:0 auto; }
  .landing-section-lbl { font-size:10px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:var(--gold); text-align:center; margin-bottom:28px; }
  .landing-feat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; }
  .landing-feat-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:22px 20px; transition:all 0.22s; }
  .landing-feat-card:hover { background:rgba(255,255,255,0.07); border-color:rgba(196,165,116,0.22); transform:translateY(-3px); }
  .landing-feat-icon { font-size:26px; margin-bottom:10px; }
  .landing-feat-title { font-size:14px; font-weight:700; color:rgba(228,222,212,0.92); margin-bottom:6px; }
  .landing-feat-desc { font-size:13px; color:rgba(228,222,212,0.48); line-height:1.6; }

  /* ── CITIZEN DASHBOARD PAGE ── */
  .dash-page { display:flex; flex-direction:column; flex:1; overflow:hidden; height:100%; }
  .dash-hdr { background:var(--navy); border-bottom:1px solid rgba(196,165,116,0.15); flex-shrink:0; padding:10px 20px; }
  .dash-hdr-in { display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
  .dash-step-tracker { flex:1; }
  .dash-back-btn { padding:6px 13px; border-radius:999px; border:1px solid rgba(196,165,116,0.3); background:rgba(196,165,116,0.08); color:rgba(196,165,116,0.8); font-size:12px; font-weight:600; font-family:inherit; cursor:pointer; transition:all 0.18s; white-space:nowrap; flex-shrink:0; }
  .dash-back-btn:hover { background:rgba(196,165,116,0.18); color:var(--gold); }
  .dash-body { display:flex; flex:1; overflow:hidden; }
  .dash-left { flex:1; overflow-y:auto; border-right:1px solid var(--border); padding-top: 20px; }
  .dash-right { width:340px; flex-shrink:0; overflow-y:auto; background:var(--right-bg); padding:20px 24px; display:flex; flex-direction:column; gap:16px; }
  .dash-right-title { display: flex; align-items: center; justify-content: flex-end; gap: 8px; font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 4px; border-bottom: 2px solid var(--border); padding-bottom: 12px; }
  .dash-widget { background:#ffffff; border:1px solid rgba(58,52,46,0.1); border-radius:14px; padding:18px 20px; box-shadow:0 4px 16px rgba(58,52,46,0.04); transition: transform 0.2s; }
  .dash-widget:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(58,52,46,0.06); }
  .dash-widget-hd { font-size:10.5px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-muted); margin-bottom:14px; }
  .dash-completion { display:flex; align-items:center; gap:16px; }
  .dash-completion-ring { flex-shrink:0; }
  .dash-completion-items { display:flex; flex-direction:column; gap:7px; flex:1; }
  .dash-check-item { display:flex; align-items:center; gap:8px; font-size:12.5px; color:var(--text); }
  .dash-check-dot { font-size:12px; width:18px; text-align:center; color:var(--text-muted); }
  .dash-check-dot.done { color:#2d6a4f; font-weight:700; }
  .dash-check-label { font-size:12.5px; color:var(--text-muted); }
  .dash-verif-list { display:flex; flex-direction:column; gap:8px; }
  .dash-verif-item { display:flex; align-items:center; justify-content:space-between; }
  .dash-verif-label { font-size:13px; color:var(--text); }
  .dash-verif-badge { font-size:10px; font-weight:700; padding:3px 9px; border-radius:999px; }
  .dash-verif-badge.done { color:#2d6a4f; background:rgba(45,106,79,0.1); border:1px solid rgba(45,106,79,0.25); }
  .dash-verif-badge.pending { color:#b5550a; background:rgba(181,85,10,0.1); border:1px solid rgba(181,85,10,0.22); }
  .dash-verif-badge.optional { color:var(--text-muted); background:var(--bg-app); border:1px solid var(--border); }
  .dash-stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .dash-stat { background:var(--bg-app); border-radius:9px; padding:10px 8px; text-align:center; }
  .dash-stat-n { font-size:18px; font-weight:800; color:var(--navy); line-height:1; margin-bottom:4px; }
  .dash-stat-l { font-size:10px; color:var(--text-muted); font-weight:600; }
  .dash-actions { display:flex; flex-direction:column; gap:8px; }
  .dash-action-btn { width:100%; padding:10px 14px; border-radius:10px; border:1px solid var(--border-strong); background:transparent; color:var(--text); font-size:13px; font-weight:600; font-family:inherit; cursor:pointer; transition:all 0.18s; text-align:left; }
  .dash-action-btn:hover { background:var(--bg-app); }
  .dash-action-btn.primary { background:var(--navy); color:var(--gold); border-color:var(--navy); }
  .dash-action-btn.primary:hover { background:#1a3d5c; }

  /* ── ELIGIBLE SCHEMES PAGE ── */
  .schemes-page { display:flex; flex-direction:column; flex:1; overflow:hidden; height:100%; }
  .schemes-hdr { background:var(--navy); border-bottom:1px solid rgba(196,165,116,0.15); flex-shrink:0; }
  .schemes-hdr-in { display:flex; align-items:center; gap:16px; padding:10px 20px 0; flex-wrap:wrap; }
  .schemes-tabs { display:flex; padding:0 20px; gap:0; margin-top:8px; }
  .schemes-tab { padding:9px 18px; border:none; background:transparent; color:rgba(196,165,116,0.55); font-size:13px; font-weight:600; font-family:inherit; cursor:pointer; transition:all 0.18s; border-bottom:2px solid transparent; letter-spacing:0.02em; }
  .schemes-tab.active { color:var(--gold); border-bottom-color:var(--gold); }
  .schemes-tab:hover:not(.active) { color:rgba(228,222,212,0.75); }
  .schemes-body { flex:1; overflow-y:auto; padding:22px; background:var(--bg-app); }
  .schemes-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
  .scheme-detail-link { display:block; width:100%; margin-top:6px; padding:7px; border-radius:8px; border:1px solid rgba(15,42,68,0.15); background:transparent; color:var(--navy); font-size:12px; font-weight:600; text-align:center; cursor:pointer; font-family:inherit; transition:all 0.18s; }
  .scheme-detail-link:hover { background:rgba(15,42,68,0.06); }
  .schemes-section-ttl { font-family:'DM Serif Display',serif; font-size:20px; color:var(--text); margin-bottom:18px; }
  .schemes-actions-list { max-width:680px; }
  .schemes-action-item { display:flex; gap:14px; align-items:flex-start; padding:14px 16px; background:var(--surface-card); border:1px solid var(--border); border-radius:12px; margin-bottom:10px; }
  .schemes-action-num { width:28px; height:28px; border-radius:50%; background:var(--navy); color:rgba(228,222,212,0.9); font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .schemes-action-txt { font-size:14px; color:var(--text); line-height:1.6; padding-top:3px; }
  .schemes-conflict-card { background:var(--surface-card); border:1px solid rgba(220,50,50,0.2); border-radius:12px; padding:14px 16px; margin-bottom:12px; }
  .schemes-conflict-title { font-size:12px; font-weight:700; color:#c0392b; margin-bottom:8px; }
  .scheme-tracking-row { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--surface-card); border:1px solid var(--border); border-radius:10px; margin-bottom:8px; }
  .tracking-badge { font-size:10.5px; font-weight:700; padding:4px 10px; border-radius:999px; }
  .tracking-badge.active { color:#2d6a4f; background:rgba(45,106,79,0.1); border:1px solid rgba(45,106,79,0.22); }
  .tracking-badge.pending { color:#b5550a; background:rgba(181,85,10,0.1); border:1px solid rgba(181,85,10,0.22); }

  /* ── SCHEME DETAIL PAGE ── */
  .detail-page { display:flex; flex-direction:column; flex:1; overflow:hidden; height:100%; }
  .detail-hdr { background:var(--navy); border-bottom:1px solid rgba(196,165,116,0.15); padding:14px 22px; flex-shrink:0; }
  .detail-hdr-in { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
  .detail-tag { font-size:9.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:3px 10px; border-radius:999px; }
  .detail-ttl { font-family:'DM Serif Display',serif; font-size:22px; color:rgba(228,222,212,0.97); margin:0; line-height:1.25; }
  .detail-body { flex:1; overflow-y:auto; background:var(--bg-app); padding:24px; }
  .detail-content { max-width:720px; margin:0 auto; display:flex; flex-direction:column; gap:18px; }
  .detail-section { background:var(--surface-card); border:1px solid var(--border); border-radius:13px; padding:18px 20px; }
  .detail-section-hd { font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-muted); margin-bottom:12px; }
  .detail-section-txt { font-size:14.5px; color:var(--text); line-height:1.65; margin:0; }
  .detail-apply-btn { width:100%; padding:13px; border-radius:12px; border:none; background:var(--navy); color:var(--gold); font-size:14px; font-weight:700; font-family:inherit; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 16px rgba(15,42,68,0.25); margin-top:4px; }
  .detail-apply-btn:hover { background:#1a3d5c; transform:translateY(-2px); }
  .detail-doc-list { display:flex; flex-direction:column; gap:8px; }
  .detail-doc-item { display:flex; align-items:center; gap:10px; padding:9px 12px; background:var(--bg-app); border-radius:8px; font-size:13px; color:var(--text); }
  .detail-step-item { display:flex; gap:12px; align-items:flex-start; padding:10px 0; border-bottom:1px solid var(--border); }
  .detail-step-item:last-child { border-bottom:none; }
  .detail-step-n { width:24px; height:24px; border-radius:50%; background:rgba(15,42,68,0.08); color:var(--navy); font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
  .detail-apply-zone { background:rgba(15,42,68,0.04); border:1.5px dashed rgba(15,42,68,0.2); border-radius:10px; padding:16px; margin-top:10px; text-align:center; }
  .detail-autofill-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(45,106,79,0.1); border:1px solid rgba(45,106,79,0.3); border-radius:999px; padding:5px 14px; font-size:11.5px; font-weight:700; color:#2d6a4f; margin-top:10px; animation:fadeIn 0.3s ease; }

  /* ── NAVIGATION EXTENSIONS ── */
  .persistent-home-bar {
    position: fixed; top: calc(var(--announce-h) + var(--header-h)); left: 0; width: 100%; height: 0;
    z-index: 9999; display: flex; align-items: flex-start; justify-content: center;
    pointer-events: none; overflow: visible;
  }
  .home-nav-btn {
    pointer-events: auto;
    display: flex; align-items: center; gap: 8px; padding: 7px 16px; margin-top: -16px;
    background: rgba(15,42,68,0.85); backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.22); border-radius: 999px;
    color: rgba(228,222,212,0.95); font-size: 13.5px; font-weight: 600; font-family: inherit;
    cursor: pointer; transition: all 0.25s cubic-bezier(0.22,1,0.36,1); box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }
  .home-nav-btn:hover { background: #1a3d5c; border-color: var(--gold); color: #fff; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }

  /* Carousel */
  .carousel-wrap {
    position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.2); background: rgba(0,0,0,0.1);
  }
  .carousel-slide-item { border-radius: 16px; }
  .carousel-dot-wrap {
    position: absolute; bottom: 16px; left: 0; right: 0;
    display: flex; justify-content: center; gap: 8px; z-index: 2;
  }
  .carousel-dot {
    width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.35);
    transition: all 0.3s; cursor: pointer; border: none; padding: 0;
  }
  .carousel-dot:hover { background: rgba(255,255,255,0.7); }
  .carousel-dot.active { background: #fff; transform: scale(1.3); }

  /* Landing Support Cards */
  .landing-support-card {
    flex: 1; height: 260px; border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .landing-support-card:hover {
    transform: scale(1.02);
    box-shadow: 0 12px 48px rgba(0,0,0,0.25);
  }
`;


/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */
const LANGUAGES = [
  { code: "en", label: "English" }, { code: "hi", label: "हिंदी (Hindi)" }, { code: "bn", label: "বাংলা (Bengali)" },
  { code: "te", label: "తెలుగు (Telugu)" }, { code: "mr", label: "मराठी (Marathi)" }, { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" }, { code: "kn", label: "ಕನ್ನಡ (Kannada)" }, { code: "ml", label: "മലയാളം (Malayalam)" },
  { code: "or", label: "ଓଡ଼ିଆ (Odia)" }, { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" }, { code: "as", label: "অসমীয়া (Assamese)" },
];

// RESTRICTED to 4 western region states only
const STATES = ["Gujarat", "Rajasthan", "Maharashtra", "Madhya Pradesh"];

const INCOME_BRACKETS = ["Below ₹1 Lakh", "₹1–3 Lakh", "₹3–6 Lakh", "₹6–10 Lakh", "Above ₹10 Lakh"];

const CHAT_HISTORY = [
  { id: "1", title: "PM Kisan eligibility", meta: "Today" },
  { id: "2", title: "Housing schemes — Gujarat", meta: "Yesterday" },
  { id: "3", title: "Document checklist", meta: "Mon" },
  { id: "4", title: "Scholarship for daughter", meta: "Sun" },
];

const SCHEME_NAV = [
  { id: "s1", name: "PM Kisan Samman Nidhi", cat: "Agri", color: "#2d6a4f" },
  { id: "s2", name: "Ayushman Bharat PM-JAY", cat: "Health", color: "#1d6fa4" },
  { id: "s3", name: "National Scholarship NSP", cat: "Edu", color: "#6b3fa0" },
  { id: "s4", name: "PM Awas Yojana Gramin", cat: "Housing", color: "#b5550a" },
  { id: "s5", name: "MGNREGS / MNREGA", cat: "Work", color: "#7a6c00" },
  { id: "s6", name: "Ujjwala Yojana 2.0", cat: "Women", color: "#9b2d5a" },
  { id: "s7", name: "PM SVANidhi Credit", cat: "Finance", color: "#0f5e6e" },
  { id: "s8", name: "Sukanya Samriddhi", cat: "Women", color: "#8a2d6e" },
  { id: "s9", name: "Pradhan Mantri Mudra", cat: "Finance", color: "#1d5e8a" },
  { id: "s10", name: "E-Shram Portal", cat: "Labour", color: "#4a6e2d" },
];

const SCHEME_RESULTS = [
  {
    id: 1, tag: "Agriculture", tagColor: "#2d6a4f", tagBg: "rgba(45,106,79,0.10)", match: 94,
    title: "PM Kisan Samman Nidhi",
    reason: "You own agricultural land under 2 hectares and are a registered farmer in Gujarat.",
    bullets: ["₹6,000/year direct bank transfer in 3 instalments", "Must be registered on PM-Kisan portal", "Aadhaar-linked bank account required"],
    explainPoints: ["Income criteria matched", "Agricultural land ownership confirmed", "State scheme relevance detected", "Document compatibility confirmed"],
    conflict: null
  },
  {
    id: 2, tag: "Health", tagColor: "#1d6fa4", tagBg: "rgba(29,111,164,0.10)", match: 88,
    title: "Ayushman Bharat – PM-JAY",
    reason: "Household income and occupation qualify under SECC 2011 data.",
    bullets: ["₹5 lakh/year health cover per family", "Covers 1,929+ medical procedures", "Cashless treatment at empanelled hospitals"],
    explainPoints: ["Income criteria matched", "SECC 2011 data eligibility satisfied", "Family size qualifier met", "Aadhaar linkage confirmed"],
    conflict: null
  },
  {
    id: 3, tag: "Education", tagColor: "#6b3fa0", tagBg: "rgba(107,63,160,0.10)", match: 82,
    title: "National Scholarship Portal",
    reason: "Annual income below ₹1.5 lakh with children enrolled in Class 9+.",
    bullets: ["Pre-Matric, Post-Matric scholarships", "Apply via scholarships.gov.in", "Need: Aadhaar, income cert, marksheet"],
    explainPoints: ["Income below eligibility threshold", "Education enrollment confirmed", "Age group eligibility satisfied", "State scheme relevance detected"],
    conflict: null
  },
  {
    id: 4, tag: "Housing", tagColor: "#b5550a", tagBg: "rgba(181,85,10,0.10)", match: 76,
    title: "PM Awas Yojana – Gramin",
    reason: "Houseless or living in kutcha house; income below PMAY-G threshold.",
    bullets: ["₹1.20 lakh for plain areas", "₹1.30 lakh for hilly/NE states", "Must have job card or BPL status"],
    explainPoints: ["Housing status verified", "Income criteria matched", "BPL status detected", "Rural residence qualifier met"],
    conflict: { schemeA: "PM Awas Yojana", schemeB: "State Housing Grant" }
  },
  {
    id: 5, tag: "Employment", tagColor: "#7a6c00", tagBg: "rgba(122,108,0,0.10)", match: 91,
    title: "MGNREGS (MNREGA)",
    reason: "Adult rural household member willing to do unskilled manual work.",
    bullets: ["100 days guaranteed employment/year", "Apply at local Gram Panchayat", "Job card issued within 15 days"],
    explainPoints: ["Age group eligibility satisfied", "Rural residence confirmed", "Income criteria matched", "Manual work willingness accepted"],
    conflict: null
  },
  {
    id: 6, tag: "Women", tagColor: "#9b2d5a", tagBg: "rgba(155,45,90,0.10)", match: 79,
    title: "Ujjwala Yojana 2.0",
    reason: "Adult woman from BPL household without existing LPG connection.",
    bullets: ["Free LPG connection with first refill", "Subsidy on subsequent cylinders", "Apply via nearest LPG distributor"],
    explainPoints: ["Gender eligibility confirmed", "BPL household status matched", "No existing LPG connection detected", "Document compatibility confirmed"],
    conflict: null
  },
  {
    id: 7, tag: "Finance", tagColor: "#0f5e6e", tagBg: "rgba(15,94,110,0.10)", match: 71,
    title: "PM SVANidhi – Vendor Credit",
    reason: "Registered street vendor with vending certificate or recommendation letter.",
    bullets: ["Working capital loan up to ₹50,000", "Digital transactions earn cashback", "No collateral required"],
    explainPoints: ["Vendor registration status confirmed", "Income criteria matched", "Urban/semi-urban residence detected", "Document compatibility confirmed"],
    conflict: null
  },
];

const THINKING_MESSAGES = [
  { emoji: "🔎", text: "Searching government schemes…" },
  { emoji: "📄", text: "Reading policy documents…" },
  { emoji: "🤖", text: "Generating personalised checklist…" },
];

const AI_GUIDANCE = {
  intro: "Based on your situation, here's how I'd recommend you proceed to access the matched schemes:",
  steps: [
    "Gather your Aadhaar card and a bank passbook linked to your Aadhaar — required for most central schemes.",
    "Get an income certificate from your tehsildar or village officer confirming annual household income.",
    "Visit your nearest Common Service Centre (CSC) or Gram Panchayat to apply for PM Kisan and MNREGA.",
    "Check your Ayushman Bharat eligibility at pmjay.gov.in using your Aadhaar number.",
    "For children's scholarships, apply via scholarships.gov.in before the October deadline.",
  ],
  followUp: "Would you like me to guide you through any specific scheme, or help you prepare the required documents?",
};

const STARTERS = [
  "I'm a small farmer in Gujarat with 2 acres",
  "I need healthcare support for my family",
  "Looking for education scholarship for my daughter",
  "I run a small street food stall",
];

const PLACEHOLDER_HINTS = [
  "Enter age, income, occupation, state…",
  "Describe your profile to find schemes…",
  "Upload documents for smart assistance…",
  "Tell me about your family situation…",
];

const JOURNEY_STEPS = [
  { id: "profile", label: "Profile" },
  { id: "schemes", label: "Schemes" },
  { id: "checklist", label: "Checklist" },
  { id: "apply", label: "Apply" },
];

/* ═══════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════ */
const S = (n) => ({ width: n, height: n, flexShrink: 0 });
function IMic() { return <svg style={S(17)} viewBox="0 0 24 24"><path fill="currentColor" d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-5 8v4h-2v-4h2z" /></svg>; }
function IStop() { return <svg style={S(17)} viewBox="0 0 24 24"><rect fill="currentColor" x="5" y="5" width="14" height="14" rx="2" /></svg>; }
function IUp() { return <svg style={S(17)} viewBox="0 0 24 24"><path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" /></svg>; }
function ISend() { return <svg style={S(17)} viewBox="0 0 24 24"><path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg>; }
function ISearch() { return <svg style={S(13)} viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" stroke="rgba(200,195,185,0.4)" strokeWidth="2" fill="none" /><path stroke="rgba(200,195,185,0.4)" strokeWidth="2" strokeLinecap="round" d="M16.5 16.5L21 21" fill="none" /></svg>; }
function IPlus() { return <svg style={S(14)} viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>; }
function ITarget() { return <svg style={S(17)} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></svg>; }
function IDoc() { return <svg style={S(14)} viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="1.5" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" /><path stroke="currentColor" strokeWidth="1.5" d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>; }
function IArrow() { return <svg style={S(13)} viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>; }
function ICheck() { return <svg style={S(13)} viewBox="0 0 24 24" fill="none"><path stroke="#2d6a4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>; }
function IMoon() { return <svg style={S(15)} viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>; }
function ISun() { return <svg style={S(15)} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" /><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>; }
function IChevL() { return <svg style={S(11)} viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M15 18l-6-6 6-6" /></svg>; }
function IChevR() { return <svg style={S(11)} viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M9 18l6-6-6-6" /></svg>; }
function IUser() { return <svg style={S(14)} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" /><path stroke="currentColor" strokeWidth="1.5" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>; }
function ILock() { return <svg style={S(12)} viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" /><path stroke="currentColor" strokeWidth="1.5" d="M8 11V7a4 4 0 118 0v4" /></svg>; }

function AiLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id="g1" cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#e8d5a3" />
          <stop offset="55%" stopColor="#c4a574" />
          <stop offset="100%" stopColor="#8a6d3e" />
        </radialGradient>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(196,165,116,0.28)" strokeWidth="1" />
      <polygon points="16,5 24,10 24,22 16,27 8,22 8,10" fill="none" stroke="rgba(196,165,116,0.42)" strokeWidth="0.8" />
      <circle cx="16" cy="16" r="7" fill="url(#g1)" filter="url(#glow)" />
      <circle cx="16" cy="16" r="2.2" fill="rgba(255,252,248,0.9)" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STATE DROPDOWN
═══════════════════════════════════════════════════════════════ */
function StateDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="state-dd-btn" onClick={() => setOpen(v => !v)} style={{
        display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 999,
        border: open ? "1px solid rgba(196,165,116,0.6)" : "1px solid rgba(196,165,116,0.28)",
        background: open ? "rgba(196,165,116,0.15)" : "rgba(255,255,255,0.08)",
        color: "rgba(228,222,212,0.8)", fontSize: 11.5, fontWeight: 500,
        letterSpacing: "0.04em", textTransform: "uppercase",
        cursor: "pointer", fontFamily: "inherit",
        boxShadow: open ? "0 0 0 3px rgba(196,165,116,0.16)" : "none", transition: "all 0.18s",
      }}>
        {value}
        <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 5px)", right: 0,
          background: "var(--surface-elevated)", border: "1px solid var(--border-strong)",
          borderRadius: 11, zIndex: 200, minWidth: 200, maxHeight: 200, overflowY: "auto",
          boxShadow: "0 16px 48px rgba(15,42,68,0.22)", padding: "5px",
        }}>
          {STATES.map(s => (
            <button key={s} type="button" onClick={() => { onChange(s); setOpen(false); }} style={{
              display: "block", width: "100%", textAlign: "left", padding: "8px 11px", borderRadius: 7, border: "none",
              background: s === value ? "rgba(15,42,68,0.08)" : "transparent",
              color: s === value ? "var(--navy)" : "var(--text-muted)",
              fontSize: 12.5, fontFamily: "inherit", cursor: "pointer",
              fontWeight: s === value ? 600 : 400, transition: "background 0.12s",
            }}
              onMouseEnter={e => { if (s !== value) e.currentTarget.style.background = "var(--bg-app)"; }}
              onMouseLeave={e => { if (s !== value) e.currentTarget.style.background = "transparent"; }}
            >{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FORM HELPERS
═══════════════════════════════════════════════════════════════ */
const BF = {
  width: "100%", padding: "8px 11px", borderRadius: 9,
  border: "1.5px solid rgba(58,52,46,0.13)",
  background: "#fff", color: "var(--text)", fontSize: 14.5, fontFamily: "inherit", outline: "none",
  transition: "border-color 0.18s, box-shadow 0.18s",
};
const FInput = React.forwardRef(function FInputInner({ onKeyDown, onInput, ...props }, ref) {
  const [f, setF] = useState(false);
  const handleInput = (e) => {
    if (props.inputMode === "numeric") {
      e.target.value = e.target.value.replace(/\D/g, "");
    }
    if (onInput) onInput(e);
  };
  return <input ref={ref} {...props}
    style={{ ...BF, borderColor: f ? "var(--navy)" : "rgba(58,52,46,0.13)", boxShadow: f ? "0 0 0 3px rgba(15,42,68,0.1)" : "none" }}
    onFocus={() => setF(true)} onBlur={() => setF(false)}
    onKeyDown={onKeyDown}
    onInput={handleInput}
  />;
});
function FSelect({ children, ...props }) {
  const [f, setF] = useState(false);
  return (
    <select {...props} style={{
      ...BF, appearance: "none", cursor: "pointer", paddingRight: 34,
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b6560' d='M3 4.5L6 7.5L9 4.5'/%3E%3C/svg%3E\")",
      backgroundRepeat: "no-repeat", backgroundPosition: "right 11px center",
      borderColor: f ? "var(--navy)" : "rgba(58,52,46,0.13)", boxShadow: f ? "0 0 0 3px rgba(15,42,68,0.1)" : "none",
    }} onFocus={() => setF(true)} onBlur={() => setF(false)}>{children}</select>
  );
}
function FField({ label, required, hint, children }) {
  return (
    <div className="fld">
      <span className="fld-lbl">{label}{required && <span className="fld-req">*</span>}</span>
      {children}
      {hint && <span className="fld-hint">ℹ️ {hint}</span>}
    </div>
  );
}

/* Pill toggle group */
function PillToggle({ options, value, onChange, single = true }) {
  const vals = single ? (value ? [value] : []) : (Array.isArray(value) ? value : []);
  const toggle = (opt) => {
    if (single) { onChange(opt === value ? null : opt); }
    else {
      const next = vals.includes(opt) ? vals.filter(v => v !== opt) : [...vals, opt];
      onChange(next);
    }
  };
  return (
    <div className="pill-toggle-group">
      {options.map(opt => (
        <button key={opt} type="button"
          className={`pill-toggle${vals.includes(opt) ? " selected" : ""}`}
          onClick={() => toggle(opt)}
        >{opt}</button>
      ))}
    </div>
  );
}

/* Segmented toggle */
function SegToggle({ options, value, onChange }) {
  return (
    <div className="seg-toggle">
      {options.map(opt => (
        <button key={opt} type="button"
          className={`seg-btn${value === opt ? " selected" : ""}`}
          onClick={() => onChange(opt)}
        >{opt}</button>
      ))}
    </div>
  );
}

/* ── Upload with drag & drop + progress ── */
function UploadPh({ name, hint, uploadedPrefix }) {
  const [fileName, setFileName] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 35;
      if (p >= 100) { p = 100; clearInterval(iv); setUploading(false); setFileName(file.name); }
      setProgress(Math.min(p, 100));
    }, 120);
  };

  const handleClick = () => inputRef.current && inputRef.current.click();
  const handleChange = (e) => { const file = e.target.files && e.target.files[0]; handleFile(file); e.target.value = ""; };
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files && e.dataTransfer.files[0]; handleFile(file); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: "none" }} onChange={handleChange} />
      <div className={`drag-zone${dragging ? " drag-over" : ""}`}
        onClick={handleClick}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        role="button" tabIndex={0}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && handleClick()}
      >
        <div className="drag-icon">📎</div>
        <div className="drag-label">{name}</div>
        <div className="drag-hint">{hint} · Drag & drop or click</div>
      </div>
      {uploading && (
        <div className="upload-progress-wrap">
          <div className="upload-progress-bar">
            <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {fileName && !uploading && (
        <div className="upload-success">
          <div className="upload-success-tick">✓</div>
          <span>{uploadedPrefix} {fileName}</span>
        </div>
      )}
    </div>
  );
}

const FSECS_BASE = [
  { label_key: "personalInfo", icon: "👤", accent: "rgba(196,165,116,0.06)", iconBg: "rgba(196,165,116,0.14)", color: "#8a6d3e" },
  { label_key: "economicProfile", icon: "💼", accent: "rgba(45,106,79,0.05)", iconBg: "rgba(45,106,79,0.12)", color: "#2d6a4f" },
  { label_key: "location", icon: "📍", accent: "rgba(15,42,68,0.04)", iconBg: "rgba(15,42,68,0.12)", color: "#0F2A44" },
  { label_key: "documents", icon: "📄", accent: "rgba(107,63,160,0.05)", iconBg: "rgba(107,63,160,0.11)", color: "#5a30a0" },
  { label_key: "schemeInterest", icon: "🎯", accent: "rgba(181,85,10,0.04)", iconBg: "rgba(181,85,10,0.10)", color: "#a04520" },
];
function FSec({ label, icon, accent, iconBg, color, children }) {
  return (
    <div className="fsec" style={{ background: accent }}>
      <div className="fsec-hd">
        <div className="fsec-ico" style={{ background: iconBg }}>{icon}</div>
        <span className="fsec-lbl" style={{ color }}>{label}</span>
      </div>
      <div className="fsec-body">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP PROGRESS TRACKER
═══════════════════════════════════════════════════════════════ */
function StepTracker({ currentStep, isLoggedIn, t }) {
  const JOURNEY_STEPS_I18N = [
    { id: "profile", labelKey: "stepProfile" },
    { id: "schemes", labelKey: "stepSchemes" },
    { id: "checklist", labelKey: "stepChecklist" },
    { id: "apply", labelKey: "stepApply" },
  ];
  const stepIndex = JOURNEY_STEPS_I18N.findIndex(s => s.id === currentStep);
  return (
    <div className="step-tracker">
      {JOURNEY_STEPS_I18N.map((step, i) => {
        const isDone = i < stepIndex;
        const isActive = i === stepIndex;
        const isApplyLocked = step.id === "apply" && !isLoggedIn;
        const statusClass = isDone ? "done" : isActive ? "active" : "pending";
        return (
          <div key={step.id} className="step-item">
            <div className={`step-circle ${statusClass}`}>
              {isDone ? "✓" : i + 1}
            </div>
            <span className={`step-label ${statusClass}`}>
              {t ? t(step.labelKey) : step.labelKey}
              {isApplyLocked && <span className="step-lock">🔒</span>}
            </span>
            {i < JOURNEY_STEPS_I18N.length - 1 && (
              <div className={`step-connector ${isDone ? "done" : "pending"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESULT CARD (with explainability + conflict graph)
═══════════════════════════════════════════════════════════════ */
function ResultCard({ scheme, idx, visible, t, onChecklist, isExpanded, checklistData, highlight }) {
  const [explainOpen, setExplainOpen] = useState(false);
  const tt = t || ((k) => k);
  return (
    <div className={`rc${visible ? " visible" : ""}`} style={{ animationDelay: visible ? `${idx * 120}ms` : "0ms" }}>
      <div className="rc-top">
        <span className="rc-tag" style={{ color: scheme.tagColor, background: scheme.tagBg, border: `1px solid ${scheme.tagColor}30` }}>
          {scheme.tag}
        </span>
        <span className="rc-draft">{tt("draftReady")}</span>
      </div>
      <div className="rc-ttl">{scheme.title}</div>
      <div className="rc-rsn">{scheme.reason}</div>

      {/* eligibility match bar */}
      <div className="rc-match">
        <div className="rc-match-bar">
          <div className="rc-match-fill" style={{ width: `${scheme.match}%`, background: scheme.match >= 85 ? "#2d6a4f" : scheme.match >= 70 ? "#b5550a" : "#7a6c00" }} />
        </div>
        <span className="rc-match-pct" style={{ color: scheme.match >= 85 ? "#2d6a4f" : scheme.match >= 70 ? "#b5550a" : "#7a6c00" }}>{scheme.match}% {tt("matchLabel")}</span>
      </div>

      <div className="rc-buls">
        {scheme.bullets.map((b, i) => (
          <div key={i} className="rc-bul">
            <span className="rc-dot" style={{ background: scheme.tagColor }} />
            {b}
          </div>
        ))}
      </div>

      {/* Explainability Panel */}
      {scheme.explainPoints && (
        <>
          <button type="button" className="explain-toggle" onClick={() => setExplainOpen(v => !v)}>
            <span className="explain-ai-badge">🤖 {tt("aiInsight")}</span>
            <span style={{ flex: 1, textAlign: "left" }}>{tt("whyEligible")}</span>
            <span className={`explain-chevron${explainOpen ? " open" : ""}`}>▶</span>
          </button>
          <div className={`explain-panel${explainOpen ? " open" : ""}`}>
            <div className="explain-inner">
              {scheme.explainPoints.map((point, i) => (
                <div key={i} className="explain-row">
                  <span className="explain-tick">✓</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Conflict Graph */}
      {scheme.conflict && (
        <div className="conflict-graph">
          <div className="conflict-pill">{scheme.conflict.schemeA}</div>
          <div className="conflict-line">
            <div className="conflict-line-inner">
              <div className="conflict-badge">⚠ {tt("conflictLabel")}</div>
            </div>
          </div>
          <div className="conflict-pill">{scheme.conflict.schemeB}</div>
        </div>
      )}

      <button type="button" className="rc-cta" style={{ marginTop: scheme.conflict ? 8 : 0 }} onClick={() => onChecklist(scheme.id)}>
        {isExpanded ? 'Collapse Checklist ▴' : 'View Checklist ▾'}
      </button>

      <InlineChecklist isExpanded={isExpanded} data={checklistData} highlight={highlight} />
    </div>
  );
}

/* ── Smart AI Thinking ── */
function SmartTyping() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep(s => Math.min(s + 1, THINKING_MESSAGES.length - 1)), 500);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="ai-thinking">
      {THINKING_MESSAGES.slice(0, step + 1).map((m, i) => (
        <div key={i} className="thinking-msg" style={{ animationDelay: `${i * 0.05}s` }}>
          <span className="thinking-emoji">{m.emoji}</span>
          <span>{m.text}</span>
        </div>
      ))}
      <div className="shimmer-lines">
        {[100, 80, 60].map((w, i) => <div key={i} className="shimmer-line" style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }} />)}
      </div>
    </div>
  );
}

function fmtTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN MODAL
═══════════════════════════════════════════════════════════════ */
function LoginModal({ onClose, t }) {
  const { login, signup, googleSignIn } = useAuth();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const tt = t || ((k) => k);

  const handleGoogle = async () => {
    setLoading(true);
    try { await googleSignIn(); onClose(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      if (tab === "login") await login(email, password);
      else await signup(email, password);
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{tt("modalTitle")}</h3>
          <button type="button" className="modal-close" onClick={onClose} disabled={loading}>×</button>
        </div>
        <div className="modal-tabs">
          <button type="button" className={`modal-tab${tab === "login" ? " active" : ""}`} onClick={() => setTab("login")}>{tt("loginTab")}</button>
          <button type="button" className={`modal-tab${tab === "signup" ? " active" : ""}`} onClick={() => setTab("signup")}>{tt("signupTab")}</button>
        </div>
        <div className="modal-body">
          {error && <div style={{ color: "#d62828", fontSize: 13, marginBottom: 12, textAlign: "center", background: "rgba(214,40,40,0.05)", padding: 8, borderRadius: 6 }}>{error}</div>}

          {tab === "login" ? (
            <>
              <FField label={tt("emailLabel")}>
                <FInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
              </FField>
              <FField label={tt("passwordLabel")}>
                <FInput type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" />
              </FField>
              <div className="modal-forgot">{tt("forgotPassword")}</div>
              <button type="button" className="modal-submit" onClick={handleSubmit} disabled={loading}>{loading ? "Processing..." : tt("signIn")}</button>
            </>
          ) : (
            <>
              <FField label={tt("fullNameLabel")}><FInput type="text" value={name} onChange={e => setName(e.target.value)} placeholder={tt("aadhaarAs")} /></FField>
              <FField label={tt("emailLabel")}><FInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" /></FField>
              <FField label={tt("passwordLabel")}><FInput type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password" /></FField>
              <button type="button" className="modal-submit" onClick={handleSubmit} disabled={loading}>{loading ? "Creating..." : tt("createAccount")}</button>
            </>
          )}

          <div className="modal-divider">
            <div className="modal-divider-line" /><span className="modal-divider-text">OR CONTINUE WITH</span><div className="modal-divider-line" />
          </div>

          <button type="button" className="digilocker-btn" style={{ background: "#fff", color: "#444", border: "1px solid #ddd" }} onClick={handleGoogle} disabled={loading}>
            <span className="digilocker-icon" style={{ fontSize: 16 }}>G</span>
            {loading ? "Please wait..." : "Continue with Google"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SPEECH RECOGNITION HOOK
═══════════════════════════════════════════════════════════════ */
function useSpeech({ onResult, lang }) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const supported = typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stop = useCallback(() => {
    if (recRef.current) { recRef.current.stop(); recRef.current = null; }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!supported) { setError("unsupported"); return; }
    if (listening) { stop(); return; }
    setError(null);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang === "en" ? "en-IN" : lang === "hi" ? "hi-IN" : lang === "bn" ? "bn-IN" :
      lang === "te" ? "te-IN" : lang === "mr" ? "mr-IN" : lang === "ta" ? "ta-IN" :
        lang === "gu" ? "gu-IN" : lang === "kn" ? "kn-IN" : lang === "ml" ? "ml-IN" :
          lang === "pa" ? "pa-IN" : "en-IN";
    rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => { const text = Array.from(e.results).map(r => r[0].transcript).join(" "); onResult(text); setListening(false); recRef.current = null; };
    rec.onerror = (e) => { setListening(false); recRef.current = null; if (e.error === "not-allowed" || e.error === "permission-denied") setError("denied"); else setError("error"); };
    rec.onend = () => { setListening(false); recRef.current = null; };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setError("error"); }
  }, [supported, listening, stop, onResult, lang]);

  useEffect(() => () => { if (recRef.current) recRef.current.stop(); }, []);
  return { listening, supported, error, start, stop };
}

/* ═══════════════════════════════════════════════════════════════
   ROTATING PLACEHOLDER HOOK
═══════════════════════════════════════════════════════════════ */
function useRotatingPlaceholder(hints, interval = 3000) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % hints.length);
        setFading(false);
      }, 400);
    }, interval);
    return () => clearInterval(timer);
  }, [hints, interval]);

  return { placeholder: hints[idx], fading };
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════ */
const LANDING_SCHEME_CARDS = [
  { icon: "🌾", label: "Agriculture", desc: "PM Kisan, MNREGA & 40+ schemes", color: "#2d6a4f" },
  { icon: "🏥", label: "Healthcare", desc: "Ayushman Bharat & health welfare", color: "#1d6fa4" },
  { icon: "📚", label: "Education", desc: "Scholarships & skill development", color: "#6b3fa0" },
  { icon: "🏠", label: "Housing", desc: "PM Awas Yojana & urban housing", color: "#b5550a" },
];
const LANDING_FEATURES = [
  { icon: "🤖", title: "AI-Powered Matching", desc: "Describe your situation in any language and our AI instantly matches you with schemes you qualify for." },
  { icon: "🌐", title: "22 Indian Languages", desc: "Ask questions in Hindi, Tamil, Bengali, Telugu or any official Indian language." },
  { icon: "📄", title: "Document Assistant", desc: "Upload your Aadhaar or income certificate and let AI auto-fill application forms." },
  { icon: "🔒", title: "Fully Private", desc: "All your data stays on your device. Nothing is stored on external servers." },
  { icon: "✅", title: "Government Verified", desc: "Scheme information sourced directly from official government portals." },
  { icon: "📊", title: "Scheme Tracker", desc: "Track your application status, deadlines, and renewal reminders." },
];
function AnnounceBar() {
  return (
    <div className="announce-bar">
      <div className="announce-emblem">
        <svg width="18" height="18" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(196,165,116,0.8)" strokeWidth="5" />
          <circle cx="50" cy="50" r="8" fill="rgba(196,165,116,0.8)" />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * 15) * Math.PI / 180;
            return <line key={i} x1={50 + 10 * Math.cos(a)} y1={50 + 10 * Math.sin(a)} x2={50 + 42 * Math.cos(a)} y2={50 + 42 * Math.sin(a)} stroke="rgba(196,165,116,0.6)" strokeWidth="2" />;
          })}
        </svg>
      </div>
      <div className="announce-track-wrap">
        <div className="announce-track">
          {[1, 2].map(k => (
            <span key={k} className="announce-text">
              <span className="announce-flag">🇮🇳</span>
              Government Scheme Intelligence Portal — Empowering Citizens with Artificial Intelligence &nbsp;·&nbsp; Bridging Citizens and Welfare through AI &nbsp;·&nbsp; जन कल्याण के लिए AI &nbsp;·&nbsp;
              <span className="announce-flag">🇮🇳</span>
              Government Scheme Intelligence Portal — Empowering Citizens with Artificial Intelligence &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CAROUSEL
═══════════════════════════════════════════════════════════════ */
function HeroCarousel({ images, interval = 1000 }) {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Requirement 1: Filter out invalid/duplicate images
  const validImages = useMemo(() => {
    if (!images) return [];
    return Array.from(new Set(images.filter(Boolean)));
  }, [images]);

  // Requirement 4: Preloading Fix correctly without duplicate triggers
  useEffect(() => {
    if (!validImages.length) {
      setLoaded(true);
      return;
    }
    setLoaded(false);
    let loadedCount = 0;
    const toLoad = validImages.length;
    validImages.forEach(src => {
      const img = new Image();
      img.src = src;
      const onDone = () => {
        loadedCount++;
        if (loadedCount === toLoad) setLoaded(true);
      };
      img.onload = onDone;
      img.onerror = onDone;
    });
  }, [validImages]);

  // Requirement 3: Reset index safely if validImages changes
  useEffect(() => {
    if (idx >= validImages.length && validImages.length > 0) {
      setIdx(0);
    }
  }, [validImages.length, idx]);

  // Requirement 3: Fix modulo logic & ensure loop stays in bounds
  useEffect(() => {
    if (!loaded || validImages.length <= 1) return;
    const timer = setInterval(() => {
      setIdx(prev => (prev + 1) % validImages.length);
    }, interval);
    return () => clearInterval(timer);
  }, [validImages.length, interval, loaded]);

  if (!validImages.length) return null;

  return (
    <div className="carousel-wrap" style={{ display: 'flex', flexDirection: 'column' }}>
      {!loaded ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="shimmer-line" style={{ width: '80%', height: '80%', borderRadius: 16 }} />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', width: '100%', height: '100%', transition: 'transform 400ms ease-in-out', transform: `translateX(-${idx * 100}%)` }}>
            {validImages.map((src, i) => (
              <div
                key={`${src}-${i}`} // Requirement 2: Unique key
                style={{ flexShrink: 0, width: '100%', height: '100%', backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
            ))}
          </div>
          <div className="carousel-dot-wrap">
            {validImages.map((_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                aria-label={`Slide ${i + 1}`}
                className={`carousel-dot${i === idx ? " active" : ""}`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LandingPage({ onLogin, onGoogleLogin, onContinue, loginModal, setLoginModal, handleAuthSuccess, toast }) {
  const [schemeIdx, setSchemeIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setSchemeIdx(i => (i + 1) % LANDING_SCHEME_CARDS.length), 2500);
    return () => clearInterval(iv);
  }, []);
  return (
    <>
      <div className="landing-page">
        <AnnounceBar />
        <div className="landing-hero">
          <div className="landing-hero-in">
            <div className="landing-badge"><AiLogo size={44} /><span className="landing-badge-txt">AI Powered · 100+ Schemes</span></div>
            <h1 className="landing-h1">Your AI Guide to<br /><span className="landing-h1-accent">Government Welfare</span></h1>
            <p className="landing-sub">Discover schemes you qualify for — in your language, instantly.<br />Powered by AI. Verified government sources.</p>

            <div style={{ width: "100%", maxWidth: 800, height: 340, margin: "16px 0" }}>
              <HeroCarousel images={[
                "/carousel/media__1774379683201.png",
                "/carousel/media__1774379690503.png",
                "/carousel/media__1774379696563.png",
                "/carousel/media__1774379701296.png",
                "/carousel/media__1774379342827.png"
              ]} interval={1000} />
            </div>

            <div className="landing-scheme-strip">
              {LANDING_SCHEME_CARDS.map((c, i) => (
                <div key={i} className={`landing-scheme-card${i === schemeIdx ? " active" : ""}`}>
                  <span className="landing-scheme-icon">{c.icon}</span>
                  <span className="landing-scheme-label">{c.label}</span>
                  <span className="landing-scheme-desc">{c.desc}</span>
                </div>
              ))}
            </div>
            <div className="landing-auth">
              <button type="button" className="landing-btn-primary" onClick={onLogin}>🔐 Login to Your Account</button>
              <button type="button" className="landing-btn-google" onClick={onGoogleLogin}>
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0112 4.93c1.84 0 3.5.67 4.79 1.77l3.55-3.55A11.95 11.95 0 0012 .96C8.2.96 4.9 3 3 6.06l2.27 3.7z" /><path fill="#34A853" d="M16.04 18.01A7.06 7.06 0 0112 19.07a7.08 7.08 0 01-6.72-4.84l-3.7 2.26A12 12 0 0012 24c3.24 0 6.33-1.22 8.39-3.39l-4.35-2.6z" /><path fill="#4A90E2" d="M20.39 20.61C22.34 18.54 23.5 15.67 23.5 12c0-.78-.1-1.56-.24-2.32H12v4.6h6.46a5.5 5.5 0 01-2.42 3.59l4.35 2.74z" /><path fill="#FBBC05" d="M5.28 14.23A7.09 7.09 0 014.93 12c0-.77.13-1.52.35-2.24L3.01 6.06A11.96 11.96 0 00.5 12c0 2.08.53 4.03 1.49 5.72l3.29-3.49z" /></svg>
                Continue with Google
              </button>
              <button type="button" className="landing-btn-ghost" onClick={onContinue}>Continue Without Account →</button>
            </div>
          </div>
        </div>
        <div className="landing-features">
          <div className="landing-features-in">
            <div className="landing-section-lbl">How PolicyPilot Helps You</div>
            <div className="landing-feat-grid" style={{ marginBottom: 40 }}>
              {LANDING_FEATURES.map((f, i) => (
                <div key={i} className="landing-feat-card">
                  <div className="landing-feat-icon">{f.icon}</div>
                  <div className="landing-feat-title">{f.title}</div>
                  <div className="landing-feat-desc">{f.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ width: "100%", marginTop: 20, display: "flex", gap: "16px" }}>
              <div className="landing-support-card">
                <HeroCarousel images={[
                  "/carousel/media__1774379701296.png",
                  "/carousel/media__1774379709242.png",
                  "/carousel/media__1774379690503.png"
                ]} interval={1000} />
              </div>
              <div className="landing-support-card">
                <HeroCarousel images={[
                  "/carousel/media__1774379696563.png",
                  "/carousel/media__1774379342827.png",
                  "/carousel/media__1774379683201.png"
                ]} interval={1000} />
              </div>
            </div>
          </div>
        </div>
        <div className="trust-bar" style={{ padding: "10px 18px" }}>
          <div className="trust-item">🤖 Powered by AI Policy Engine</div>
          <div className="trust-dot" />
          <div className="trust-item">✅ Verified Government Sources</div>
          <div className="trust-dot" />
          <div className="trust-item">🔒 Data Stays on Your Device</div>
          <div className="trust-dot" />
          <div className="trust-item">🇮🇳 100+ Central & State Schemes</div>
        </div>
      </div>
      {loginModal && <LoginModal onClose={() => setLoginModal(false)} onSuccess={handleAuthSuccess} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CITIZEN DASHBOARD PAGE
═══════════════════════════════════════════════════════════════ */
function CitizenDashboardPage({ currentStep, t, isLoggedIn, socialCategory, setSocialCategory, gender, setGender, education, setEducation, incomeIdx, setIncomeIdx, residenceType, setResidenceType, schemeScope, setSchemeScope, formState, setFormState, isCentralScope, nameRef, ageRef, occRef, aadhaarRef, districtRef, familyRef, enterNext, setLoginModal, onSave, goBack }) {
  const tt = t || ((k) => k);
  const completedFields = [socialCategory, gender, education, residenceType].filter(Boolean).length;
  const completionPct = Math.round((completedFields / 4) * 100);
  const circumference = 2 * Math.PI * 32;
  return (
    <div className="dash-page">
      <div className="dash-hdr">
        <div className="dash-hdr-in">
          <button type="button" className="dash-back-btn" onClick={goBack}>← Back to Assistant</button>
          <div className="dash-step-tracker"><StepTracker currentStep={currentStep} isLoggedIn={isLoggedIn} t={tt} /></div>
        </div>
      </div>
      <div className="dash-body">
        <div className="dash-left">
          <div className="sheet-inner">
            <div className="sheet-head">
              <div className="sheet-head-l"><AiLogo size={28} /><h2 id="sheet-ttl">{tt("profileTitle")}</h2></div>
            </div>
            <p className="sheet-desc">{tt("profileDesc")}</p>
            <div className="form-stack">
              <div style={{ borderRadius: 13, border: "1.5px solid rgba(196,165,116,0.35)", overflow: "hidden", background: "rgba(232,223,201,0.18)" }}>
                <div style={{ padding: "10px 14px 9px", borderBottom: "1px solid rgba(196,165,116,0.2)", background: "rgba(232,223,201,0.35)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12 }}>🧬</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#8a6d3e" }}>{tt("eligibilityHeader")}</span>
                </div>
                <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 13 }}>
                  <FField label="Scheme Coverage Preference" hint="AI will combine central and regional welfare programs for better recommendations.">
                    <div className="scope-toggle" style={{ marginTop: 4 }}>
                      <button type="button" className={`scope-btn${schemeScope === "Central Schemes (All India)" ? " active" : ""}`} onClick={() => setSchemeScope("Central Schemes (All India)")}>🏛 Central Schemes</button>
                      <button type="button" className={`scope-btn${schemeScope === "State Schemes (Regional)" ? " active" : ""}`} onClick={() => setSchemeScope("State Schemes (Regional)")}>🗺 State Schemes</button>
                    </div>
                    {isCentralScope ? <span className="fld-hint">🌐 Central schemes are available nationwide.</span> : <span className="fld-hint">📍 Select your state to match regional schemes.</span>}
                  </FField>
                  <FField label={tt("socialCatLabel")} hint={tt("socialCatHint")}><PillToggle options={["SC", "ST"]} value={socialCategory} onChange={setSocialCategory} /></FField>
                  <FField label={tt("genderLabel")}><SegToggle options={["Male", "Female", "Other"]} value={gender} onChange={setGender} /></FField>
                  <FField label={tt("educationLabel")}>
                    <FSelect value={education} onChange={e => setEducation(e.target.value)}>
                      <option value="">{tt("selectLabel")}</option>
                      <option>School Student</option><option>Undergraduate</option><option>Postgraduate</option><option>ITI / Diploma</option><option>Working Professional</option><option>Farmer</option><option>Self-Employed</option><option>Unemployed</option>
                    </FSelect>
                  </FField>
                  <FField label={tt("incomeLabel")} hint={tt("incomeFamilyHint")}>
                    <div className="income-selected">{INCOME_BRACKETS[incomeIdx]}</div>
                    <input type="range" className="income-range" min="0" max="4" step="1" value={incomeIdx} onChange={e => setIncomeIdx(Number(e.target.value))} />
                    <div className="income-labels">{INCOME_BRACKETS.map((l, i) => <span key={i} className="income-label">{i === 0 ? "<₹1L" : i === 4 ? ">₹10L" : ""}</span>)}</div>
                  </FField>
                  <FField label={tt("residenceLabel")}><PillToggle options={["Rural", "Urban", "Semi-Urban"]} value={residenceType} onChange={setResidenceType} /></FField>
                </div>
              </div>
              <FSec {...FSECS_BASE[0]} label={tt("personalInfo")}>
                <FField label={tt("fullNameLabel")} required><FInput ref={nameRef} onKeyDown={enterNext(ageRef)} type="text" placeholder={tt("aadhaarAs")} /></FField>
                <FField label={tt("ageLabel")} required>
                  <FSelect ref={ageRef} onKeyDown={enterNext(occRef)} defaultValue="">
                    <option value="">{tt("selectLabel")}</option>
                    {Array.from({ length: 100 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </FSelect>
                </FField>
              </FSec>
              <FSec {...FSECS_BASE[1]} label={tt("economicProfile")}>
                <FField label={tt("occupationLabel")} required><FInput ref={occRef} onKeyDown={enterNext(aadhaarRef)} type="text" placeholder={tt("occupationPlaceholder")} /></FField>
                <FField label={tt("bplLabel")}>
                  <FSelect defaultValue=""><option value="">{tt("selectLabel")}</option><option>Below Poverty Line (BPL)</option><option>Above Poverty Line (APL)</option><option>Not Sure</option></FSelect>
                </FField>
              </FSec>
              <FSec {...FSECS_BASE[2]} label={tt("location")}>
                <FField label={tt("stateUTLabel")} required>
                  <FSelect value={formState} onChange={e => setFormState(e.target.value)} disabled={isCentralScope} style={{ opacity: isCentralScope ? 0.45 : 1 }}>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </FSelect>
                  {isCentralScope && <span className="fld-hint">{tt("centralStateHint")}</span>}
                  {!isCentralScope && <span className="fld-hint">{tt("regionalStateHint")}</span>}
                </FField>
                <FField label={tt("districtLabel")}><FInput ref={districtRef} onKeyDown={enterNext(familyRef)} type="text" placeholder={tt("districtPlaceholder")} /></FField>
              </FSec>
              <FSec {...FSECS_BASE[3]} label={tt("documents")}>
                <FField label={tt("aadhaarLabel")} required>
                  <FInput ref={aadhaarRef} onKeyDown={enterNext(districtRef)} type="text" inputMode="numeric" placeholder={tt("aadhaarPlaceholder")} maxLength={10} />
                </FField>
                <div className="secure-badge"><span className="secure-badge-lock">🔒</span><span>{tt("secureDoc")}</span></div>
                {!isLoggedIn && <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "4px 0" }}>{tt("signInToStoreDocs")}</div>}
                <FField label={tt("incomeCertLabel")}><UploadPh name={tt("incomeCertLabel")} hint={tt("incomeCertHint")} uploadedPrefix={tt("uploadedPrefix")} /></FField>
                <FField label={tt("casteCertLabel")}><UploadPh name={tt("casteCertLabel")} hint={tt("casteCertHint")} uploadedPrefix={tt("uploadedPrefix")} /></FField>
                <div>
                  <div className="digilocker-divider"><div className="digilocker-divider-line" /><span className="digilocker-divider-text">{tt("orFetchFrom")}</span><div className="digilocker-divider-line" /></div>
                  <button type="button" className="digilocker-btn" onClick={() => setLoginModal(true)}>
                    <span className="digilocker-icon">🗂️</span>{tt("digiLockerFetch")}<span className="digilocker-trusted">{tt("govtTrusted")}</span>
                  </button>
                  <div className="digilocker-hint">{tt("digiLockerHint")}</div>
                </div>
              </FSec>
              <FSec {...FSECS_BASE[4]} label={tt("schemeInterest")}>
                <FField label={tt("primaryNeedLabel")}>
                  <FSelect defaultValue=""><option value="">{tt("selectCategory")}</option><option>Agriculture</option><option>Education</option><option>Health</option><option>Housing</option><option>Employment</option><option>Women &amp; Child</option><option>Finance &amp; Credit</option></FSelect>
                </FField>
                <FField label={tt("familySizeLabel")}><FInput ref={familyRef} onKeyDown={enterNext(null, true)} type="text" inputMode="numeric" placeholder={tt("familySizePlaceholder")} maxLength={10} /></FField>
              </FSec>
            </div>
            {!isLoggedIn && (
              <div className="auth-section">
                <div className="auth-section-title">{tt("saveProgress")}</div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{tt("signInDesc")}</p>
                <button type="button" className="auth-sign-in-btn" onClick={() => setLoginModal(true)}>{tt("signInToSave")}</button>
                <button type="button" className="auth-guest-link" onClick={goBack}>{tt("continueGuest")}</button>
              </div>
            )}
            <div className="sheet-acts">
              <button type="button" className="btn-sec">{tt("uploadMoreDocs")}</button>
              <button type="button" className="btn-pri" onClick={onSave}>{tt("saveProfile")}</button>
            </div>
          </div>
        </div>
        <div className="dash-right">
          <div className="dash-right-title">
            <AiLogo size={22} /> <span>Citizen Dashboard</span>
          </div>
          <div className="dash-widget">
            <div className="dash-widget-hd">📊 Profile Completion</div>
            <div className="dash-completion">
              <div className="dash-completion-ring">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(15,42,68,0.08)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--navy)" strokeWidth="8"
                    strokeDasharray={`${circumference * completionPct / 100} ${circumference * (1 - completionPct / 100)}`}
                    strokeDashoffset={circumference * 0.25} strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 0.5s ease" }} />
                  <text x="40" y="44" textAnchor="middle" fill="var(--navy)" fontSize="14" fontWeight="700" fontFamily="DM Sans,sans-serif">{completionPct}%</text>
                </svg>
              </div>
              <div className="dash-completion-items">
                {[{ label: "Eligibility Info", done: !!(socialCategory || gender) }, { label: "Personal Info", done: false }, { label: "Location", done: !!(formState) }, { label: "Documents", done: false }].map((item, i) => (
                  <div key={i} className="dash-check-item">
                    <span className={`dash-check-dot${item.done ? " done" : ""}`}>{item.done ? "✓" : "○"}</span>
                    <span className="dash-check-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dash-widget">
            <div className="dash-widget-hd">🔐 Verification Status</div>
            <div className="dash-verif-list">
              {[{ label: "Aadhaar", status: "pending" }, { label: "Income Certificate", status: "pending" }, { label: "Caste Certificate", status: "optional" }].map((v, i) => (
                <div key={i} className="dash-verif-item">
                  <span className="dash-verif-label">{v.label}</span>
                  <span className={`dash-verif-badge ${v.status}`}>{v.status === "done" ? "✓ Verified" : v.status === "pending" ? "⚠ Pending" : "Optional"}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="dash-widget">
            <div className="dash-widget-hd">📋 Scheme Summary</div>
            <div className="dash-stats-grid">
              <div className="dash-stat"><div className="dash-stat-n">7</div><div className="dash-stat-l">Eligible</div></div>
              <div className="dash-stat"><div className="dash-stat-n">3</div><div className="dash-stat-l">Applied</div></div>
              <div className="dash-stat"><div className="dash-stat-n">₹8.2K</div><div className="dash-stat-l">Potential/yr</div></div>
            </div>
          </div>
          <div className="dash-widget">
            <div className="dash-widget-hd">⚡ Quick Actions</div>
            <div className="dash-actions">
              <button type="button" className="dash-action-btn primary" onClick={onSave}>🔍 Find My Schemes</button>
              <button type="button" className="dash-action-btn" onClick={goBack}>💬 Start AI Chat</button>
              <button type="button" className="dash-action-btn">📥 Download Summary</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ELIGIBLE SCHEMES PAGE
═══════════════════════════════════════════════════════════════ */
function EligibleSchemesPage({ results, visibleCards, t, goBack, onSchemeDetail, onChecklist, isExpandedId, transformToChecklist, highlightId, openDrawerChecklist }) {
  const [activeTab, setActiveTab] = useState("eligible");
  const tt = t || ((k) => k);
  const TABS = [{ id: "eligible", label: "Eligible Schemes" }, { id: "actions", label: "Recommended Actions" }, { id: "conflicts", label: "Conflict Insights" }, { id: "tracking", label: "Application Tracking" }];
  return (
    <div className="schemes-page">
      <div className="schemes-hdr">
        <div className="schemes-hdr-in">
          <button type="button" className="dash-back-btn" onClick={goBack}>← Back to Assistant</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AiLogo size={22} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(228,222,212,0.96)" }}>Eligible Schemes</span>
            {results.length > 0 && <span className="rp-count" style={{ background: "rgba(196,165,116,0.2)", color: "var(--gold)", borderColor: "rgba(196,165,116,0.3)" }}>{results.length} found</span>}
          </div>
        </div>
        <div className="schemes-tabs">
          {TABS.map(tab => <button key={tab.id} type="button" className={`schemes-tab${activeTab === tab.id ? " active" : ""}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
        </div>
      </div>
      <div className="schemes-body">
        {activeTab === "eligible" && (
          <div className="schemes-grid">
            {results.length === 0 ? (
              <div className="rp-empty" style={{ gridColumn: "1/-1", height: 300 }}>
                <div className="rp-empty-ico">🔍</div>
                <p className="rp-empty-txt">Start a conversation in the AI assistant to find your eligible schemes.</p>
              </div>
            ) : results.map((s, i) => (
              <div key={s.id} style={{ position: 'relative' }}>
                <ResultCard scheme={s} idx={i} visible={visibleCards.includes(i)} t={tt}
                  onChecklist={onChecklist}
                  isExpanded={isExpandedId === s.id}
                  checklistData={transformToChecklist(s)}
                  highlight={highlightId === s.id}
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 w-7 h-7 bg-navy/10 hover:bg-navy/20 rounded-full flex items-center justify-center text-navy transition-colors z-10"
                  title="Open detailed checklist"
                  onClick={(e) => { e.stopPropagation(); openDrawerChecklist(s); }}
                >
                  📋
                </button>
                <button type="button" className="scheme-detail-link" onClick={() => onSchemeDetail(s)}>View Full Details →</button>
              </div>
            ))}
          </div>
        )}
        {activeTab === "actions" && (
          <div className="schemes-actions-list">
            <h2 className="schemes-section-ttl">Recommended Next Steps</h2>
            {AI_GUIDANCE.steps.map((step, i) => (
              <div key={i} className="schemes-action-item">
                <div className="schemes-action-num">{i + 1}</div>
                <div className="schemes-action-txt">{step}</div>
              </div>
            ))}
          </div>
        )}
        {activeTab === "conflicts" && (
          <div className="schemes-actions-list">
            <h2 className="schemes-section-ttl">Conflict Insights</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>Some schemes cannot be availed simultaneously. AI has detected these potential conflicts:</p>
            {results.filter(s => s.conflict).map((s, i) => (
              <div key={i} className="schemes-conflict-card">
                <div className="schemes-conflict-title">⚠ Conflict Detected</div>
                <div className="conflict-graph" style={{ margin: "8px 0" }}>
                  <div className="conflict-pill">{s.conflict.schemeA}</div>
                  <div className="conflict-line"><div className="conflict-line-inner"><div className="conflict-badge">⚠ conflict</div></div></div>
                  <div className="conflict-pill">{s.conflict.schemeB}</div>
                </div>
                <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0 }}>You may need to choose between these two schemes. Consult your local government office for guidance.</p>
              </div>
            ))}
            {results.filter(s => s.conflict).length === 0 && <div className="rp-empty" style={{ height: 200 }}><div className="rp-empty-ico">✅</div><p className="rp-empty-txt">No conflicts detected among your matched schemes.</p></div>}
          </div>
        )}
        {activeTab === "tracking" && (
          <div className="schemes-actions-list">
            <h2 className="schemes-section-ttl">Application Tracking</h2>
            {[{ scheme: "PM Kisan Samman Nidhi", status: "Applied", date: "15 Jan 2025", tag: "active" }, { scheme: "Ayushman Bharat PM-JAY", status: "Pending Docs", date: "—", tag: "pending" }, { scheme: "MGNREGS / MNREGA", status: "Registered", date: "02 Dec 2024", tag: "active" }].map((app, i) => (
              <div key={i} className="scheme-tracking-row">
                <div><div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{app.scheme}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Applied: {app.date}</div></div>
                <span className={`tracking-badge ${app.tag}`}>{app.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCHEME DETAIL PAGE
═══════════════════════════════════════════════════════════════ */
function SchemeDetailPage({ scheme, t, goBack }) {
  const [applyOpen, setApplyOpen] = useState(false);
  const [applySubmitted, setApplySubmitted] = useState(false);
  if (!scheme) return <div style={{ padding: 40 }}><button type="button" className="dash-back-btn" onClick={goBack}>← Back</button></div>;
  const tt = t || ((k) => k);
  const APPLY_STEPS = ["Gather documents: Aadhaar card, income certificate, bank passbook.", "Visit your nearest Common Service Centre (CSC) or gram panchayat.", "Fill the official application form or use the scheme's online portal.", "Submit your application and get the acknowledgment receipt.", "Track your status using the reference number provided."];
  const REQUIRED_DOCS = ["Aadhaar Card", "Income Certificate (Issued by Tehsildar)", "Bank Passbook (Aadhaar-linked)", "Passport-size Photograph"];
  return (
    <div className="detail-page">
      <div className="detail-hdr">
        <div className="detail-hdr-in">
          <button type="button" className="dash-back-btn" onClick={goBack}>← Back to Schemes</button>
          <span className="detail-tag" style={{ color: scheme.tagColor, background: scheme.tagBg, border: `1px solid ${scheme.tagColor}30` }}>{scheme.tag}</span>
          <span className="rc-draft">Draft Ready ✓</span>
        </div>
        <h1 className="detail-ttl">{scheme.title}</h1>
        <div className="rc-match" style={{ maxWidth: 300, marginTop: 10 }}>
          <div className="rc-match-bar"><div className="rc-match-fill" style={{ width: `${scheme.match}%`, background: scheme.match >= 85 ? "#2d6a4f" : "#b5550a" }} /></div>
          <span className="rc-match-pct" style={{ color: scheme.match >= 85 ? "#2d6a4f" : "#b5550a" }}>{scheme.match}% match</span>
        </div>
      </div>
      <div className="detail-body">
        <div className="detail-content">
          <div className="detail-section">
            <div className="detail-section-hd">📋 Overview</div>
            <p className="detail-section-txt">{scheme.reason}</p>
          </div>
          <div className="detail-section">
            <div className="detail-section-hd">🎁 Benefits</div>
            <div className="rc-buls">{scheme.bullets.map((b, i) => <div key={i} className="rc-bul"><span className="rc-dot" style={{ background: scheme.tagColor }} />{b}</div>)}</div>
          </div>
          {scheme.explainPoints && (
            <div className="detail-section">
              <div className="detail-section-hd">✅ Why You Are Eligible</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {scheme.explainPoints.map((p, i) => <div key={i} style={{ display: "flex", gap: 9, fontSize: 13.5, color: "var(--text)" }}><span style={{ color: "#2d6a4f", flexShrink: 0 }}>✓</span>{p}</div>)}
              </div>
            </div>
          )}
          <div className="detail-section">
            <div className="detail-section-hd">📎 Required Documents</div>
            <div className="detail-doc-list">
              {REQUIRED_DOCS.map((doc, i) => <div key={i} className="detail-doc-item"><span style={{ fontSize: 15 }}>📄</span>{doc}</div>)}
            </div>
          </div>
          <div className="detail-section">
            <div className="detail-section-hd">🗺 Application Steps</div>
            {APPLY_STEPS.map((step, i) => (
              <div key={i} className="detail-step-item">
                <div className="detail-step-n">{i + 1}</div>
                <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6, paddingTop: 2 }}>{step}</div>
              </div>
            ))}
            <button type="button" className="detail-apply-btn" style={{ marginTop: 16 }} onClick={() => setApplyOpen(v => !v)}>
              {applyOpen ? "Hide Application Form" : "🚀 Apply Now — Upload Documents"}
            </button>
            {applyOpen && (
              <div className="detail-apply-zone">
                <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: "0 0 14px" }}>Upload your documents for auto-fill preview:</p>
                <UploadPh name="Upload Aadhaar / Income Certificate" hint="PDF or image" uploadedPrefix="Uploaded:" />
                {!applySubmitted ? (
                  <button type="button" style={{ marginTop: 12, padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--navy)", color: "var(--gold)", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }} onClick={() => setApplySubmitted(true)}>Generate Auto-Fill Preview</button>
                ) : (
                  <div className="detail-autofill-badge">✅ Auto-Fill Preview Ready — Redirecting to Portal…</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════════════ */
export default function App() {
  // ── Page routing ──
  const [currentPage, setCurrentPage] = useState("landing");
  const [selectedScheme, setSelectedScheme] = useState(null);
  const { currentUser, logout: firebaseLogout, googleSignIn } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  const isLoggedIn = !!currentUser;

  const authUser = currentUser ? {
    name: currentUser.displayName || currentUser.email.split("@")[0],
    initials: (currentUser.displayName ? currentUser.displayName[0] : currentUser.email[0]).toUpperCase(),
    photo: currentUser.photoURL
  } : null;

  const goTo = useCallback((page, data) => {
    setCurrentPage(page);
    if (data !== undefined) setSelectedScheme(data);
  }, []);

  // ── Utility ──
  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); }, []);

  // ── Route Protection ──
  useEffect(() => {
    if (!isLoggedIn && !isGuest && currentPage !== "landing") {
      setCurrentPage("landing");
    }
  }, [isLoggedIn, isGuest, currentPage]);

  const handleGoogleLogin = async () => {
    try {
      await googleSignIn();
      goTo("main");
    } catch (err) {
      showToast("Google Sign-In failed. Please try again.");
    }
  };

  const handleContinueAsGuest = () => {
    setIsGuest(true);
    goTo("main");
  };

  // ── Existing state ──
  const [lang, setLang] = useState("en");
  const [stateSel, setStateSel] = useState("Gujarat");
  const [profileOpen, setProfile] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [activeHist, setActiveHist] = useState("1");
  const [activeScheme, setActiveSch] = useState(null);
  const [messages, setMessages] = useState(null);
  const [results, setResults] = useState([]);
  const [visibleCards, setVisibleCards] = useState([]);
  const [isTyping, setTyping] = useState(false);
  const [chatFile, setChatFile] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [currentStep, setCurrentStep] = useState("profile");

  const [loginModal, setLoginModal] = useState(false);
  const [authDropdown, setAuthDropdown] = useState(false);
  const [toast, setToast] = useState(null);

  // Form state (hoisted so CitizenDashboardPage can share it)
  const [socialCategory, setSocialCategory] = useState(null);
  const [gender, setGender] = useState(null);
  const [education, setEducation] = useState("");
  const [incomeIdx, setIncomeIdx] = useState(1);
  const [residenceType, setResidenceType] = useState(null);
  const [schemeScope, setSchemeScope] = useState("Central Schemes (All India)");
  const [formState, setFormState] = useState("Gujarat");

  // Checklist state
  const [checklistDrawerOpen, setChecklistDrawerOpen] = useState(false);
  const [activeChecklistData, setActiveChecklistData] = useState(null);
  const [inlineChecklistId, setInlineChecklistId] = useState(null);
  const [highlightInline, setHighlightInline] = useState(false);

  const t = useT(lang);
  const canvasRef = useRef(null);
  const chatFileRef = useRef(null);
  const authRef = useRef(null);
  const nameRef = useRef(null);
  const ageRef = useRef(null);
  const occRef = useRef(null);
  const aadhaarRef = useRef(null);
  const districtRef = useRef(null);
  const familyRef = useRef(null);


  const handleSend = useCallback(async (text) => {
    const msg = (text || inputVal).trim();
    if (!msg && !chatFile) return;
    setInputVal("");
    const userMsg = { role: "user", text: msg || `[File: ${chatFile}]`, time: fmtTime() };
    setChatFile(null);

    // Capture messages BEFORE updating state (current history without the new message)
    const currentMessages = messages ?? [];
    setMessages(prev => [...(prev ?? []), userMsg]);
    setCurrentStep("schemes");
    setTyping(true);

    // Build conversation history for the backend (all previous turns)
    const conversationHistory = currentMessages
      .filter(m => m.role === "user" || m.role === "ai")
      .map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.role === "ai"
          ? (m.guidance?.intro || "")
          : (m.text || ""),
      }))
      .filter(m => m.content);

    try {
      const response = await fetch(`${API_BASE}/find-schemes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizen_profile: msg,
          preferred_language: lang,
          conversation_history: conversationHistory,
        })
      });
      const data = await response.json();
      setTyping(false);

      // Handle backend error responses
      if (data.error) {
        setMessages(prev => [...(prev ?? []), {
          role: "ai",
          time: fmtTime(),
          guidance: { intro: `Sorry, I encountered an error: ${data.error}. Please try again.`, steps: [], followUp: "" }
        }]);
        return;
      }

      const aiIntro = data.message || "Here are the government schemes I found for you.";
      setMessages(prev => [...(prev ?? []), {
        role: "ai",
        time: fmtTime(),
        guidance: { intro: aiIntro, steps: [], followUp: "" }
      }]);
      setResults(data.schemes || []);
      setVisibleCards([]);
      (data.schemes || []).forEach((_, i) => setTimeout(() => setVisibleCards(prev => [...prev, i]), i * 120));
      setCurrentStep("checklist");
    } catch (err) {
      setTyping(false);
      showToast("❌ Connection error. Please ensure backend is running on port 8000.");
    } finally {
      setTimeout(() => { if (canvasRef.current) canvasRef.current.scrollTop = canvasRef.current.scrollHeight; }, 80);
    }
  }, [inputVal, chatFile, lang, messages, showToast]);




  const enterNext = useCallback((nextRef, isLast = false) => (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isLast) { goTo("main"); handleSend("Show me schemes matching my profile"); }
      else if (nextRef && nextRef.current) { nextRef.current.focus(); }
    }
  }, [goTo, handleSend]);

  const { placeholder: rotatePlaceholder, fading: placeholderFading } = useRotatingPlaceholder(PLACEHOLDER_HINTS);
  const onSpeechResult = useCallback((text) => setInputVal(prev => (prev ? prev + " " + text : text)), []);
  const speech = useSpeech({ onResult: onSpeechResult, lang });

  useEffect(() => {
    const h = (e) => { if (authRef.current && !authRef.current.contains(e.target)) setAuthDropdown(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleAuthSuccess = () => {
    setLoginModal(false);
    showToast("✅ Your welfare journey is now securely saved.");
    goTo("main");
  };

  const handleLogout = async () => {
    try { await firebaseLogout(); setAuthDropdown(false); goTo("landing"); }
    catch (err) { showToast("Error logging out"); }
  };
  const handleChatFileChange = (e) => { const file = e.target.files && e.target.files[0]; if (file) setChatFile(file.name); e.target.value = ""; };
  const handleNewChat = useCallback(() => { setMessages(null); setResults([]); setVisibleCards([]); setInputVal(""); setChatFile(null); setCurrentStep("profile"); if (canvasRef.current) canvasRef.current.scrollTop = 0; }, []);


  // ── Checklist Helpers ──
  const transformToChecklist = useCallback((scheme) => {
    if (!scheme) return null;
    return {
      id: scheme.id,
      scheme_name: scheme.title,
      progress: scheme.match || 0,
      eligibility: (scheme.explainPoints || []).map((p, idx) => ({ text: p, status: idx === 0 ? 'completed' : 'pending' })),
      documents: (scheme.bullets || []).map(b => ({ text: b, status: b.toLowerCase().includes('need') || b.toLowerCase().includes('must') ? 'attention' : 'pending' })),
      steps: [
        "Visit the official portal or your nearest Common Service Centre (CSC).",
        "Fill out the application form with accurate personal and bank details.",
        "Upload the required documents (Aadhaar, Income Certificate, etc.).",
        "Submit the form and note down your application reference number.",
        "Undergo physical verification if required by the local authorities."
      ],
      status: [
        { label: "Document Verification", value: "Done" },
        { label: "Bank Account Seeded", value: "Done" },
        { label: "Final Approval", value: "Pending" }
      ]
    };
  }, []);

  const openDrawerChecklist = (scheme) => {
    setActiveChecklistData(transformToChecklist(scheme));
    setChecklistDrawerOpen(true);
  };

  const toggleInlineChecklist = (schemeId) => {
    if (inlineChecklistId === schemeId) {
      setInlineChecklistId(null);
    } else {
      setInlineChecklistId(schemeId);
      setHighlightInline(true);
      setTimeout(() => setHighlightInline(false), 1500);
    }
  };


  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const micErrorMsg = speech.error === "denied" ? t("micDenied") : speech.error === "unsupported" ? t("micUnsupported") : null;
  const isCentralScope = schemeScope === "Central Schemes (All India)";

  const dashboardProps = { currentStep, t, isLoggedIn, socialCategory, setSocialCategory, gender, setGender, education, setEducation, incomeIdx, setIncomeIdx, residenceType, setResidenceType, schemeScope, setSchemeScope, formState, setFormState, isCentralScope, nameRef, ageRef, occRef, aadhaarRef, districtRef, familyRef, enterNext, setLoginModal, onSave: () => { goTo("main"); handleSend("Show me schemes matching my profile"); }, goBack: () => goTo("main") };

  return (
    <>
      <style>{CSS}</style>
      <div key={currentPage} className="page-transition">
        {currentPage === "landing" ? (
          <LandingPage
            onLogin={() => setLoginModal(true)}
            onGoogleLogin={handleGoogleLogin}
            onContinue={handleContinueAsGuest}
            loginModal={loginModal}
            setLoginModal={setLoginModal}
            handleAuthSuccess={handleAuthSuccess}
            toast={toast}
          />
        ) : (
          <div className={`app${darkMode ? " dark" : ""}`}>
            <div className="persistent-home-bar">
              <button type="button" className="home-nav-btn" onClick={() => goTo("landing")}>
                <span style={{ fontSize: 16 }}>🏠</span> Home
              </button>
            </div>

            {/* ── ANNOUNCEMENT BAR ── */}
            <AnnounceBar />

            {/* ── HEADER ── */}
            <header className="hdr">
              <div className="hdr-in">
                <div className="hdr-l">
                  <AiLogo size={26} />
                  <div className="hdr-title-wrap">
                    <span className="hdr-title">{t("appTitle")}</span>
                    <span className="hdr-motto">Bridging Citizens and Welfare through Artificial Intelligence</span>
                  </div>
                  <span className="ai-badge">AI Powered</span>
                </div>
                <div className="hdr-r">
                  <div className="lang-wrap">
                    <label className="lang-lbl" htmlFor="lang-s">{t("language")}</label>
                    <select id="lang-s" className="lang-sel" value={lang} onChange={e => setLang(e.target.value)}>
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                  </div>
                  <StateDropdown value={stateSel} onChange={setStateSel} />
                  <button type="button" className="theme-toggle" onClick={() => setDarkMode(d => !d)} title="Toggle theme">
                    {darkMode ? <ISun /> : <IMoon />}
                  </button>
                  {isLoggedIn ? (
                    <div ref={authRef} style={{ position: "relative" }}>
                      <div className="auth-avatar" onClick={() => setAuthDropdown(d => !d)}>
                        {authUser?.photo ? <img src={authUser.photo} alt={authUser.name} style={{ width: "100%", height: "100%", borderRadius: "50%" }} /> : authUser?.initials || "U"}
                      </div>
                      {authDropdown && (
                        <div className="auth-dropdown">
                          <div style={{ padding: "10px 12px", borderBottom: "1px solid #eee", fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>{authUser.name}</div>
                          <button type="button" className="auth-dropdown-item" onClick={() => { setAuthDropdown(false); goTo("dashboard"); }}><IUser /> {t("profileDropdown")}</button>
                          <button type="button" className="auth-dropdown-item">{t("savedSchemes")}</button>
                          <button type="button" className="auth-dropdown-item danger" onClick={handleLogout}>{t("logout")}</button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </header>

            {/* ── MAIN AI PAGE ── */}
            {currentPage === "main" && (
              <div className="app-body">
                {/* LEFT SIDEBAR */}
                <aside className={`sidebar${sidebarCollapsed ? " collapsed" : ""}`} style={{ position: "relative" }}>
                  <div className="sb-brand" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <AiLogo size={24} />
                      <div><div className="sb-name">PolicyPilot</div><div className="sb-tag">Welfare Scheme Guide</div></div>
                    </div>
                    <button type="button" className="sidebar-toggle" onClick={() => setSidebarCollapsed(c => !c)} title="Close sidebar">✕</button>
                  </div>
                  <button type="button" className="new-chat-btn" onClick={handleNewChat}><IPlus /> {t("newChat")}</button>
                  <div className="sb-search">
                    <div className="sb-search-wrap">
                      <span className="sb-search-icon"><ISearch /></span>
                      <input className="sb-search-inp" placeholder={t("searchPlaceholder")} />
                    </div>
                  </div>
                  <div className="sb-scroll">
                    <p className="sb-lbl">{t("recentChats")}</p>
                    <ul className="hist-list">
                      {CHAT_HISTORY.map(item => (
                        <li key={item.id}>
                          <button type="button" className={`hist-btn${activeHist === item.id ? " active" : ""}`} onClick={() => setActiveHist(item.id)}>
                            <span className="hist-ttl">{item.title}</span>
                            <span className="hist-meta">{item.meta}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="sb-div" style={{ margin: "10px 4px 6px" }} />
                    <p className="sb-lbl">{t("browseSchemes")}</p>
                    {SCHEME_NAV.map(s => (
                      <button key={s.id} type="button" className={`scheme-nav-btn${activeScheme === s.id ? " active" : ""}`}
                        onClick={() => { setActiveSch(s.id); handleSend(`Tell me about ${s.name}`); }}>
                        <span className="sn-dot" style={{ background: s.color }} />
                        <span className="sn-name">{s.name}</span>
                        <span className="sn-cat">{s.cat}</span>
                      </button>
                    ))}
                  </div>
                  <div className="sb-footer">
                    <button type="button" className="profile-btn" onClick={() => goTo("dashboard")}>
                      <IDoc /> {t("citizenProfile")}
                    </button>
                  </div>
                </aside>

                {/* CHAT CANVAS */}
                <main className="chat-canvas" ref={canvasRef} style={{ position: "relative" }}>
                  {sidebarCollapsed && (
                    <button type="button" className="sidebar-open-btn" onClick={() => setSidebarCollapsed(false)} title="Open sidebar">☰</button>
                  )}
                  <div className="canvas-in">
                    {!messages && (
                      <div className="empty-state">
                        <div className="empty-orb"><AiLogo size={30} /></div>
                        <div className="empty-ttl">{t("emptyTitle")}</div>
                        <p className="empty-sub">{t("emptySub")}</p>
                        <div className="quick-chips" style={{ justifyContent: "center" }}>
                          {STARTERS.map((q, i) => <button key={i} type="button" className="chip" onClick={() => handleSend(q)}>{q}</button>)}
                        </div>
                        <button type="button" className="find-schemes-cta" onClick={() => goTo("dashboard")}>🔍 Find My Schemes</button>
                      </div>
                    )}
                    {messages && (
                      <div className="msgs-col">
                        <div className="turn ai-turn">
                          <div className="turn-av"><span className="turn-av-dot" /></div>
                          <div className="turn-body">
                            <div className="turn-meta"><AiLogo size={18} /><span className="turn-name" style={{ marginLeft: 5 }}>PolicyPilot AI</span><span className="turn-time">2:56 pm</span></div>
                            <div className="ai-card"><p className="ai-txt">Namaste! I'm PolicyPilot — your AI guide to government welfare schemes. Tell me about your situation and I'll walk you through exactly what to do next. Matched scheme cards will appear in the panel on the right.</p></div>
                          </div>
                        </div>
                        {messages.map((msg, i) => msg.role === "user" ? (
                          <div key={i} className="turn user-turn">
                            <div className="turn-body">
                              <div className="turn-meta user-meta"><span className="turn-name">You</span><span className="turn-time">{msg.time}</span></div>
                              <div className="user-bubble">{msg.text}</div>
                            </div>
                          </div>
                        ) : (
                          <div key={i} className="turn ai-turn">
                            <div className="turn-av"><span className="turn-av-dot" /></div>
                            <div className="turn-body">
                              <div className="turn-meta"><AiLogo size={18} /><span className="turn-name" style={{ marginLeft: 5 }}>PolicyPilot AI</span><span className="turn-time">{msg.time}</span></div>
                              <div className="ai-card">
                                <p className="ai-txt">{msg.guidance.intro}</p>
                                <div className="ai-steps">{msg.guidance.steps.map((s, si) => <div key={si} className="ai-step"><span className="ai-step-n">{si + 1}</span>{s}</div>)}</div>
                                <p className="ai-txt" style={{ marginTop: 12, color: "var(--text-muted)" }}>{msg.guidance.followUp}</p>
                                <div className="quick-chips">
                                  {["Tell me about PM Kisan documents", "How to apply for Ayushman Bharat", "What's the scholarship deadline?"].map((q, qi) => (
                                    <button key={qi} type="button" className="chip" onClick={() => handleSend(q)}>{q}</button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <div className="turn ai-turn">
                            <div className="turn-av"><span className="turn-av-dot" /></div>
                            <div className="turn-body">
                              <div className="turn-meta"><AiLogo size={18} /><span className="turn-name" style={{ marginLeft: 5 }}>PolicyPilot AI</span></div>
                              <SmartTyping />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* INPUT */}
                    <div className="input-shell">
                      {chatFile && (
                        <div className="chat-upload-preview">
                          <ICheck /><span>{t("uploadedPrefix")} {chatFile}</span>
                          <button type="button" onClick={() => setChatFile(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--navy)", fontSize: 14, lineHeight: 1 }}>×</button>
                        </div>
                      )}
                      <div className="input-box">
                        <div className="input-tools">
                          <input ref={chatFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: "none" }} onChange={handleChatFileChange} />
                          <button type="button" className={`itool${speech.listening ? " listening" : ""}`} onClick={speech.listening ? speech.stop : speech.start} aria-label={speech.listening ? t("stopListening") : t("voiceLabel")}>
                            {speech.listening ? <IStop /> : <IMic />}
                          </button>
                          <button type="button" className="itool" aria-label={t("uploadLabel")} onClick={() => chatFileRef.current && chatFileRef.current.click()}><IUp /></button>
                        </div>
                        <input type="text" className={`ifield${placeholderFading ? " fade-placeholder" : ""}`} placeholder={rotatePlaceholder} value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={handleKey} aria-label="Message" />
                        <button type="button" className="isend" onClick={() => handleSend()} aria-label={t("sendLabel")}><ISend /></button>
                      </div>
                      {speech.listening && <div className="listen-pill">{t("listening")}</div>}
                      {micErrorMsg && <div className="mic-error">{micErrorMsg}</div>}
                    </div>
                    <div className="chat-note">{t("disclaimer")}</div>
                  </div>
                </main>

                {/* RIGHT RESULTS PANEL */}
                <aside className="right-panel" aria-label="Matched schemes">
                  <div className="rp-hdr">
                    <div className="rp-hdr-l"><ITarget /><span className="rp-ttl">{t("matchedSchemes")}</span></div>
                    {results.length > 0 && <span className="rp-count">{results.length} {t("found")}</span>}
                  </div>
                  {results.length > 0 && (
                    <div style={{ padding: "8px 11px 0" }}>
                      <button type="button" onClick={() => goTo("schemes")} style={{ width: "100%", padding: "8px 12px", borderRadius: 9, border: "1px solid rgba(15,42,68,0.2)", background: "rgba(15,42,68,0.05)", color: "var(--navy)", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", transition: "all 0.18s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(15,42,68,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(15,42,68,0.05)"; }}>
                        📊 View All Eligible Schemes →
                      </button>
                    </div>
                  )}
                  <div className="rp-scroll">
                    {results.length === 0 ? (
                      <div className="rp-empty"><div className="rp-empty-ico">🔍</div><p className="rp-empty-txt">{t("schemeResultsHint")}</p></div>
                    ) : (
                      results.map((s, i) => (
                        <div key={s.id} style={{ position: 'relative' }}>
                          <ResultCard scheme={s} idx={i} visible={visibleCards.includes(i)} t={t}
                            onChecklist={toggleInlineChecklist}
                            isExpanded={inlineChecklistId === s.id}
                            checklistData={transformToChecklist(s)}
                            highlight={highlightInline && inlineChecklistId === s.id}
                          />
                          <button
                            type="button"
                            className="absolute top-2 right-2 w-7 h-7 bg-navy/10 hover:bg-navy/20 rounded-full flex items-center justify-center text-navy transition-colors z-10"
                            title="Open detailed checklist"
                            onClick={(e) => { e.stopPropagation(); openDrawerChecklist(s); }}
                          >
                            📋
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </aside>
              </div>
            )}

            {/* ── CITIZEN DASHBOARD ── */}
            {currentPage === "dashboard" && <CitizenDashboardPage {...dashboardProps} />}

            {/* ── ELIGIBLE SCHEMES ── */}
            {currentPage === "schemes" && (
              <EligibleSchemesPage
                results={results}
                visibleCards={visibleCards}
                t={t}
                goBack={() => goTo("main")}
                onSchemeDetail={(s) => goTo("schemeDetail", s)}
                onChecklist={toggleInlineChecklist}
                isExpandedId={inlineChecklistId}
                transformToChecklist={transformToChecklist}
                highlightId={highlightInline ? inlineChecklistId : null}
                openDrawerChecklist={openDrawerChecklist}
              />
            )}

            {/* ── SCHEME DETAIL ── */}
            {currentPage === "schemeDetail" && (
              <SchemeDetailPage scheme={selectedScheme} t={t} goBack={() => goTo("schemes")} />
            )}

            {/* ── TRUST FOOTER ── */}
            {currentPage === "main" && (
              <div className="trust-bar">
                <div className="trust-item">🤖 Powered by AI Policy Engine</div>
                <div className="trust-dot" />
                <div className="trust-item">✅ Verified Government Sources</div>
                <div className="trust-dot" />
                <div className="trust-item">🔒 Data Stays on Your Device</div>
              </div>
            )}

            {/* ── LOGIN MODAL ── */}
            {loginModal && <LoginModal onClose={() => setLoginModal(false)} onSuccess={handleAuthSuccess} t={t} />}

            {/* ── CHECKLIST DRAWER ── */}
            <ChecklistDrawer
              isOpen={checklistDrawerOpen}
              onClose={() => setChecklistDrawerOpen(false)}
              data={activeChecklistData}
            />

            {/* ── TOAST ── */}
            {toast && <div className="toast">{toast}</div>}

          </div>
        )}
      </div>
    </>
  );
}


