import { Users } from 'lucide-react';

const PeopleTab = ({ teachers, students, classInfo, user }) => {
  return (
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
  );
};

export default PeopleTab;