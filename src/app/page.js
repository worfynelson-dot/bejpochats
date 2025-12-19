"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Gamepad, Send, User, Globe } from 'lucide-react';

export default function BejpoApp() {
  const [user, setUser] = useState(null);
  const [targetId, setTargetId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState('en');

  const t = {
    en: { start: "Generate Virtual ID", placeholder: "Friend's 9 (XXX) ID...", send: "Send" },
    id: { start: "Buat ID Virtual", placeholder: "ID 9 (XXX) Teman...", send: "Kirim" },
    zh: { start: "生成虚拟ID", placeholder: "朋友的 9 (XXX) ID...", send: "发送" },
    ja: { start: "仮想IDを生成", placeholder: "友達の 9 (XXX) ID...", send: "送信" }
  };

  // PERSISTENCE: Check if user exists on this device
  useEffect(() => {
    const saved = localStorage.getItem('bejpo_session');
    if (saved) setUser(JSON.parse(saved));

    // GAMEPAD LISTENER
    const checkGamepad = () => {
      const gp = navigator.getGamepads()[0];
      if (gp && gp.buttons[0].pressed) { // A Button
        document.getElementById('sendBtn')?.click();
      }
    };
    const interval = setInterval(checkGamepad, 100);
    return () => clearInterval(interval);
  }, []);

  const signup = () => {
    const num = `9 (${Math.floor(100+Math.random()*900)}) ${Math.floor(1000+Math.random()*9000)}-${Math.floor(1000+Math.random()*9000)}`;
    const session = { id: num };
    localStorage.setItem('bejpo_session', JSON.stringify(session));
    setUser(session);
  };

  // REALTIME MESSAGING
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.receiver_id === user.id || payload.new.sender_id === user.id) {
          setMessages(prev => [...prev, payload.new]);
        }
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const handleSend = async () => {
    if (!input || !targetId) return;
    await supabase.from('messages').insert([{ sender_id: user.id, receiver_id: targetId, text: input }]);
    setInput("");
  };

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0a192f]">
      <h1 className="text-4xl font-bold text-blue-400 mb-6">bejpoChats</h1>
      <button onClick={signup} className="bg-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-500 transition-all">
        {t[lang].start}
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto h-screen flex flex-col p-4">
      <div className="flex justify-between items-center p-4 glass rounded-2xl mb-4">
        <div className="flex items-center gap-2"><User className="text-blue-400"/> <span className="font-mono">{user.id}</span></div>
        <select onChange={(e)=>setLang(e.target.value)} className="bg-transparent text-sm outline-none">
          <option value="en">EN</option> <option value="id">ID</option> <option value="zh">ZH</option> <option value="ja">JA</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 p-2 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-2xl max-w-[70%] ${m.sender_id === user.id ? 'bg-blue-600' : 'bg-gray-700'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 glass rounded-3xl">
        <input placeholder={t[lang].placeholder} className="w-full bg-transparent border-b border-blue-900 mb-2 outline-none text-blue-300" value={targetId} onChange={(e)=>setTargetId(e.target.value)}/>
        <div className="flex gap-2">
          <input className="flex-1 bg-transparent outline-none" placeholder="Message..." value={input} onChange={(e)=>setInput(e.target.value)}/>
          <button id="sendBtn" onClick={handleSend} className="bg-blue-500 p-2 rounded-xl"><Send size={18}/></button>
        </div>
      </div>
      <p className="text-[10px] text-center mt-2 opacity-50"><Gamepad size={10} className="inline mr-1"/> GAMEPAD ACTIVE</p>
    </div>
  );
}
