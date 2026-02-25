import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Square, Mic, MicOff, BookOpen, 
  ChevronLeft, Volume2, Info, List, FileText, 
  HelpCircle, CheckCircle, ArrowRight, ArrowLeft
} from 'lucide-react';

// --- EXPANDED MOCK DATA ---
const ncertData = [
  {
    id: 's1',
    title: 'Science (Class 10)',
    description: 'Explore the natural world, physics, chemistry, and biology.',
    keywords: ['science', 'physics', 'chemistry', 'biology'],
    chapters: [
      { 
        id: 'c1', 
        title: 'Chapter 1: Chemical Reactions', 
        keywords: ['chapter 1', 'chapter one', 'chemical reactions'],
        content: 'Chemical reactions involve the breaking and making of bonds between atoms to produce new substances. When a chemical change occurs, we can say that a chemical reaction has taken place. For example, burning of magnesium ribbon in air to form magnesium oxide. A complete chemical equation represents the reactants, products and their physical states symbolically.',
        summary: 'This chapter explains how chemical changes form new substances, how to write balanced chemical equations, and the different types of reactions like combination and decomposition.',
        qa: [
          { q: "What is a balanced equation?", a: "An equation where the number of atoms of each element is equal on both sides." },
          { q: "Why do we apply paint on iron articles?", a: "To prevent them from rusting by cutting off their contact with air and moisture." }
        ]
      },
      { 
        id: 'c2', 
        title: 'Chapter 2: Acids, Bases and Salts', 
        keywords: ['chapter 2', 'chapter two', 'acids', 'bases', 'salts'],
        content: 'Acids are sour in taste and change the colour of blue litmus to red. Bases are bitter in taste and change the colour of red litmus to blue. Salts are produced when an acid reacts with a base. The pH scale measures the hydrogen ion concentration in a solution.',
        summary: 'Learn about the properties of acids and bases, how they react with metals and each other, the concept of pH, and the formation of various everyday salts.',
        qa: [
          { q: "What is the pH of pure water?", a: "The pH of pure water is exactly 7, meaning it is neutral." },
          { q: "Name the acid present in ant sting.", a: "Methanoic acid is present in an ant sting." }
        ]
      },
      { 
        id: 'c3', 
        title: 'Chapter 3: Metals and Non-metals', 
        keywords: ['chapter 3', 'chapter three', 'metals', 'non metals'],
        content: 'Elements can be classified as metals and non-metals based on their properties. Metals are lustrous, malleable, ductile and are good conductors of heat and electricity. Non-metals have properties opposite to that of metals.',
        summary: 'This chapter covers physical and chemical properties of metals and non-metals, how they react with water and oxygen, and the extraction of metals from ores.',
        qa: [
          { q: "Which metal is liquid at room temperature?", a: "Mercury is a metal that is liquid at room temperature." }
        ]
      }
    ]
  },
  {
    id: 's2',
    title: 'History (Class 10)',
    description: 'Discover the events that shaped our modern world.',
    keywords: ['history', 'past', 'social science'],
    chapters: [
      { 
        id: 'h1', 
        title: 'Chapter 1: Nationalism in Europe', 
        keywords: ['chapter 1', 'chapter one', 'nationalism', 'europe'],
        content: 'In 1848, Frédéric Sorrieu, a French artist, prepared a series of four prints visualising his dream of a world made up of democratic and social Republics. The 19th century witnessed the emergence of nationalism as a force which brought about sweeping changes in the political and mental world of Europe.',
        summary: 'The chapter traces the rise of the nation-state in Europe, covering the French Revolution, the making of Germany and Italy, and the visualization of the nation.',
        qa: [
          { q: "Who was Frederic Sorrieu?", a: "A French artist who visualised a world made of democratic and social republics." }
        ]
      },
      { 
        id: 'h2', 
        title: 'Chapter 2: Nationalism in India', 
        keywords: ['chapter 2', 'chapter two', 'nationalism in india', 'india'],
        content: 'In India, the growth of modern nationalism is intimately connected to the anti-colonial movement. People began discovering their unity in the process of their struggle with colonialism. Mahatma Gandhi successfully organised satyagraha movements in various places.',
        summary: 'Explores the Indian independence movement from the 1920s onwards, focusing on the Non-Cooperation and Civil Disobedience Movements led by Mahatma Gandhi.',
        qa: [
          { q: "What is Satyagraha?", a: "It is a non-violent method of mass agitation relying on the power of truth." }
        ]
      }
    ]
  },
  {
    id: 's3',
    title: 'English (Class 10)',
    description: 'Literature, grammar, and communication skills.',
    keywords: ['english', 'literature', 'grammar'],
    chapters: [
      { 
        id: 'e1', 
        title: 'Chapter 1: A Letter to God', 
        keywords: ['chapter 1', 'chapter one', 'letter to god'],
        content: 'The house — the only one in the entire valley — sat on the crest of a low hill. From this height one could see the river and the field of ripe corn dotted with the flowers that always promised a good harvest. Lencho was a farmer who wrote a letter to God asking for 100 pesos.',
        summary: 'A story of immense faith where a poor farmer, ruined by a hailstorm, writes a letter to God seeking financial help, and the postmaster tries to keep his faith intact.',
        qa: [
          { q: "Why did Lencho write a letter to God?", a: "Because his crops were completely destroyed by a hailstorm and he needed 100 pesos to survive." }
        ]
      }
    ]
  }
];

