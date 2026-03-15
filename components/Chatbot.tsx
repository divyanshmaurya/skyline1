
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { claude } from '../services/claude';
import { ChatStage, ChatSessionData, ChatMessage } from '../types';
import emailjs from '@emailjs/browser';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<ChatStage>(ChatStage.WELCOME);
  const [sessionData, setSessionData] = useState<ChatSessionData>({});
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I\'m your real estate AI assistant. I can help you buy, rent, or sell... Are you looking to buy, rent, or sell today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

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
  }, [messages, isLoading]);

  const computeDealProbability = (data: ChatSessionData): number => {
    let score = 0;
    if (data.intent) score += 2;
    if (data.location) score += 1;
    if (data.budget) score += 2;
    if (data.timeline) {
      const urgent = /\b(immediate|asap|now|soon|this month|this week|1 month|2 month|3 month|quickly)\b/i.test(data.timeline);
      score += urgent ? 2 : 1;
    }
    if (data.phone) score += 1;
    if (data.email) score += 1;
    if (data.bestTime) score += 1;
    return Math.min(10, score);
  };

  const triggerAgentNotification = (data: ChatSessionData) => {
    const serviceId = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID;
    const templateId = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.warn('EmailJS is not configured. Skipping email notification.');
      return;
    }

    const probability = computeDealProbability(data);

    emailjs.send(serviceId, templateId, {
      to_email: 'subnest.ai@gmail.com',
      lead_name: data.name || 'Not provided',
      lead_email: data.email || 'Not provided',
      lead_phone: data.phone || 'Not provided',
      intent: data.intent || 'Not specified',
      budget: data.budget || 'Not specified',
      location: data.location || 'Not specified',
      timeline: data.timeline || 'Not specified',
      contact_preference: data.contactPreference || 'Not specified',
      best_time: data.bestTime || 'Not specified',
      deal_probability: `${probability}/10`,
    }, publicKey).then(
      () => console.log('Lead notification email sent successfully.'),
      (err) => console.error('Failed to send lead notification email:', err)
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || isSendingRef.current) return;
    isSendingRef.current = true;
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const historyForApi = messages.slice(1);
      const response = await claude.processMessage(userText, stage, sessionData, historyForApi);

      const mergedData = { ...sessionData, ...response.extractedData };

      if (response.extractedData) {
        setSessionData(mergedData);
      }

      setMessages(prev => [...prev, { role: 'model', text: response.message }]);

      if (response.extractedData?.bestTime && !sessionData.bestTime) {
        triggerAgentNotification(mergedData);
      }

      if (response.nextStage) {
        setStage(response.nextStage);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  const stageIndex = Object.values(ChatStage).indexOf(stage);
  const totalStages = Object.values(ChatStage).length;

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
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Active Now</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-slate-900 px-5 py-2 flex items-center space-x-2 border-t border-white/5">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${(stageIndex + 1) / totalStages * 100}%` }}
              />
            </div>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
              Stage {stageIndex + 1}/{totalStages}
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
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="flex-1 flex items-center bg-slate-100 px-3 py-2 rounded-2xl border border-transparent focus-within:border-blue-500/50 focus-within:bg-white transition-all shadow-inner">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
                  placeholder="Ask our advisor..."
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
        onClick={() => setIsOpen(!isOpen)}
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
