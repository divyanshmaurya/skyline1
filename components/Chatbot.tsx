
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Mic, Send, X, Volume2, Loader2, MicOff } from 'lucide-react';
import { gemini, GeminiService } from '../services/gemini';
import { SYSTEM_INSTRUCTION, CHATBOT_FLOW_INSTRUCTION, VOICE_FLOW_INSTRUCTION } from '../constants';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { ChatStage, ChatSessionData, ChatMessage } from '../types';
import emailjs from '@emailjs/browser';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<ChatStage>(ChatStage.WELCOME);
  const [sessionData, setSessionData] = useState<ChatSessionData>({});
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I’m your real estate AI assistant. I can help you buy, rent, or sell... Are you looking to buy, rent, or sell today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [phoneRefusalCount, setPhoneRefusalCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  useEffect(() => {
    const handleScroll = () => {
      if (hasAutoOpened) return;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (windowHeight + scrollTop >= documentHeight - 100) {
        setIsOpen(true);
        setHasAutoOpened(true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasAutoOpened]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isVoiceActive]);

  const triggerAgentNotification = (data: ChatSessionData) => {
    console.log('AGENT NOTIFICATION PAYLOAD:', data);

    const serviceId = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID;
    const templateId = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.warn('EmailJS is not configured. Skipping email notification.');
      return;
    }

    emailjs.send(serviceId, templateId, {
      to_email: 'divyansh.ku@gmail.com',
      lead_name: data.name || 'Not provided',
      lead_email: data.email || 'Not provided',
      lead_phone: data.phone || 'Not provided',
      intent: data.intent || 'Not specified',
      budget: data.budget || 'Not specified',
      location: data.location || 'Not specified',
      timeline: data.timeline || 'Not specified',
      contact_preference: data.contactPreference || 'Not specified',
      best_time: data.bestTime || 'Not specified',
    }, publicKey).then(
      () => console.log('Lead notification email sent successfully.'),
      (err) => console.error('Failed to send lead notification email:', err)
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const response = await gemini.processMessage(userText, stage, sessionData, messages);
      
      // Update session data with extracted info
      if (response.extractedData) {
        setSessionData(prev => ({ ...prev, ...response.extractedData }));
      }

      // Hard Recovery Logic for Phone
      if (stage === ChatStage.LEAD_CAPTURE_CONTACT && !response.extractedData?.phone && !sessionData.phone) {
        setPhoneRefusalCount(prev => prev + 1);
        if (phoneRefusalCount >= 0) { // On first refusal or unclear response
           // The AI should handle this via SYSTEM_INSTRUCTION, but we can reinforce it
        }
      }

      setMessages(prev => [...prev, { role: 'model', text: response.message }]);
      
      if (response.nextStage) {
        setStage(response.nextStage);
        if (response.nextStage === ChatStage.COMPLETE) {
          triggerAgentNotification({ ...sessionData, ...response.extractedData });
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceSession = async () => {
    if (isVoiceActive) {
      stopVoiceSession();
      return;
    }
    try {
      setIsLoading(true);
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || ((import.meta as any).env?.VITE_GEMINI_API_KEY as string);
      if (!apiKey) throw new Error("API Key missing");
      
      const ai = new GoogleGenAI({ apiKey });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      currentInputTranscription.current = '';
      currentOutputTranscription.current = '';

      const updateLeadInfoTool = {
        functionDeclarations: [
          {
            name: 'updateLeadInfo',
            description: 'Update the lead information and conversation stage based on extracted data.',
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
                  }
                },
                nextStage: { type: Type.STRING, description: 'The next stage to move the conversation to.' }
              }
            }
          }
        ]
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
            setIsLoading(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = {
                data: GeminiService.encodeBase64(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => { if (session) session.sendRealtimeInput({ media: pcmBlob }); });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg) => {
            // Handle Tool Calls
            if (msg.toolCall) {
              for (const call of msg.toolCall.functionCalls) {
                if (call.name === 'updateLeadInfo') {
                  const args = call.args as any;
                  if (args.extractedData) {
                    setSessionData(prev => ({ ...prev, ...args.extractedData }));
                  }
                  if (args.nextStage) {
                    setStage(args.nextStage as ChatStage);
                    if (args.nextStage === ChatStage.COMPLETE) {
                      triggerAgentNotification({ ...sessionData, ...args.extractedData });
                    }
                  }
                  // Send response back to model
                  sessionPromise.then(session => {
                    if (session) {
                      session.sendToolResponse({
                        functionResponses: [{
                          name: 'updateLeadInfo',
                          id: call.id,
                          response: { result: 'success' }
                        }]
                      });
                    }
                  });
                }
              }
            }

            if (msg.serverContent?.inputTranscription) currentInputTranscription.current += msg.serverContent.inputTranscription.text;
            if (msg.serverContent?.outputTranscription) currentOutputTranscription.current += msg.serverContent.outputTranscription.text;
            if (msg.serverContent?.turnComplete) {
              const uText = currentInputTranscription.current;
              const mText = currentOutputTranscription.current;
              if (uText || mText) {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  if (uText) newMsgs.push({ role: 'user', text: uText });
                  if (mText) newMsgs.push({ role: 'model', text: mText });
                  return newMsgs;
                });
              }
              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
            }
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const audioCtx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
              const buffer = await GeminiService.decodeAudioData(GeminiService.decodeBase64(base64Audio), audioCtx, 24000, 1);
              const source = audioCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(audioCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => { stopVoiceSession(); },
          onclose: () => { setIsVoiceActive(false); },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: VOICE_FLOW_INSTRUCTION + `\n\nCURRENT SESSION STATE:\nStage: ${stage}\nData: ${JSON.stringify(sessionData)}`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [updateLeadInfoTool],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setIsVoiceActive(false);
      setIsLoading(false);
    }
  };

  const stopVoiceSession = () => {
    if (sessionRef.current) { try { sessionRef.current.close(); } catch (e) {} sessionRef.current = null; }
    sourcesRef.current.forEach(source => { try { source.stop(); } catch (e) {} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsVoiceActive(false);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="bg-white w-[380px] h-[550px] mb-4 rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8">
          <div className="p-5 bg-slate-950 text-white flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-tight">Skyline Concierge</h4>
                <div className="flex items-center space-x-1">
                  <span className={`w-2 h-2 rounded-full ${isVoiceActive ? 'bg-blue-400 animate-pulse' : 'bg-blue-500'}`}></span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                    {isVoiceActive ? 'Listening...' : 'Active Now'}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => { stopVoiceSession(); setIsOpen(false); }} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-slate-900 px-5 py-2 flex items-center space-x-2 border-t border-white/5">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                style={{ 
                  width: `${(Object.values(ChatStage).indexOf(stage) + 1) / Object.values(ChatStage).length * 100}%` 
                }}
              />
            </div>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
              Stage {Object.values(ChatStage).indexOf(stage) + 1}/8
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10 rounded-br-none' 
                    : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none font-medium'
                }`}>
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
              <div className="flex flex-col items-center justify-center py-4 space-y-3 bg-blue-50/50 rounded-2xl border border-blue-100 border-dashed">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white animate-pulse">
                  <Volume2 className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em]">Voice Concierge Active</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100 space-y-3">
            <div className="flex items-center space-x-2">
              <button 
                onClick={startVoiceSession}
                className={`p-3 rounded-2xl transition-all shadow-lg active:scale-90 flex-shrink-0 ${
                  isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {isVoiceActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <div className="flex-1 flex items-center bg-slate-100 px-3 py-2 rounded-2xl border border-transparent focus-within:border-blue-500/50 focus-within:bg-white transition-all shadow-inner">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
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

      <button 
        onClick={() => { if (isOpen && isVoiceActive) stopVoiceSession(); setIsOpen(!isOpen); }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group ${
          isOpen ? 'bg-slate-950 text-white' : 'bg-blue-600 text-white'
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
