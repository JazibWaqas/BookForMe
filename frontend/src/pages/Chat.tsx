import React, { useMemo, useRef, useState } from 'react';
import Header from '../components/Header';
import '../styles/Chat.css';

type AssistantMode = 'ask' | 'agent';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  time?: string;
}

const Chat: React.FC = () => {
  const [mode, setMode] = useState<AssistantMode>('ask');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'assistant',
      content:
        "Hi! I'm your BookForMe AI assistant. I can help you find venues, make bookings, answer questions, and even act as your personal booking agent. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const listEndRef = useRef<HTMLDivElement | null>(null);

  const quickActions = useMemo(
    () => [
      'Find sports courts near me',
      'Recommend venues for badminton',
      'What\'s available this evening?',
      'Show me discounted venues',
    ],
    []
  );

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { id: String(Math.random()), role: 'user', content: text.trim(), time: now };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    // Mock assistant reply for now
    const reply: ChatMessage = {
      id: String(Math.random()),
      role: 'assistant',
      content: mode === 'ask'
        ? 'Got it! I will search venues and options for you.'
        : 'Agent mode enabled. I will reach out to vendors and confirm availability for you.',
      time: now,
    };
    setTimeout(() => setMessages((prev) => [...prev, reply]), 400);
    setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 450);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const onQuickAction = (action: string) => {
    sendMessage(action);
  };

  return (
    <>
      <Header />
      <div className="gpt-page">
        <div className="gpt-column">
          {/* Top toggle bar like GPT model switch */}
          <div className="gpt-topbar">
            <div className="mode-toggle" role="tablist" aria-label="assistant-mode">
              <button
                className={`mode-btn ${mode === 'ask' ? 'active' : ''}`}
                onClick={() => setMode('ask')}
                role="tab"
                aria-selected={mode === 'ask'}
                title="Ask Mode"
              >
                Ask
              </button>
              <button
                className={`mode-btn ${mode === 'agent' ? 'active' : ''}`}
                onClick={() => setMode('agent')}
                role="tab"
                aria-selected={mode === 'agent'}
                title="Agent Mode"
              >
                Agent
              </button>
            </div>
          </div>

          {/* suggestion chips under top bar */}
          <div className="prompt-chips">
            {quickActions.map((q, i) => (
              <button key={i} className="chip" onClick={() => onQuickAction(q)}>{q}</button>
            ))}
          </div>

          {/* Messages center column */}
          <div className="gpt-messages">
            {messages.map((m) => (
              <div key={m.id} className={`gpt-message ${m.role}`}>
                <div className="avatar">{m.role === 'assistant' ? '🤖' : '🧑'}</div>
                <div className="bubble">
                  <div className="content">{m.content}</div>
                  {m.time && <div className="time">{m.time}</div>}
                </div>
              </div>
            ))}
            <div ref={listEndRef} />
          </div>

          {/* Sticky input at bottom */}
          <form className="gpt-input" onSubmit={handleSubmit}>
            <textarea
              rows={1}
              placeholder={mode === 'ask' ? 'Ask about venues, availability, prices…' : 'Describe what you need; the agent will handle it…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button type="submit" className="send-btn" aria-label="Send">➤</button>
          </form>
          <div className="disclaimer">BookForMe can make mistakes. Verify important info.</div>
        </div>
      </div>
    </>
  );
};

export default Chat;
