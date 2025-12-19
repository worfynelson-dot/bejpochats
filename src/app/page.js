"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { Gamepad, Send, User, Globe, MessageSquare } from 'lucide-react';

export default function BejpoApp() {
  const [user, setUser] = useState(null);
  const [targetId, setTargetId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState('en');
  const chatEndRef = useRef(null);

  const t = {
    en: { start: "Get My Number", placeholder: "Target 9 (XXX)...", send: "Send" },
    id: { start: "Dapatkan Nomor", placeholder: "Tujuan 9 (XXX)...", send: "Kirim" },
    zh: { start: "获取我的号码", placeholder: "目标号码...", send: "发送" },
    ja: { start: "番号を取得", placeholder: "相手の番号...", send: "送信" }
  };

  // 1. GENERATE VIRTUAL NUMBER & PERSIST
  useEffect(() => {
    const saved = localStorage.getItem('bejpo_session');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const generateAccount = () => {
    const area = Math.floor(100 + Math.random() * 900);
    const num = `9 (${area}) ${Math.floor(1000+Math.random()*9000)}-${Math.floor(1000+Math.random()*9000)}`;
    const session = { id: num };
    localStorage.setItem('bejpo_session', JSON.stringify(session));
    setUser(session);
  };

  // 2. REAL-TIME DATABASE SYNC
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
      (payload) => {
        if (payload.new.receiver_id === user.id || payload.new.sender_id === user.id) {
          setMessages(prev => [...prev, payload.new]);
        }
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  // 3. GAMEPAD SUPPORT
  useEffect(() => {
    const scanGamepad = () => {
      const gp = navigator.getGamepads()[0];
      if (gp && gp.buttons[0].pressed) handleSend(); // A Button to Send
    };
    const interval = setInterval(scanGamepad, 100);
    return () => clearInterval(interval);
  }, [input, targetId]);

  const handleSend = async () => {
    if (!input || !targetId) return;
    await supabase.from('messages').insert([{ 
      sender_id: user.id, 
      receiver_id: targetId, 
      text: input 
    }]);
    setInput("");
  };

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-900 to-black">
      <h1 className="text-5xl font-black text-blue-400 mb-8 tracking-tighter">bejpoChats</h1>
      <button onClick={generateAccount} className="bg-blue-500 hover:bg-blue-400 p-4 rounded-2xl font-bold transition-all px-10 shadow-xl shadow-blue-500/20">
        {t[lang].start}
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-blue-800/20 p-4 rounded-2xl border border-blue-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg"><User size={20}/></div>
          <p className="font-mono text-blue-300">{user.id}</p>
        </div>
        <select onChange={(e)=>setLang(e.target.value)} className="bg-transparent border-none outline-none text-sm text-blue-400">
          <option value="en">English</option>
          <option value="id">Indonesia</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
        </select>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${m.sender_id === user.id ? 'bg-blue-600 rounded-tr-none' : 'bg-slate-700 rounded-tl-none'}`}>
              <p className="text-sm">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-[#112240] p-4 rounded-3xl border border-blue-500/30">
        <input 
          placeholder={t[lang].placeholder} 
          className="w-full bg-transparent mb-2 outline-none border-b border-blue-900 pb-2 text-blue-300"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
        />
        <div className="flex gap-2">
          <input 
            className="flex-1 bg-transparent outline-none" 
            placeholder="Type message..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} className="bg-blue-500 p-2 rounded-xl hover:bg-blue-400 transition-colors">
            <Send size={18} />
          </button>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-widest">
        <Gamepad size={12}/> Gamepad Ready (Button A to Send)
      </div>
    </div>
  );
}