export default function App() {
  // --- STATE MANAGEMENT ---
  const [currentView, setCurrentView] = useState('home'); // 'home', 'subject', 'chapter'
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  
  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentlyPlayingType, setCurrentlyPlayingType] = useState(null); // 'content', 'summary', 'qa'
  
  // Voice Command State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const lastCommandRef = useRef(''); // Tracks the last executed command to prevent rapid duplicate firing

  // --- INITIALIZATION & CLEANUP ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      // Set interimResults to true so it analyzes words instantly as they are spoken
      recognition.interimResults = true; 
      recognition.lang = 'en-IN'; 

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        // Combine all pieces of the current speech fragment
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // Prefer final, fallback to interim if the user is still speaking
        const recognizedText = (finalTranscript || interimTranscript).toLowerCase().trim();
        setTranscript(recognizedText);

        // Instantly process command if it's new
        if (recognizedText && recognizedText !== lastCommandRef.current) {
          const actionTaken = handleVoiceCommand(recognizedText);
          
          if (actionTaken) {
            lastCommandRef.current = recognizedText;
            
            // Clear the lock after 2 seconds so the user can use the same command again later
            setTimeout(() => { lastCommandRef.current = ''; }, 2000);
            
            // Flush the buffer to avoid trailing words re-triggering actions
            try { recognition.stop(); } catch(e) {} 
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Auto-restart if it was meant to be listening (keeps it listening indefinitely)
        if (isListening) {
          try { recognition.start(); } catch(e) {}
        }
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      synthesisRef.current.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentView, selectedSubject, selectedChapter, isListening]);

  // Stop audio if user navigates away from chapter
  useEffect(() => {
    if (currentView !== 'chapter') {
      stopAudio();
    }
  }, [currentView]);

  // --- TEXT TO SPEECH (TTS) FUNCTIONS ---
  const playAudio = (text, type = 'content') => {
    if (isPaused && currentlyPlayingType === type) {
      synthesisRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    synthesisRef.current.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-IN') && v.name.includes('Female')) || 
                           voices.find(v => v.lang.includes('en-IN')) || 
                           voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 0.9; 
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentlyPlayingType(null);
    };

    setCurrentlyPlayingType(type);
    synthesisRef.current.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseAudio = () => {
    if (synthesisRef.current.speaking) {
      synthesisRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    synthesisRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentlyPlayingType(null);
  };

  const speakSystem = (text) => {
    setFeedbackMessage(text);
    if (!isPlaying) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1; 
      synthesisRef.current.speak(utterance);
    }
    setTimeout(() => setFeedbackMessage(''), 5000);
  };

  // --- FAST VOICE COMMAND ROUTER ---
  // Returns true if a command was matched and executed, allowing the engine to flush the buffer
  const handleVoiceCommand = (command) => {
    console.log("Processing instant command:", command);
    
    // 1. GLOBAL COMMANDS
    if (command.includes('stop') || command.includes('shut up')) {
      stopAudio();
      speakSystem("Audio stopped.");
      return true;
    }
    if (command.includes('pause')) {
      pauseAudio();
      return true;
    }
    if (command.includes('resume') || command.includes('continue')) {
      if (isPaused && selectedChapter) {
        playAudio(selectedChapter.content, currentlyPlayingType);
        return true;
      }
      return false; // Can't resume if not paused
    }
    if (command.includes('help') || command.includes('what can i say')) {
      readAvailableCommands();
      return true;
    }
    if (command.includes('go back') || command.includes('back')) {
      if (currentView === 'chapter') {
        setCurrentView('subject');
        setSelectedChapter(null);
        speakSystem("Going back to chapters.");
        return true;
      } else if (currentView === 'subject') {
        setCurrentView('home');
        setSelectedSubject(null);
        speakSystem("Going to home screen.");
        return true;
      }
      return false;
    }
    if (command.includes('home')) {
      setCurrentView('home');
      setSelectedSubject(null);
      setSelectedChapter(null);
      speakSystem("Going to home screen.");
      return true;
    }

    // 2. CONTEXTUAL COMMANDS: HOME VIEW (Selecting a Subject)
    if (currentView === 'home') {
      const matchedSubject = ncertData.find(sub => 
        sub.keywords.some(kw => command.includes(kw))
      );
      if (matchedSubject) {
        handleSubjectClick(matchedSubject);
        return true;
      }
      return false; // No subject matched yet
    }

    // 3. CONTEXTUAL COMMANDS: SUBJECT VIEW (Selecting a Chapter)
    if (currentView === 'subject' && selectedSubject) {
      const matchedChapter = selectedSubject.chapters.find(chap => 
        chap.keywords.some(kw => command.includes(kw))
      );
      if (matchedChapter) {
        handleChapterClick(matchedChapter);
        return true;
      } else if (command.includes('first') || command.includes('chapter one') || command.includes('chapter 1')) {
        handleChapterClick(selectedSubject.chapters[0]);
        return true;
      } else if ((command.includes('second') || command.includes('chapter two') || command.includes('chapter 2')) && selectedSubject.chapters.length > 1) {
        handleChapterClick(selectedSubject.chapters[1]);
        return true;
      }
      return false; // No chapter matched yet
    }

    // 4. CONTEXTUAL COMMANDS: CHAPTER VIEW (Reading Content, Navigating)
    if (currentView === 'chapter' && selectedChapter && selectedSubject) {
      if (command.includes('read') || command.includes('play') || command.includes('start')) {
        if (command.includes('summary')) {
          playAudio(`Summary. ${selectedChapter.summary}`, 'summary');
          speakSystem("Reading summary.");
          return true;
        } else if (command.includes('question') || command.includes('answer')) {
          const qsText = selectedChapter.qa.map((q, i) => `Question ${i+1}. ${q.q} Answer. ${q.a}`).join('. ');
          playAudio(`Questions and Answers. ${qsText}`, 'qa');
          speakSystem("Reading questions.");
          return true;
        } else if (command.includes('read chapter') || command.includes('play chapter') || command.includes('full text')) {
          playAudio(selectedChapter.content, 'content');
          speakSystem("Reading chapter content.");
          return true;
        }
      }
      
      // Next / Previous Chapter Logic
      if (command.includes('next chapter') || command.includes('forward') || command.includes('next')) {
        const currentIndex = selectedSubject.chapters.findIndex(c => c.id === selectedChapter.id);
        if (currentIndex < selectedSubject.chapters.length - 1) {
          handleChapterClick(selectedSubject.chapters[currentIndex + 1]);
        } else {
          speakSystem("This is the last chapter in this subject.");
        }
        return true;
      }
      if (command.includes('previous chapter') || command.includes('previous')) {
        const currentIndex = selectedSubject.chapters.findIndex(c => c.id === selectedChapter.id);
        if (currentIndex > 0) {
          handleChapterClick(selectedSubject.chapters[currentIndex - 1]);
        } else {
          speakSystem("This is the first chapter.");
        }
        return true;
      }
    }

    return false; // Catch-all if no valid command was triggered
  };

  const readAvailableCommands = () => {
    let helpText = "Voice commands: ";
    if (currentView === 'home') {
      helpText += "Say a subject name like Science, History, or English. You can also say Stop listening.";
    } else if (currentView === 'subject') {
      helpText += "Say Chapter 1, Chapter 2, or go back to return to subjects.";
    } else if (currentView === 'chapter') {
      helpText += "Say Read Chapter, Read Summary, Read Questions, Pause, Stop, Next Chapter, or Go Back.";
    }
    speakSystem(helpText);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        speakSystem("Microphone on. I am listening.");
      } catch (e) {
        console.error("Microphone already started.");
      }
    }
  };

  // --- NAVIGATION HANDLERS ---
  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject);
    setCurrentView('subject');
    speakSystem(`Opened ${subject.title}. Choose a chapter.`);
  };

  const handleChapterClick = (chapter) => {
    setSelectedChapter(chapter);
    setCurrentView('chapter');
    setCurrentlyPlayingType(null);
    speakSystem(`Opened ${chapter.title}. Say read chapter, or read summary to begin.`);
  };

  // --- DYNAMIC HELPERS ---
  const getDynamicHints = () => {
    if (currentView === 'home') return '"Science", "History", "English", "Help"';
    if (currentView === 'subject') return '"Chapter 1", "Chapter 2", "Go Back"';
    if (currentView === 'chapter') return '"Read Chapter", "Read Questions", "Next Chapter", "Go Back", "Stop"';
    return '';
  };

  // --- RENDERERS ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* HEADER */}
      <header className="bg-indigo-700 text-white p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => { setCurrentView('home'); setSelectedSubject(null); setSelectedChapter(null); }}
            className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-white rounded-lg p-1"
          >
            <Volume2 className="h-8 w-8 text-indigo-300" />
            <h1 className="text-2xl font-bold tracking-wide hidden sm:block">VoiceMate AI <span className="text-indigo-300 font-normal text-lg">NCERT</span></h1>
          </button>
          
          {/* Voice Command Toggle */}
          {speechSupported && (
            <button 
              onClick={toggleListening}
              className={`flex items-center space-x-3 px-6 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 ${
                isListening ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-500/30' : 'bg-white text-indigo-700 hover:bg-indigo-50'
              }`}
              aria-label={isListening ? "Stop Voice Commands" : "Start Voice Commands"}
            >
              {isListening ? (
                <>
                  <Mic className="h-6 w-6 animate-pulse" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <MicOff className="h-6 w-6" />
                  <span className="hidden sm:inline">Enable Voice</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* SYSTEM FEEDBACK / HELP BANNER */}
      <div className="bg-indigo-900 text-indigo-100 py-2 border-b-4 border-indigo-500 shadow-inner z-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-indigo-300 flex-shrink-0" />
            <span><strong>Try saying:</strong> {getDynamicHints()}</span>
          </div>
          {transcript && (
            <div className="mt-2 sm:mt-0 flex items-center space-x-2 bg-indigo-800 px-3 py-1 rounded-full border border-indigo-600">
              <span className="text-indigo-300 text-xs uppercase tracking-wider font-bold">Heard:</span>
              <span className="italic">"{transcript}"</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Feedback Toast */}
      {feedbackMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center space-x-2 animate-bounce">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="font-medium">{feedbackMessage}</span>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="max-w-5xl mx-auto p-4 py-8 flex-1 w-full">
        
        {/* VIEW 1: HOME (Subject List) */}
        {currentView === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold text-slate-800">What would you like to study?</h2>
              <p className="text-lg text-slate-500 mt-2">Tap a subject below or simply say its name.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ncertData.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => handleSubjectClick(subject)}
                  className="flex flex-col text-left bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border-2 border-slate-100 hover:border-indigo-500 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-300 group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-indigo-50 p-5 rounded-2xl group-hover:bg-indigo-100 transition-colors">
                      <BookOpen className="h-10 w-10 text-indigo-600" />
                    </div>
                    <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full">
                      {subject.chapters.length} Chapters
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">{subject.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{subject.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: SUBJECT (Chapter List) */}
        {currentView === 'subject' && selectedSubject && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <button 
              onClick={() => setCurrentView('home')}
              className="flex items-center space-x-2 text-indigo-600 font-bold hover:text-indigo-800 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 w-max"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Subjects</span>
            </button>
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8">
              <h2 className="text-4xl font-extrabold text-slate-800">
                {selectedSubject.title}
              </h2>
              <p className="text-lg text-slate-500 mt-2 font-medium">Select a chapter to begin listening.</p>
            </div>
            
            <div className="space-y-4">
              {selectedSubject.chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterClick(chapter)}
                  className="w-full flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border-2 border-slate-100 hover:border-indigo-400 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-300 group"
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-xl font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {index + 1}
                    </div>
                    <div className="text-left">
                      <h3 className="text-2xl font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{chapter.title.split(': ')[1] || chapter.title}</h3>
                      <p className="text-slate-500 font-medium mt-1 truncate max-w-md sm:max-w-xl">
                        {chapter.summary}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-slate-300 group-hover:text-indigo-600 transition-colors hidden sm:block" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: CHAPTER CONTENT & AUDIO PLAYER */}
        {currentView === 'chapter' && selectedChapter && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-300 pb-20">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setCurrentView('subject')}
                className="flex items-center space-x-2 text-indigo-600 font-bold hover:text-indigo-800 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Back to Chapters</span>
              </button>

              <span className="text-slate-500 font-bold tracking-widest uppercase text-sm">
                {selectedSubject.title}
              </span>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
              
              {/* Header Title */}
              <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">{selectedChapter.title}</h2>
                  {isPlaying && (
                    <div className="mt-4 inline-flex items-center space-x-2 bg-indigo-500/30 text-indigo-100 px-4 py-2 rounded-full backdrop-blur-sm border border-indigo-400/50">
                      <Volume2 className="h-5 w-5 animate-pulse" />
                      <span className="font-bold uppercase tracking-wider text-sm">Now Playing: {currentlyPlayingType}</span>
                    </div>
                  )}
                </div>
                {/* Decorative background circle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
              </div>

              {/* Master Audio Controls */}
              <div className="bg-indigo-50 border-b border-indigo-100 p-6 sm:p-8 flex flex-wrap justify-center gap-6">
                
                {/* Module selection buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-4 sm:mb-0 sm:mr-auto">
                  <button 
                    onClick={() => playAudio(selectedChapter.summary, 'summary')}
                    className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl font-bold transition-all border-2 ${
                      currentlyPlayingType === 'summary' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-200 hover:border-indigo-400'
                    }`}
                  >
                    <List className="h-5 w-5" />
                    <span>Summary</span>
                  </button>
                  <button 
                    onClick={() => playAudio(selectedChapter.content, 'content')}
                    className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl font-bold transition-all border-2 ${
                      currentlyPlayingType === 'content' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-200 hover:border-indigo-400'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span>Full Text</span>
                  </button>
                  <button 
                    onClick={() => {
                      const qsText = selectedChapter.qa.map((q, i) => `Question ${i+1}. ${q.q} Answer. ${q.a}`).join('. ');
                      playAudio(qsText, 'qa');
                    }}
                    className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl font-bold transition-all border-2 ${
                      currentlyPlayingType === 'qa' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-200 hover:border-indigo-400'
                    }`}
                  >
                    <HelpCircle className="h-5 w-5" />
                    <span>Q & A</span>
                  </button>
                </div>

                {/* Global Play/Pause/Stop */}
                <div className="flex items-center space-x-4 bg-white p-2 rounded-full shadow-sm border border-slate-200">
                  <button 
                    onClick={() => playAudio(selectedChapter.content, 'content')}
                    disabled={isPlaying && !isPaused}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-slate-200 disabled:text-slate-400 text-white p-4 rounded-full shadow-sm transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
                    aria-label="Play Chapter"
                  >
                    <Play className="h-6 w-6" fill="currentColor" />
                  </button>
                  
                  <button 
                    onClick={pauseAudio}
                    disabled={!isPlaying && !isPaused}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white p-4 rounded-full shadow-sm transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-300"
                    aria-label="Pause Chapter"
                  >
                    <Pause className="h-6 w-6" fill="currentColor" />
                  </button>
                  
                  <button 
                    onClick={stopAudio}
                    disabled={!isPlaying && !isPaused}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 text-white p-4 rounded-full shadow-sm transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
                    aria-label="Stop Chapter"
                  >
                    <Square className="h-6 w-6" fill="currentColor" />
                  </button>
                </div>
              </div>

              {/* Text Content Readout */}
              <div className="p-8 sm:p-12 space-y-12">
                
                {/* Summary Section */}
                <section>
                  <h3 className="text-2xl font-bold text-indigo-900 mb-4 flex items-center space-x-2 border-b-2 border-indigo-100 pb-2">
                    <List className="h-6 w-6 text-indigo-500" />
                    <span>Chapter Summary</span>
                  </h3>
                  <p className={`text-2xl leading-relaxed font-medium ${currentlyPlayingType === 'summary' ? 'text-indigo-900 bg-yellow-100 p-4 rounded-xl' : 'text-slate-700'}`}>
                    {selectedChapter.summary}
                  </p>
                </section>

                {/* Main Content Section */}
                <section>
                  <h3 className="text-2xl font-bold text-indigo-900 mb-4 flex items-center space-x-2 border-b-2 border-indigo-100 pb-2">
                    <FileText className="h-6 w-6 text-indigo-500" />
                    <span>Main Content</span>
                  </h3>
                  <p className={`text-2xl leading-relaxed font-medium ${currentlyPlayingType === 'content' ? 'text-indigo-900 bg-yellow-100 p-4 rounded-xl' : 'text-slate-700'}`}>
                    {selectedChapter.content}
                  </p>
                </section>

                {/* Q&A Section */}
                <section>
                  <h3 className="text-2xl font-bold text-indigo-900 mb-6 flex items-center space-x-2 border-b-2 border-indigo-100 pb-2">
                    <HelpCircle className="h-6 w-6 text-indigo-500" />
                    <span>Important Questions</span>
                  </h3>
                  <div className="space-y-6">
                    {selectedChapter.qa.map((item, idx) => (
                      <div key={idx} className={`p-6 rounded-2xl ${currentlyPlayingType === 'qa' ? 'bg-yellow-100 border border-yellow-300' : 'bg-slate-50 border border-slate-200'}`}>
                        <p className="text-2xl font-bold text-slate-800 mb-3"><span className="text-indigo-600 mr-2">Q{idx + 1}:</span>{item.q}</p>
                        <p className="text-2xl text-slate-700 font-medium leading-relaxed"><span className="text-green-600 font-bold mr-2">A:</span>{item.a}</p>
                      </div>
                    ))}
                  </div>
                </section>

              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}