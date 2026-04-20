import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { NotificationProvider } from '../../context/NotificationContext';
import axios from 'axios';
import { MessageCircle, BookOpen, Users, FileText, ArrowLeft } from 'lucide-react';
import ChatTab from './components/ChatTab';
import HomeworkTab from './components/HomeworkTab';
import NotesTab from './components/NotesTab';
import PeopleTab from './components/PeopleTab';
import NotificationBell from '../../components/NotificationBell';

const ClassRoomContent = () => {
  const { classId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [homework, setHomework] = useState([]);
  const [notes, setNotes] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
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
        const [classRes, hwRes, msgRes, notesRes, usersRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/classes/my`),
          axios.get(`http://localhost:5000/api/homework/${classId}`),
          axios.get(`http://localhost:5000/api/messages/${classId}`),
          axios.get(`http://localhost:5000/api/notes/${classId}`).catch(() => ({ data: [] })),
          axios.get(`http://localhost:5000/api/classes/${classId}/users`).catch(() => ({ data: { students: [], teachers: [] } }))
        ]);

        setHomework(hwRes.data);
        setMessages(msgRes.data);
        setNotes(notesRes.data || []);
        
        if (usersRes.data) {
          setStudents(usersRes.data.students || []);
          setTeachers(usersRes.data.teachers || []);
        }
        
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

  const sendMessage = (message) => {
    if (!message.trim() || !socket) return;

    socket.emit('send_message', {
      classId,
      senderId: user._id,
      message: message.trim()
    });
  };

  const refreshHomework = async () => {
    const updatedHw = await axios.get(`http://localhost:5000/api/homework/${classId}`);
    setHomework(updatedHw.data);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading classroom...</div>;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header - Fixed at top */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-800 rounded-xl transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-semibold text-xl">{classInfo?.className}</h1>
            <p className="text-sm text-slate-400">Invite Code: {classInfo?.inviteCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <div className="text-sm text-slate-400">
            {user?.role === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student'}
          </div>
        </div>
      </header>

      {/* Tabs - Fixed below header */}
      <div className="flex border-b border-slate-800 bg-slate-900 overflow-x-auto sticky top-[73px] z-10">
        {['chat', 'homework', 'notes', 'people'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-sm font-medium capitalize transition whitespace-nowrap ${activeTab === tab 
              ? 'text-indigo-400 border-b-2 border-indigo-500' 
              : 'text-slate-400 hover:text-slate-200'}`}
          >
            {tab === 'chat' && <MessageCircle className="inline w-4 h-4 mr-2" />}
            {tab === 'homework' && <BookOpen className="inline w-4 h-4 mr-2" />}
            {tab === 'notes' && <FileText className="inline w-4 h-4 mr-2" />}
            {tab === 'people' && <Users className="inline w-4 h-4 mr-2" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Area - Takes remaining height and handles scrolling */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'chat' && (
          <ChatTab 
            messages={messages}
            user={user}
            onSendMessage={sendMessage}
          />
        )}
        {activeTab === 'homework' && (
          <HomeworkTab 
            homework={homework}
            user={user}
            classId={classId}
            onHomeworkUpdate={refreshHomework}
          />
        )}
        {activeTab === 'notes' && (
          <NotesTab 
            notes={notes}
            user={user}
            classId={classId}
            onNotesUpdate={setNotes}
          />
        )}
        {activeTab === 'people' && (
          <PeopleTab 
            teachers={teachers}
            students={students}
            classInfo={classInfo}
            user={user}
          />
        )}
      </div>
    </div>
  );
};

const ClassRoom = () => (
  <NotificationProvider>
    <ClassRoomContent />
  </NotificationProvider>
);

export default ClassRoom;