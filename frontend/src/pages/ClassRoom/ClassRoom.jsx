import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { MessageCircle, BookOpen, Users, FileText, ArrowLeft, Send } from 'lucide-react';

const ClassRoom = () => {
  const { classId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [homework, setHomework] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Join socket room when component mounts
  useEffect(() => {
    if (socket && classId) {
      socket.emit('join_class', { classId, userId: user._id });
    }
  }, [socket, classId, user]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, hwRes, msgRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/classes/my`), // simplify or add get single class if needed
          axios.get(`http://localhost:5000/api/homework/${classId}`),
          axios.get(`http://localhost:5000/api/messages/${classId}`)
        ]);

        setHomework(hwRes.data);
        setMessages(msgRes.data);
        
        // Find current class info
        const currentClass = classRes.data.find(c => c._id === classId);
        setClassInfo(currentClass);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', {
      classId,
      senderId: user._id,
      message: newMessage.trim()
    });

    setNewMessage('');
  };

  const submitHomework = async (hwId, file, text) => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (text) formData.append('text', text);

    try {
      await axios.post(`http://localhost:5000/api/homework/${hwId}/submit`, formData);
      alert('Homework submitted successfully!');
    } catch (err) {
      alert('Submission failed');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading classroom...</div>;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-800 rounded-xl">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="font-semibold text-xl">{classInfo?.className}</h1>
          <p className="text-sm text-slate-400">Invite Code: {classInfo?.inviteCode}</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900">
        {['chat', 'homework', 'people', 'notes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-sm font-medium capitalize transition ${activeTab === tab 
              ? 'text-indigo-400 border-b-2 border-indigo-500' 
              : 'text-slate-400 hover:text-slate-200'}`}
          >
            {tab === 'chat' && <MessageCircle className="inline w-4 h-4 mr-1" />}
            {tab === 'homework' && <BookOpen className="inline w-4 h-4 mr-1" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden classroom-container">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-bubble flex flex-col ${msg.senderId._id === user._id ? 'chat-bubble-sent ml-auto' : 'chat-bubble-received'}`}
                >
                  <span className="text-xs opacity-70 mb-1">
                    {msg.senderId.name} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>{msg.message}</span>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-slate-800 rounded-3xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={sendMessage}
                className="bg-indigo-600 hover:bg-indigo-700 w-14 h-14 rounded-3xl flex items-center justify-center transition"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'homework' && (
          <div className="p-6 space-y-6 overflow-y-auto">
            {user?.role === 'teacher' && (
              <div className="bg-slate-900 p-6 rounded-3xl">
                <h3 className="font-semibold mb-4">Post New Homework</h3>
                {/* Simple form - can be expanded later */}
                <p className="text-slate-400 text-sm">Homework creation form coming in post-MVP</p>
              </div>
            )}

            <div className="space-y-4">
              {homework.length === 0 ? (
                <p className="text-slate-400 text-center py-10">No homework posted yet</p>
              ) : (
                homework.map(hw => (
                  <div key={hw._id} className="bg-slate-900 rounded-3xl p-6">
                    <h4 className="font-semibold text-lg">{hw.title}</h4>
                    <p className="text-slate-400 mt-2">{hw.description}</p>
                    {hw.voiceNote && (
                      <audio controls className="mt-4 w-full">
                        <source src={`http://localhost:5000${hw.voiceNote}`} type="audio/mpeg" />
                      </audio>
                    )}
                    <p className="text-xs text-slate-500 mt-4">
                      Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'No due date'}
                    </p>

                    {user?.role === 'student' && (
                      <div className="mt-6">
                        <input
                          type="file"
                          id={`file-${hw._id}`}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) submitHomework(hw._id, file, '');
                          }}
                        />
                        <label
                          htmlFor={`file-${hw._id}`}
                          className="block text-center py-3 bg-indigo-600 hover:bg-indigo-700 rounded-2xl cursor-pointer transition"
                        >
                          Submit Homework (File)
                        </label>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div className="p-6 text-center text-slate-400">
            People tab (Teacher + Students list) - Simple view in MVP
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="p-6 text-center text-slate-400">
            Notes / Study Materials - Coming soon
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassRoom;