import { useState } from 'react';
import axios from 'axios';
import { 
  BookOpen, Plus, X, Calendar, Upload, Download, Trash2, 
  CheckCircle, Clock, AlertCircle, MessageCircle, Mic, 
  Star, Send, FileText 
} from 'lucide-react';

const HomeworkTab = ({ homework, user, classId, onHomeworkUpdate }) => {
  const [showHomeworkForm, setShowHomeworkForm] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    grade: '',
    feedback: '',
    feedbackVoice: null
  });
  const [submissions, setSubmissions] = useState({});
  const [loadingSubmissions, setLoadingSubmissions] = useState({});
  const [newHomework, setNewHomework] = useState({
    title: '',
    description: '',
    dueDate: '',
    voiceNote: null
  });

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
      await axios.post('http://localhost:5000/api/homework', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await onHomeworkUpdate();
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
      await onHomeworkUpdate();
    } catch (err) {
      alert('Submission failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const deleteHomework = async (hwId) => {
    if (!confirm('Are you sure you want to delete this homework?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/homework/${hwId}`);
      await onHomeworkUpdate();
      alert('Homework deleted successfully!');
    } catch (err) {
      alert('Failed to delete homework');
    }
  };

  const downloadFile = async (fileUrl, fileName) => {
    try {
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:5000${fileUrl}`;
      const response = await axios.get(fullUrl, { responseType: 'blob' });
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

  const fetchSubmissions = async (homeworkId) => {
    setLoadingSubmissions(prev => ({ ...prev, [homeworkId]: true }));
    try {
      const response = await axios.get(`http://localhost:5000/api/homework/${homeworkId}/submissions`);
      setSubmissions(prev => ({ ...prev, [homeworkId]: response.data }));
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoadingSubmissions(prev => ({ ...prev, [homeworkId]: false }));
    }
  };

  const submitFeedback = async () => {
    if (!selectedSubmission) return;
    
    const formData = new FormData();
    if (feedbackData.grade) formData.append('grade', feedbackData.grade);
    if (feedbackData.feedback) formData.append('feedback', feedbackData.feedback);
    if (feedbackData.feedbackVoice) formData.append('feedbackVoice', feedbackData.feedbackVoice);
    
    try {
      await axios.post(`http://localhost:5000/api/homework/${selectedSubmission._id}/feedback`, formData);
      alert('Feedback submitted successfully!');
      setShowFeedbackModal(false);
      setSelectedSubmission(null);
      setFeedbackData({ grade: '', feedback: '', feedbackVoice: null });
      await onHomeworkUpdate();
    } catch (err) {
      alert('Failed to submit feedback: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusBadge = (submission) => {
    if (!submission) {
      return (
        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-700 rounded-full text-yellow-400">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    
    switch (submission.status) {
      case 'submitted':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
            <Clock className="w-3 h-3" />
            Submitted
          </span>
        );
      case 'graded':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Graded: {submission.grade}%
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-700 rounded-full text-slate-400">
            <AlertCircle className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  const getStudentSubmission = (homeworkId) => {
    const hw = homework.find(h => h._id === homeworkId);
    if (!hw || !hw.submissions) return null;
    return hw.submissions.find(sub => sub.studentId?._id === user._id);
  };

  return (
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
          homework.map(hw => {
            const studentSubmission = getStudentSubmission(hw._id);
            
            return (
              <div key={hw._id} className="bg-slate-900 rounded-2xl p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">{hw.title}</h4>
                      {user?.role === 'student' && getStatusBadge(studentSubmission)}
                    </div>
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
                    
                    {/* Show feedback if graded */}
                    {user?.role === 'student' && studentSubmission?.status === 'graded' && (
                      <div className="mt-4 p-4 bg-slate-800 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="font-semibold">Grade: {studentSubmission.grade}%</span>
                        </div>
                        {studentSubmission.feedback && (
                          <div className="mt-2">
                            <p className="text-sm text-slate-400">Feedback:</p>
                            <p className="text-sm mt-1">{studentSubmission.feedback}</p>
                          </div>
                        )}
                        {studentSubmission.feedbackVoice && (
                          <audio controls className="mt-3 w-full">
                            <source src={`http://localhost:5000${studentSubmission.feedbackVoice}`} type="audio/mpeg" />
                          </audio>
                        )}
                      </div>
                    )}
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
                    {studentSubmission?.status === 'submitted' ? (
                      <div className="flex items-center justify-center gap-2 py-3 bg-yellow-600/20 text-yellow-400 rounded-xl">
                        <Clock className="w-5 h-5" />
                        <span>Submitted - Waiting for grading</span>
                      </div>
                    ) : studentSubmission?.status === 'graded' ? (
                      <div className="flex items-center justify-center gap-2 py-3 bg-emerald-600/20 text-emerald-400 rounded-xl">
                        <CheckCircle className="w-5 h-5" />
                        <span>Graded - Check feedback above</span>
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
                {user?.role === 'teacher' && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => fetchSubmissions(hw._id)}
                      className="text-sm text-indigo-400 hover:text-indigo-300 mb-3 flex items-center gap-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      View Submissions ({hw.submissions?.length || 0})
                    </button>
                    
                    {loadingSubmissions[hw._id] && (
                      <div className="text-center py-4">Loading submissions...</div>
                    )}
                    
                    {submissions[hw._id] && submissions[hw._id].length > 0 && (
                      <div className="space-y-3">
                        {submissions[hw._id].map((sub) => (
                          <div key={sub._id} className="bg-slate-800 p-4 rounded-xl">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{sub.studentId?.name}</p>
                                <p className="text-xs text-slate-400">
                                  Submitted: {new Date(sub.submittedAt).toLocaleString()}
                                </p>
                                {sub.status === 'graded' && (
                                  <p className="text-xs text-green-400 mt-1">
                                    Grade: {sub.grade}% | Feedback given
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {sub.file && (
                                  <button
                                    onClick={() => downloadFile(sub.file, `${hw.title}_${sub.studentId?.name}`)}
                                    className="p-2 hover:bg-slate-700 rounded-xl text-indigo-400"
                                    title="Download Submission"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedSubmission(sub);
                                    setFeedbackData({
                                      grade: sub.grade || '',
                                      feedback: sub.feedback || '',
                                      feedbackVoice: null
                                    });
                                    setShowFeedbackModal(true);
                                  }}
                                  className="p-2 hover:bg-slate-700 rounded-xl text-emerald-400"
                                  title="Give Feedback"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Grade & Feedback</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Grade (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={feedbackData.grade}
                  onChange={(e) => setFeedbackData({...feedbackData, grade: e.target.value})}
                  className="w-full bg-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Text Feedback</label>
                <textarea
                  value={feedbackData.feedback}
                  onChange={(e) => setFeedbackData({...feedbackData, feedback: e.target.value})}
                  rows="4"
                  placeholder="Provide feedback on the submission..."
                  className="w-full bg-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Voice Feedback (Optional)</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFeedbackData({...feedbackData, feedbackVoice: e.target.files[0]})}
                  className="w-full bg-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <button
                onClick={submitFeedback}
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkTab;