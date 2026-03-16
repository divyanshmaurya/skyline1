import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Mic, MicOff, Send, X, Volume2, Loader2 } from "lucide-react";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { gemini, GeminiService } from "../services/gemini";
import { VOICE_FLOW_INSTRUCTION } from "../constants";
import { ChatStage, ChatSessionData, ChatMessage } from "../types";

function getApiKey(): string {
  return (
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    ""
  );
}

function getWeb3FormsKey(): string {
  return (
    (import.meta as any).env?.VITE_WEB3FORMS_KEY ||
    process.env.VITE_WEB3FORMS_KEY ||
    ""
  );
}

const WELCOME_MESSAGE =
  "Hi! I'm your real estate AI assistant. I can help you buy, rent, or sell. Are you looking to buy, rent, or sell today?";

const STAGES = Object.values(ChatStage);

function dealScore(data: ChatSessionData): number {
  let s = 0;
  if (data.intent) s += 2;
  if (data.location) s += 1;
  if (data.budget) s += 2;
  if (data.timeline) {
    s += /immediate|asap|now|soon|this month|this week|[123] month/i.test(data.timeline) ? 2 : 1;
  }
  if (data.phone) s += 1;
  if (data.email) s += 1;
  if (data.bestTime) s += 1;
  return Math.min(10, s);
}

