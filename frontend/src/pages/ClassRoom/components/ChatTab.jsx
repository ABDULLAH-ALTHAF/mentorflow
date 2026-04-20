import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

const ChatTab = ({ messages, user, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isBottom = scrollHeight - scrollTop <= clientHeight + 100;
      setShowScrollButton(!isBottom);
    }
  };

  // Only scroll to bottom when NEW messages arrive AND user was already at bottom
  useEffect(() => {
    const checkAndScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
        if (isAtBottom) {
          scrollToBottom();
        }
      }
    };
    checkAndScroll();
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage('');
    // Always scroll to bottom after sending a message
    setTimeout(scrollToBottom, 100);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages Container - This is the ONLY thing that scrolls */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950"
      >
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 py-20">
            <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col max-w-[70%] ${msg.senderId?._id === user._id ? 'ml-auto' : 'mr-auto'}`}
              >
                <div className={`rounded-2xl p-3 ${msg.senderId?._id === user._id 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 text-slate-200'}`}>
                  <span className="text-xs opacity-80 block mb-1">
                    {msg.senderId?.name || 'Unknown'} • {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </span>
                  <span>{msg.message}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 bg-indigo-600 hover:bg-indigo-700 rounded-full p-3 shadow-lg transition z-10"
          title="Scroll to bottom"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}

      {/* Message Input - Fixed at bottom */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-slate-800 rounded-2xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSend}
          className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-2xl flex items-center justify-center transition"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatTab;