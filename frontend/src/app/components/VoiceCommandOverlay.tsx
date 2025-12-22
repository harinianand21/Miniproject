import { useState, useEffect, useRef } from 'react';
import { Mic, X } from 'lucide-react';

interface VoiceCommandOverlayProps {
  onClose: () => void;
  onStartNavigation: () => void;
  onAddData: () => void;
  onStopNavigation: () => void;
}

// Declare global for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceCommandOverlay({
  onClose,
  onStartNavigation,
  onAddData,
  onStopNavigation
}: VoiceCommandOverlayProps) {
  const [isListening, setIsListening] = useState(true);
  const [caption, setCaption] = useState('');
  const [displayText, setDisplayText] = useState('Listening...');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setDisplayText('Speech recognition not supported');
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setDisplayText('Listening...');
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');

      setCaption(transcript);

      if (event.results[0].isFinal) {
        const lowerText = transcript.toLowerCase();
        processCommand(lowerText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setDisplayText(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const processCommand = (text: string) => {
    let triggered = false;

    if (text.includes('start')) {
      onStartNavigation();
      triggered = true;
    } else if (text.includes('add') || text.includes('report')) {
      onAddData();
      triggered = true;
    } else if (text.includes('stop')) {
      onStopNavigation();
      triggered = true;
    }

    if (triggered) {
      setDisplayText('Command recognized!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setDisplayText('No command recognized');
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center">
      {/* Dark Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-md">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-6 w-10 h-10 bg-white/10 border border-white/30 text-white rounded-full flex items-center justify-center hover:bg-white/20"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Microphone Icon */}
        <div className="relative mb-8">
          {/* Pulsing rings */}
          {isListening && (
            <>
              <div className="absolute inset-0 -m-4 bg-blue-500 rounded-full animate-ping opacity-20" />
              <div className="absolute inset-0 -m-8 bg-blue-500 rounded-full animate-ping opacity-10" style={{ animationDelay: '0.5s' }} />
            </>
          )}

          {/* Microphone Button */}
          <div className={`
            relative w-32 h-32 rounded-full flex items-center justify-center
            ${isListening ? 'bg-blue-600' : 'bg-green-600'}
            shadow-2xl border-4 border-white/30
          `}>
            <Mic className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Status Text */}
        <p className="text-white text-xl mb-6">
          {displayText}
        </p>

        {/* Live Caption */}
        <div className="w-full bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-6 min-h-[100px] flex items-center justify-center">
          {caption ? (
            <p className="text-white text-center text-lg">
              "{caption}"
            </p>
          ) : (
            <p className="text-white/60 text-center">
              Say "start navigation", "add report", or "stop"
            </p>
          )}
        </div>

        {/* Accessibility Note */}
        <div className="mt-6 text-white/70 text-sm text-center">
          <p>Live captions enabled for accessibility</p>
        </div>
      </div>
    </div>
  );
}
