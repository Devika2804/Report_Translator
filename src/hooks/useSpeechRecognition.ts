import { useCallback, useEffect, useRef, useState } from "react";

type SR = any;

interface Options {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export const useSpeechRecognition = ({ lang = "en-US", continuous = false, interimResults = true }: Options = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SR | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const start = useCallback(() => {
    setError(null);
    setTranscript("");
    if (!isSupported) {
      setError("Voice input requires Chrome or Edge browser");
      return;
    }
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition: SR = new Ctor();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(text);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setIsListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access denied. Please allow mic permission in browser settings.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else {
        setError("Could not access microphone. Please try again.");
      }
    };
    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error(e);
      setError("Could not start microphone.");
      setIsListening(false);
    }
  }, [continuous, interimResults, isSupported, lang]);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { isListening, transcript, error, isSupported, start, stop, reset, setTranscript };
};