function sendLeadEmail(data: ChatSessionData) {
  const key = getWeb3FormsKey();
  if (!key) return;

  const score = dealScore(data);
  const label = score >= 8 ? "HOT LEAD" : score >= 5 ? "WARM LEAD" : "COLD LEAD";
  const extra =
    data.intent === "Rent"
      ? `Bedrooms: ${data.bedrooms || "Not specified"}`
      : data.intent === "Buy"
      ? `Financing Status: ${data.financingStatus || "Not specified"}`
      : data.intent === "Sell"
      ? `Zip Code: ${data.zipCode || "Not specified"}`
      : "";

  const body = [
    "New Lead - Skyline Elite Realty",
    `Lead Score: ${score}/10 (${label})`,
    "",
    "Customer Details",
    `Name: ${data.name || "Not provided"}`,
    `Phone: ${data.phone || "Not provided"}`,
    `Email: ${data.email || "Not provided"}`,
    "",
    "Real Estate Intent",
    `Intent: ${data.intent || "Not specified"}`,
    `Location: ${data.location || "Not specified"}`,
    `Budget: ${data.budget || "Not specified"}`,
    `Timeline: ${data.timeline || "Not specified"}`,
    extra || null,
    `Listing Preference: ${data.listingPreference || "Not specified"}`,
    "",
    "Contact Preference",
    `Preferred Method: ${data.contactPreference || "Not specified"}`,
    `Best Time: ${data.bestTime || "Not specified"}`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: key,
      subject: `New Lead: ${data.name || "Unknown"} — ${data.intent || "?"} in ${data.location || "?"} (${score}/10)`,
      from_name: "Skyline Elite Realty Chatbot",
      message: body,
    }),
  }).catch(() => {});
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [stage, setStage] = useState<ChatStage>(ChatStage.WELCOME);
  const [sessionData, setSessionData] = useState<ChatSessionData>({});
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "model", text: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  // Voice refs
  const sessionRef = useRef<any>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const inTranscript = useRef("");
  const outTranscript = useRef("");

  // Auto-open on scroll to bottom
  useEffect(() => {
    const onScroll = () => {
      if (hasAutoOpened) return;
      const { scrollHeight, scrollTop } = document.documentElement;
      if (window.innerHeight + scrollTop >= scrollHeight - 100) {
        setIsOpen(true);
        setHasAutoOpened(true);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasAutoOpened]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading, isVoiceActive]);

  const addMessage = (msg: ChatMessage) =>
    setMessages((prev) => [...prev, msg]);

  // ── Text send ──────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || isLoading || sendingRef.current) return;
    sendingRef.current = true;
    const userText = input.trim();
    setInput("");
    addMessage({ role: "user", text: userText });
    setIsLoading(true);

    try {
      const history: { role: "user" | "model"; text: string }[] = [
        { role: "user", text: "Hello" },
        ...messages,
      ];
      const res = await gemini.processMessage(userText, stage, sessionData, history);
      const merged = { ...sessionData, ...res.extractedData };
      if (res.extractedData) setSessionData(merged);
      addMessage({ role: "model", text: res.message });
      if (res.nextStage) setStage(res.nextStage);

      // Fire email when phone is first captured
      if (res.extractedData?.phone && !sessionData.phone) sendLeadEmail(merged);
      // Fire again when bestTime is first captured (phone already known)
      if (res.extractedData?.bestTime && !sessionData.bestTime && merged.phone)
        sendLeadEmail(merged);
    } catch {
      addMessage({
        role: "model",
        text: "I'm sorry, I encountered an error. Please try again.",
      });
    } finally {
      setIsLoading(false);
      sendingRef.current = false;
    }
  };

  // ── Voice ──────────────────────────────────────────────────────────────────
  const stopVoice = () => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    try { inputCtxRef.current?.close(); } catch {}
    inputCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try { sessionRef.current?.close(); } catch {}
    sessionRef.current = null;
    sourcesRef.current.forEach((s) => { try { s.stop(); } catch {} });
    sourcesRef.current.clear();
    nextStartRef.current = 0;
    setIsVoiceActive(false);
    setIsLoading(false);
  };

  const startVoice = async () => {
    if (isVoiceActive) { stopVoice(); return; }
    try {
      setIsLoading(true);
      const apiKey = getApiKey();
      if (!apiKey) throw new Error("No API key");

      const ai = new GoogleGenAI({ apiKey });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      inputCtxRef.current = inputCtx;
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      outputCtxRef.current = outputCtx;
      inTranscript.current = "";
      outTranscript.current = "";

      const tools = {
        functionDeclarations: [
          {
            name: "updateLeadInfo",
            description: "Update lead data and conversation stage.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                extractedData: {
                  type: Type.OBJECT,
                  properties: {
                    intent: { type: Type.STRING },
                    location: { type: Type.STRING },
                    budget: { type: Type.STRING },
                    timeline: { type: Type.STRING },
                    bedrooms: { type: Type.STRING },
                    financingStatus: { type: Type.STRING },
                    zipCode: { type: Type.STRING },
                    listingPreference: { type: Type.STRING },
                    name: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    email: { type: Type.STRING },
                    contactPreference: { type: Type.STRING },
                    bestTime: { type: Type.STRING },
                  },
                },
                nextStage: { type: Type.STRING },
              },
            },
          },
        ],
      };

      sessionRef.current = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
            setIsLoading(false);
            const src = inputCtx.createMediaStreamSource(stream);
            const proc = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = proc;
            proc.onaudioprocess = (e) => {
              if (!sessionRef.current) return;
              const raw = e.inputBuffer.getChannelData(0);
              const pcm = new Int16Array(raw.length);
              for (let i = 0; i < raw.length; i++) pcm[i] = raw[i] * 32768;
              try {
                sessionRef.current.sendRealtimeInput({
                  media: {
                    data: GeminiService.encodeBase64(new Uint8Array(pcm.buffer)),
                    mimeType: "audio/pcm;rate=16000",
                  },
                });
              } catch {}
            };
            src.connect(proc);
            proc.connect(inputCtx.destination);
          },
          onmessage: async (msg: any) => {
            // Tool call handling
            if (msg.toolCall) {
              for (const call of msg.toolCall.functionCalls) {
                if (call.name === "updateLeadInfo") {
                  const args = call.args as any;
                  if (args.extractedData) {
                    setSessionData((prev) => {
                      const merged = { ...prev, ...args.extractedData };
                      if (args.extractedData.bestTime && !prev.bestTime)
                        sendLeadEmail(merged);
                      return merged;
                    });
                  }
                  if (args.nextStage) setStage(args.nextStage as ChatStage);
                  try {
                    sessionRef.current?.sendToolResponse({
                      functionResponses: [
                        { name: "updateLeadInfo", id: call.id, response: { result: "success" } },
                      ],
                    });
                  } catch {}
                }
              }
            }

            // Transcriptions
            if (msg.serverContent?.inputTranscription)
              inTranscript.current += msg.serverContent.inputTranscription.text;
            if (msg.serverContent?.outputTranscription)
              outTranscript.current += msg.serverContent.outputTranscription.text;

            // Flush transcripts on turn complete
            if (msg.serverContent?.turnComplete) {
              const u = inTranscript.current.trim();
              const m = outTranscript.current.trim();
              if (u || m) {
                setMessages((prev) => {
                  const next = [...prev];
                  if (u) next.push({ role: "user", text: u });
                  if (m) next.push({ role: "model", text: m });
                  return next;
                });
              }
              inTranscript.current = "";
              outTranscript.current = "";
            }

            // Audio playback
            const b64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (b64 && outputCtxRef.current) {
              const ctx = outputCtxRef.current;
              nextStartRef.current = Math.max(nextStartRef.current, ctx.currentTime);
              const buf = await GeminiService.decodeAudioData(
                GeminiService.decodeBase64(b64),
                ctx,
                24000,
                1
              );
              const src = ctx.createBufferSource();
              src.buffer = buf;
              src.connect(ctx.destination);
              src.start(nextStartRef.current);
              nextStartRef.current += buf.duration;
              sourcesRef.current.add(src);
              src.onended = () => sourcesRef.current.delete(src);
            }

            // Interruption handling
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach((s) => { try { s.stop(); } catch {} });
              sourcesRef.current.clear();
              nextStartRef.current = 0;
            }
          },
          onerror: () => stopVoice(),
          onclose: () => stopVoice(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction:
            VOICE_FLOW_INSTRUCTION +
            `\n\nCURRENT SESSION STATE:\nStage: ${stage}\nData: ${JSON.stringify(sessionData)}`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [tools],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
        },
      });
    } catch {
      stopVoice();
    }
  };

  const stageIndex = STAGES.indexOf(stage);
  const progressPct =
    stage === ChatStage.POST_COMPLETE
      ? 100
      : ((stageIndex + 1) / (STAGES.length - 1)) * 100;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="bg-white w-[380px] h-[550px] mb-4 rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8">
          {/* Header */}
          <div className="p-5 bg-slate-950 text-white flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-tight">Skyline Concierge</h4>
                <div className="flex items-center space-x-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isVoiceActive ? "bg-blue-400 animate-pulse" : "bg-blue-500"
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                    {isVoiceActive ? "Listening..." : "Active Now"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { stopVoice(); setIsOpen(false); }}
              className="hover:bg-white/10 p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="bg-slate-900 px-5 py-2 flex items-center space-x-2 border-t border-white/5">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
              Stage {stageIndex + 1}/{STAGES.length - 1}
            </span>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10 rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none font-medium"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && !isVoiceActive && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                </div>
              </div>
            )}
            {isVoiceActive && (
              <div className="flex flex-col items-center py-4 space-y-3 bg-blue-50/50 rounded-2xl border border-blue-100 border-dashed">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white animate-pulse">
                  <Volume2 className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em]">
                  Voice Concierge Active
                </p>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <button
                onClick={startVoice}
                className={`p-3 rounded-2xl transition-all shadow-lg active:scale-90 flex-shrink-0 ${
                  isVoiceActive
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {isVoiceActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <div className="flex-1 flex items-center bg-slate-100 px-3 py-2 rounded-2xl border border-transparent focus-within:border-blue-500/50 focus-within:bg-white transition-all shadow-inner">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
                  placeholder={isVoiceActive ? "Tell me your preferences..." : "Ask our advisor..."}
                  className="flex-1 bg-transparent text-sm px-2 focus:outline-none text-slate-900 font-semibold placeholder:text-slate-400"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => {
          if (isOpen && isVoiceActive) stopVoice();
          setIsOpen((o) => !o);
        }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group ${
          isOpen ? "bg-slate-950 text-white" : "bg-blue-600 text-white"
        }`}
      >
        {isOpen ? <X /> : <MessageSquare className="group-hover:animate-bounce" />}
        {!isOpen && (
          <span className="absolute right-16 bg-white border border-slate-200 text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
            Elite Concierge
          </span>
        )}
      </button>
    </div>
  );
};

export default Chatbot;
