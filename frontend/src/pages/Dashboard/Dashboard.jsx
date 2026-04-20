import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Users, LogOut, BookOpen } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [className, setClassName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/classes/my');
      setClasses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createClass = async () => {
    try {
      await axios.post('http://localhost:5000/api/classes', { className });
      setShowCreateModal(false);
      setClassName('');
      fetchClasses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create class');
    }
  };

  const joinClass = async () => {
    try {
      await axios.post('http://localhost:5000/api/classes/join', { inviteCode });
      setShowJoinModal(false);
      setInviteCode('');
      fetchClasses();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invite code');
    }
  };

  const openClass = (classId) => {
    navigate(`/class/${classId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold">MentorFlow</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Hi, {user?.name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-800 rounded-2xl transition"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-semibold">My Classes</h2>
          
          <div className="flex gap-3">
            {user?.role === 'teacher' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-2xl font-medium transition"
              >
                <Plus className="w-5 h-5" /> Create Class
              </button>
            )}
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-2xl font-medium transition"
            >
              <Users className="w-5 h-5" /> Join Class
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            No classes yet. {user?.role === 'teacher' ? 'Create one!' : 'Join one using invite code!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls._id}
                onClick={() => openClass(cls._id)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-3xl p-6 cursor-pointer transition transform hover:scale-[1.02]"
              >
                <h3 className="text-xl font-semibold mb-2">{cls.className}</h3>
                <p className="text-sm text-slate-400 mb-4">
                  {user?.role === 'teacher' 
                    ? `${cls.students?.length || 0} students` 
                    : `Teacher: ${cls.teacherId?.name}`}
                </p>
                <div className="text-xs bg-slate-800 inline-block px-3 py-1 rounded-full">
                  Code: <span className="font-mono font-medium">{cls.inviteCode}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-8 rounded-3xl w-full max-w-md">
            <h3 className="text-2xl font-semibold mb-6">Create New Class</h3>
            <input
              type="text"
              placeholder="Class Name (e.g. Physics Grade 10)"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-800 rounded-2xl mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-4 bg-slate-800 rounded-2xl"
              >
                Cancel
              </button>
              <button
                onClick={createClass}
                disabled={!className.trim()}
                className="flex-1 py-4 bg-indigo-600 rounded-2xl font-semibold disabled:opacity-50"
              >
                Create Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-8 rounded-3xl w-full max-w-md">
            <h3 className="text-2xl font-semibold mb-6">Join Class</h3>
            <input
              type="text"
              placeholder="Enter Invite Code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-5 py-4 bg-slate-800 rounded-2xl mb-6 font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={6}
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-4 bg-slate-800 rounded-2xl"
              >
                Cancel
              </button>
              <button
                onClick={joinClass}
                disabled={!inviteCode.trim()}
                className="flex-1 py-4 bg-indigo-600 rounded-2xl font-semibold disabled:opacity-50"
              >
                Join
              </button>
            </div>
            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;