import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSpeechRecognition, parseVoiceEntry, type ParsedVoiceEntry } from "@/utils/voice";

/**
 * Microphone button that turns a spoken sentence into a parsed entry.
 * Renders nothing when the browser has no speech recognition support.
 */
export function VoiceCapture({
  onParsed,
  className,
}: {
  onParsed: (entry: ParsedVoiceEntry) => void;
  className?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<ReturnType<typeof getSpeechRecognition>>(null);

  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
    return () => recognitionRef.current?.abort();
  }, []);

  function start() {
    const recognition = getSpeechRecognition();
    if (!recognition) return;

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (!transcript) return;
      onParsed(parseVoiceEntry(transcript));
      toast.success(`Heard: "${transcript}"`);
    };
    recognition.onerror = (event) => {
      setListening(false);
      toast.error(
        event.error === "not-allowed"
          ? "Microphone access is needed for voice entry."
          : "Couldn't catch that — please try again.",
      );
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stop() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant={listening ? "destructive" : "soft"}
      onClick={listening ? stop : start}
      className={cn("gap-2", className)}
      aria-label={listening ? "Stop voice entry" : "Start voice entry"}
    >
      {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      {listening ? "Listening…" : "Speak it"}
    </Button>
  );
}
