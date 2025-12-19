"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { Gamepad, Send, User } from 'lucide-react';

export default function BejpoApp() {
  const [user, setUser] = useState(null);
  const [targetId, setTargetId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  // Load or Create Virtual ID
  useEffect(() => {
    const saved = localStorage.getItem('bejpo_session');
    if (saved) setUser(JSON.parse(saved));

    // Gamepad Listener: Press 'A' to send
    const interval = setInterval(() => {
      const gp = navigator.getGamepads()[0];
      if (gp && gp.buttons[0].pressed) document.getElementById('sendBtn')?.click();
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const signup = () => {
    const id = `9 (${Math.floor(100+Math.random()*900)}) ${Math.floor(1000+Math.random()*9000)}-${Math.floor(1000+Math.random()*9000)}`;
    const session = { id };
    localStorage.setItem('bejpo_session', JSON.stringify(session));
    setUser(session);
  };

  // Real-time Database Sync
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.receiver_id === user.id || payload.new.sender_id === user.id) {
          setMessages(prev => [...prev, payload.new]);
          scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const sendMessage = async () => {
    if (!input || !targetId) return;
    await supabase.from('messages').insert([{ 
      sender_id: user.id, 
      receiver_id: targetId.trim(), 
      text: input 
    }]);
    setInput("");
  };

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0a192f]">
      <h1 className="text-5xl font-bold text-blue-500 mb-8">bejpoChats</h1>
      <button onClick={signup} className="bg-blue-600 px-10 py-4 rounded-2xl font-bold hover:bg-blue-500 transition-all">
        Get Virtual Number
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto h-screen flex flex-col p-4 bg-[#0a192f]">
      <div className="p-4 bg-[#112240] rounded-2xl border border-blue-500/20 mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-blue-300 font-mono"><User size={20}/> {user.id}</div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[80%] ${m.sender_id === user.id ? 'bg-blue-600' : 'bg-slate-800'}`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="mt-4 p-4 bg-[#112240] rounded-3xl border border-blue-500/20">
        <input placeholder="Target 9 (XXX)..." className="w-full bg-transparent border-b border-blue-900 mb-3 outline-none text-blue-400 font-mono" value={targetId} onChange={(e)=>setTargetId(e.target.value)}/>
        <div className="flex gap-2">
          <input className="flex-1 bg-transparent outline-none" placeholder="Message..." value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && sendMessage()}/>
          <button id="sendBtn" onClick={sendMessage} className="bg-blue-500 p-3 rounded-xl"><Send size={20}/></button>
        </div>
      </div>
    </div>
  );
}
