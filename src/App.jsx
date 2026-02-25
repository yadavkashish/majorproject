import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Mic, MicOff, BookOpen, ChevronLeft, Volume2, Info } from 'lucide-react';

// --- MOCK DATA (You will replace this with your database later) ---
const ncertData = [
  {
    id: 's1',
    title: 'Science (Class 10)',
    description: 'Explore the natural world, physics, chemistry, and biology.',
    chapters: [
      { 
        id: 'c1', 
        title: 'Chapter 1: Chemical Reactions', 
        content: 'Chemical reactions involve the breaking and making of bonds between atoms to produce new substances. When a chemical change occurs, we can say that a chemical reaction has taken place. For example, burning of magnesium ribbon in air to form magnesium oxide.' 
      },
      { 
        id: 'c2', 
        title: 'Chapter 2: Acids, Bases and Salts', 
        content: 'Acids are sour in taste and change the colour of blue litmus to red. Bases are bitter in taste and change the colour of red litmus to blue. Salts are produced when an acid reacts with a base.' 
      }
    ]
  },
  {
    id: 's2',
    title: 'History (Class 10)',
    description: 'Discover the events that shaped our modern world.',
    chapters: [
      { 
        id: 'c3', 
        title: 'Chapter 1: The Rise of Nationalism in Europe', 
        content: 'In 1848, Frédéric Sorrieu, a French artist, prepared a series of four prints visualising his dream of a world made up of democratic and social Republics. The first print of the series shows the peoples of Europe and America marching in a long train.' 
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
  
  // Voice Command State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);

  // --- INITIALIZATION & CLEANUP ---
  useEffect(() => {
    // Check for Speech Recognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Indian English for NCERT context

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const recognizedText = event.results[current][0].transcript.toLowerCase().trim();
        setTranscript(recognizedText);
        handleVoiceCommand(recognizedText);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    // Cleanup audio when component unmounts
    return () => {
      synthesisRef.current.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentView, selectedSubject, selectedChapter]); // Re-bind commands when view changes

  // Stop audio if user navigates away from chapter
  useEffect(() => {
    if (currentView !== 'chapter') {
      stopAudio();
    }
  }, [currentView]);

  // --- TEXT TO SPEECH (TTS) FUNCTIONS ---
  const playAudio = (text) => {
    if (isPaused) {
      synthesisRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    synthesisRef.current.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Optional: Try to find a clear English/Indian voice
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-IN')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 0.9; // Slightly slower for better comprehension
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

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
  };

  // --- VOICE COMMAND ROUTER ---
  const handleVoiceCommand = (command) => {
    console.log("Command received:", command);
    
    if (command.includes('go back') || command.includes('home')) {
      if (currentView === 'chapter') {
        setCurrentView('subject');
        setSelectedChapter(null);
        speakSystem("Going back to chapters.");
      } else if (currentView === 'subject') {
        setCurrentView('home');
        setSelectedSubject(null);
        speakSystem("Going to home screen.");
      }
    } else if (command.includes('read') || command.includes('play')) {
      if (currentView === 'chapter' && selectedChapter) {
        playAudio(selectedChapter.content);
      }
    } else if (command.includes('stop') || command.includes('pause')) {
      stopAudio();
    } else if (command.includes('science')) {
      handleSubjectClick(ncertData[0]);
    } else if (command.includes('history')) {
      handleSubjectClick(ncertData[1]);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        speakSystem("Listening for commands.");
      } catch (e) {
        console.error("Microphone already started.");
      }
    }
  };

  const speakSystem = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    synthesisRef.current.speak(utterance);
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
    speakSystem(`Opened ${chapter.title}. Click play or say read to begin listening.`);
  };

  // --- RENDERERS ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* HEADER */}
      <header className="bg-indigo-700 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Volume2 className="h-8 w-8" />
            <h1 className="text-2xl font-bold tracking-wide">NCERT Audio Learner</h1>
          </div>
          
          {/* Voice Command Toggle */}
          {speechSupported && (
            <button 
              onClick={toggleListening}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold transition-colors ${
                isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
              aria-label={isListening ? "Stop Voice Commands" : "Start Voice Commands"}
            >
              {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice Commands'}</span>
            </button>
          )}
        </div>
      </header>

      {/* SYSTEM FEEDBACK / HELP BANNER */}
      {speechSupported && (
        <div className="bg-indigo-100 text-indigo-800 px-4 py-3 text-sm flex items-center justify-center space-x-2">
          <Info className="h-4 w-4" />
          <span>
            <strong>Voice Commands:</strong> Try saying "Science", "Go back", "Read", or "Stop". 
            <em> (Last heard: "{transcript}")</em>
          </span>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="max-w-4xl mx-auto p-4 py-8">
        
        {/* VIEW 1: HOME (Subject List) */}
        {currentView === 'home' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-slate-800 border-b-2 border-indigo-200 pb-2">Select a Subject</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ncertData.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => handleSubjectClick(subject)}
                  className="flex flex-col text-left bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg border-2 border-transparent hover:border-indigo-400 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-300"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-indigo-100 p-4 rounded-full">
                      <BookOpen className="h-8 w-8 text-indigo-700" />
                    </div>
                    <h3 className="text-2xl font-bold">{subject.title}</h3>
                  </div>
                  <p className="text-lg text-slate-600">{subject.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: SUBJECT (Chapter List) */}
        {currentView === 'subject' && selectedSubject && (
          <div className="space-y-6">
            <button 
              onClick={() => setCurrentView('home')}
              className="flex items-center space-x-2 text-indigo-700 font-bold hover:underline mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg p-1"
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="text-xl">Back to Subjects</span>
            </button>
            
            <h2 className="text-3xl font-extrabold text-slate-800 border-b-2 border-indigo-200 pb-2">
              {selectedSubject.title} Chapters
            </h2>
            
            <div className="space-y-4">
              {selectedSubject.chapters.map(chapter => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterClick(chapter)}
                  className="w-full text-left bg-white p-6 rounded-xl shadow-sm hover:shadow-md border-2 border-slate-100 hover:border-indigo-300 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-300"
                >
                  <h3 className="text-2xl font-bold text-slate-800">{chapter.title}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: CHAPTER CONTENT & AUDIO PLAYER */}
        {currentView === 'chapter' && selectedChapter && (
          <div className="space-y-6">
            <button 
              onClick={() => setCurrentView('subject')}
              className="flex items-center space-x-2 text-indigo-700 font-bold hover:underline mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg p-1"
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="text-xl">Back to Chapters</span>
            </button>

            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Audio Controls Bar */}
              <div className="bg-indigo-50 border-b border-indigo-100 p-6 flex flex-wrap justify-center sm:justify-between items-center gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-indigo-900">{selectedChapter.title}</h2>
                  <p className="text-indigo-600 font-medium mt-1">Audio Module</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => playAudio(selectedChapter.content)}
                    className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
                    aria-label="Play Chapter"
                  >
                    <Play className="h-8 w-8" fill="currentColor" />
                  </button>
                  
                  <button 
                    onClick={pauseAudio}
                    disabled={!isPlaying && !isPaused}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-4 rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-300"
                    aria-label="Pause Chapter"
                  >
                    <Pause className="h-8 w-8" fill="currentColor" />
                  </button>
                  
                  <button 
                    onClick={stopAudio}
                    disabled={!isPlaying && !isPaused}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-4 rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
                    aria-label="Stop Chapter"
                  >
                    <Square className="h-8 w-8" fill="currentColor" />
                  </button>
                </div>
              </div>

              {/* Text Content (Large and readable for low-vision) */}
              <div className="p-8">
                <p className="text-2xl leading-relaxed text-slate-800">
                  {selectedChapter.content}
                </p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}