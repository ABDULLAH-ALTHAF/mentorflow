import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { 
  MessageCircle, BookOpen, Users, FileText, ArrowLeft, Send, 
  Plus, X, Upload, Calendar, Download, File, Image, Trash2, CheckCircle
} from 'lucide-react';

const ClassRoom = () => {
  const { classId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [homework, setHomework] = useState([]);
  const [notes, setNotes] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showHomeworkForm, setShowHomeworkForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newHomework, setNewHomework] = useState({
    title: '',
    description: '',
    dueDate: '',
    voiceNote: null
  });
  const [newNote, setNewNote] = useState({
    title: '',
    description: '',
    file: null,
    type: 'material'
  });
  const [submitting, setSubmitting] = useState(false);

  // Auto-scroll states
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive (only if user is at bottom)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Check if user is at bottom of chat
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isBottom = scrollHeight - scrollTop <= clientHeight + 50; // 50px threshold
      setIsUserAtBottom(isBottom);
      setShowScrollButton(scrollTop < scrollHeight - clientHeight - 100);
    }
  };

  // Scroll to bottom when messages change, but only if user was at bottom
  useEffect(() => {
    if (isUserAtBottom) {
      scrollToBottom();
    }
  }, [messages, isUserAtBottom]);

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

  const createHomework = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData();
    formData.append('classId', classId);
    formData.append('title', newHomework.title);
    formData.append('description', newHomework.description);
    if (newHomework.dueDate) formData.append('dueDate', newHomework.dueDate);
    if (newHomework.voiceNote) formData.append('voiceNote', newHomework.voiceNote);

    try {
      const response = await axios.post('http://localhost:5000/api/homework', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setHomework([response.data, ...homework]);
      setShowHomeworkForm(false);
      setNewHomework({ title: '', description: '', dueDate: '', voiceNote: null });
      alert('Homework posted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to post homework: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const createNote = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData();
    formData.append('classId', classId);
    formData.append('title', newNote.title);
    formData.append('description', newNote.description);
    formData.append('type', newNote.type);
    if (newNote.file) formData.append('file', newNote.file);

    try {
      const response = await axios.post('http://localhost:5000/api/notes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNotes([response.data, ...notes]);
      setShowNoteForm(false);
      setNewNote({ title: '', description: '', file: null, type: 'material' });
      alert('Material posted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to post material: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const submitHomework = async (hwId, file) => {
    if (!file) {
      alert('Please select a file to upload');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`http://localhost:5000/api/homework/${hwId}/submit`, formData);
      alert('Homework submitted successfully!');
      // Refresh homework list
      const updatedHw = await axios.get(`http://localhost:5000/api/homework/${classId}`);
      setHomework(updatedHw.data);
    } catch (err) {
      alert('Submission failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const deleteHomework = async (hwId) => {
    if (!confirm('Are you sure you want to delete this homework?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/homework/${hwId}`);
      setHomework(homework.filter(hw => hw._id !== hwId));
      alert('Homework deleted successfully!');
    } catch (err) {
      alert('Failed to delete homework');
    }
  };

  const deleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/notes/${noteId}`);
      setNotes(notes.filter(note => note._id !== noteId));
      alert('Material deleted successfully!');
    } catch (err) {
      alert('Failed to delete material');
    }
  };

  const downloadFile = async (fileUrl, fileName) => {
    try {
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : `http://localhost:5000${fileUrl}`;
      
      const response = await axios.get(fullUrl, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download file');
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <File className="w-5 h-5" />;
    if (fileType.includes('image')) return <Image className="w-5 h-5" />;
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const isHomeworkSubmitted = (homeworkId) => {
    const hw = homework.find(h => h._id === homeworkId);
    if (!hw || !hw.submissions) return false;
    return hw.submissions.some(sub => sub.studentId?._id === user._id);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading classroom...</div>;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-800 rounded-xl transition">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-xl">{classInfo?.className}</h1>
          <p className="text-sm text-slate-400">Invite Code: {classInfo?.inviteCode}</p>
        </div>
        <div className="text-sm text-slate-400">
          {user?.role === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student'}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900 overflow-x-auto">
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

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full relative">
            <div 
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950"
            >
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 py-20">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
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
                onClick={() => {
                  scrollToBottom();
                  setIsUserAtBottom(true);
                }}
                className="absolute bottom-20 right-6 bg-indigo-600 hover:bg-indigo-700 rounded-full p-3 shadow-lg transition z-10"
                title="Scroll to bottom"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            )}

            {/* Message Input */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-slate-800 rounded-2xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={sendMessage}
                className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-2xl flex items-center justify-center transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Homework Tab */}
        {activeTab === 'homework' && (
          <div className="p-6 space-y-6 overflow-y-auto h-full">
            {/* Create Homework Button (Teacher Only) */}
            {user?.role === 'teacher' && (
              <div className="mb-6">
                {!showHomeworkForm ? (
                  <button
                    onClick={() => setShowHomeworkForm(true)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 py-4 rounded-2xl font-semibold transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Post New Homework
                  </button>
                ) : (
                  <div className="bg-slate-900 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-lg">Create New Homework</h3>
                      <button onClick={() => setShowHomeworkForm(false)} className="p-1 hover:bg-slate-800 rounded">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <form onSubmit={createHomework} className="space-y-4">
                      <input
                        type="text"
                        placeholder="Homework Title"
                        value={newHomework.title}
                        onChange={(e) => setNewHomework({...newHomework, title: e.target.value})}
                        className="w-full bg-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                      <textarea
                        placeholder="Description"
                        value={newHomework.description}
                        onChange={(e) => setNewHomework({...newHomework, description: e.target.value})}
                        className="w-full bg-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows="4"
                        required
                      />
                      <input
                        type="datetime-local"
                        value={newHomework.dueDate}
                        onChange={(e) => setNewHomework({...newHomework, dueDate: e.target.value})}
                        className="w-full bg-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Voice Note (Optional)</label>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setNewHomework({...newHomework, voiceNote: e.target.files[0]})}
                          className="w-full bg-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                      >
                        {submitting ? 'Posting...' : 'Post Homework'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Homework List */}
            <div className="space-y-4">
              {homework.length === 0 ? (
                <div className="text-center text-slate-400 py-20">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No homework posted yet</p>
                </div>
              ) : (
                homework.map(hw => (
                  <div key={hw._id} className="bg-slate-900 rounded-2xl p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{hw.title}</h4>
                        <p className="text-slate-400 mt-2">{hw.description}</p>
                        {hw.voiceNote && (
                          <audio controls className="mt-4 w-full max-w-md">
                            <source src={`http://localhost:5000${hw.voiceNote}`} type="audio/mpeg" />
                          </audio>
                        )}
                        <div className="flex items-center gap-4 mt-4 text-sm">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-4 h-4" />
                            Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'No due date'}
                          </span>
                          {hw.submissions && (
                            <span className="text-indigo-400">
                              {hw.submissions.length} submission(s)
                            </span>
                          )}
                        </div>
                      </div>
                      {user?.role === 'teacher' && (
                        <button
                          onClick={() => deleteHomework(hw._id)}
                          className="p-2 hover:bg-slate-800 rounded-xl text-red-400"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Student Submission Section */}
                    {user?.role === 'student' && (
                      <div className="mt-6 pt-4 border-t border-slate-800">
                        {isHomeworkSubmitted(hw._id) ? (
                          <div className="flex items-center justify-center gap-2 py-3 bg-emerald-600/20 text-emerald-400 rounded-xl">
                            <CheckCircle className="w-5 h-5" />
                            <span>Submitted</span>
                          </div>
                        ) : (
                          <>
                            <input
                              type="file"
                              id={`file-${hw._id}`}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) submitHomework(hw._id, file);
                              }}
                            />
                            <label
                              htmlFor={`file-${hw._id}`}
                              className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer transition"
                            >
                              <Upload className="w-5 h-5" />
                              Submit Homework
                            </label>
                          </>
                        )}
                      </div>
                    )}

                    {/* Teacher View Submissions */}
                    {user?.role === 'teacher' && hw.submissions?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <p className="text-sm font-semibold mb-2">Submissions:</p>
                        <div className="space-y-2">
                          {hw.submissions.map((sub, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-800 p-3 rounded-xl">
                              <span className="text-sm">{sub.studentId?.name || 'Student'}</span>
                              {sub.file && (
                                <button
                                  onClick={() => downloadFile(sub.file, `submission_${hw.title}`)}
                                  className="text-indigo-400 hover:text-indigo-300"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Notes/Materials Tab */}
        {activeTab === 'notes' && (
          <div className="p-6 space-y-6 overflow-y-auto h-full">
            {/* Create Note Button (Teacher Only) */}
            {user?.role === 'teacher' && (
              <div className="mb-6">
                {!showNoteForm ? (
                  <button
                    onClick={() => setShowNoteForm(true)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 py-4 rounded-2xl font-semibold transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Upload Study Material
                  </button>
                ) : (
                  <div className="bg-slate-900 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-lg">Upload New Material</h3>
                      <button onClick={() => setShowNoteForm(false)} className="p-1 hover:bg-slate-800 rounded">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <form onSubmit={createNote} className="space-y-4">
                      <input
                        type="text"
                        placeholder="Title"
                        value={newNote.title}
                        onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                        className="w-full bg-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                      <textarea
                        placeholder="Description (Optional)"
                        value={newNote.description}
                        onChange={(e) => setNewNote({...newNote, description: e.target.value})}
                        className="w-full bg-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows="3"
                      />
                      <select
                        value={newNote.type}
                        onChange={(e) => setNewNote({...newNote, type: e.target.value})}
                        className="w-full bg-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="material">Study Material</option>
                        <option value="assignment">Assignment</option>
                        <option value="resource">External Resource</option>
                      </select>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">File (PDF, Image, Document)</label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => setNewNote({...newNote, file: e.target.files[0]})}
                          className="w-full bg-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                      >
                        {submitting ? 'Uploading...' : 'Upload Material'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Notes List */}
            <div className="grid gap-4 md:grid-cols-2">
              {notes.length === 0 ? (
                <div className="col-span-2 text-center text-slate-400 py-20">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No study materials uploaded yet</p>
                </div>
              ) : (
                notes.map(note => (
                  <div key={note._id} className="bg-slate-900 rounded-2xl p-6 hover:bg-slate-800 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getFileIcon(note.fileType)}
                          <h4 className="font-semibold text-lg">{note.title}</h4>
                        </div>
                        {note.description && (
                          <p className="text-slate-400 text-sm mt-1">{note.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs px-2 py-1 bg-slate-700 rounded-full capitalize">
                            {note.type}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {note.file && (
                          <button
                            onClick={() => downloadFile(note.file, note.title)}
                            className="p-2 hover:bg-slate-700 rounded-xl text-indigo-400"
                            title="Download"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        )}
                        {user?.role === 'teacher' && (
                          <button
                            onClick={() => deleteNote(note._id)}
                            className="p-2 hover:bg-slate-700 rounded-xl text-red-400"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* People Tab */}
        {activeTab === 'people' && (
          <div className="p-6 space-y-8 overflow-y-auto h-full">
            {/* Teachers Section */}
            <div className="bg-slate-900 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-lg">Teachers</h3>
                <span className="text-sm text-slate-400">({teachers.length})</span>
              </div>
              <div className="space-y-3">
                {teachers.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">No teachers assigned</p>
                ) : (
                  teachers.map(teacher => (
                    <div key={teacher._id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-semibold">
                        {teacher.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{teacher.name}</p>
                        <p className="text-xs text-slate-400">{teacher.email}</p>
                      </div>
                      <div className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full">
                        Teacher
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Students Section */}
            <div className="bg-slate-900 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-lg">Students</h3>
                <span className="text-sm text-slate-400">({students.length})</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {students.length === 0 ? (
                  <p className="text-slate-400 text-center py-4 col-span-2">No students enrolled yet</p>
                ) : (
                  students.map(student => (
                    <div key={student._id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
                      <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center font-semibold">
                        {student.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-slate-400">{student.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Class Info Card */}
            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-2xl p-6 border border-indigo-500/30">
              <h3 className="font-semibold mb-2">Class Information</h3>
              <p className="text-sm text-slate-300">Class Code: <span className="font-mono text-indigo-400">{classInfo?.inviteCode}</span></p>
              <p className="text-sm text-slate-400 mt-2">Share this code with students to join the class</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassRoom;