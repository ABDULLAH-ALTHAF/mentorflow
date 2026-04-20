import { useState } from 'react';
import axios from 'axios';
import { FileText, Plus, X, Download, File, Image, Trash2 } from 'lucide-react';

const NotesTab = ({ notes, user, classId, onNotesUpdate }) => {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    description: '',
    file: null,
    type: 'material'
  });

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
      onNotesUpdate(prev => [response.data, ...prev]);
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

  const deleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/notes/${noteId}`);
      onNotesUpdate(prev => prev.filter(note => note._id !== noteId));
      alert('Material deleted successfully!');
    } catch (err) {
      alert('Failed to delete material');
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

  const getFileIcon = (fileType) => {
    if (!fileType) return <File className="w-5 h-5" />;
    if (fileType.includes('image')) return <Image className="w-5 h-5" />;
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  return (
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
  );
};

export default NotesTab;