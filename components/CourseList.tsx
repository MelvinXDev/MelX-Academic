import React from 'react';
import { Course, GradeScaleItem } from '../types';
import { Trash2, Plus, Search } from 'lucide-react';

interface CourseListProps {
  courses: Course[];
  scale: GradeScaleItem[];
  onUpdate: (courses: Course[]) => void;
  onFindResources: (course: Course) => void;
  readOnly?: boolean;
}

export const CourseList: React.FC<CourseListProps> = ({ courses, scale, onUpdate, onFindResources, readOnly = false }) => {
  
  const handleAddCourse = () => {
    const newCourse: Course = {
      id: `new-${Date.now()}`,
      code: '',
      title: '',
      credits: 3,
      grade: scale[0].grade
    };
    onUpdate([...courses, newCourse]);
  };

  const handleChange = (id: string, field: keyof Course, value: any) => {
    const updated = courses.map(c => c.id === id ? { ...c, [field]: value } : c);
    onUpdate(updated);
  };

  const handleRemove = (id: string) => {
    onUpdate(courses.filter(c => c.id !== id));
  };

  return (
    <div className="w-full space-y-4">
      {/* Header Row */}
      <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-mono font-medium text-slate-500 uppercase tracking-wider mb-2 px-3">
        <div className="col-span-2">Code</div>
        <div className="col-span-4">Course Title</div>
        <div className="col-span-2 text-center">Creds</div>
        <div className="col-span-3">Grade</div>
        <div className="col-span-1"></div>
      </div>

      <div className="space-y-3">
        {courses.map((course) => (
          <div 
            key={course.id} 
            className="group grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-card/40 border border-slate-800 rounded-lg p-3 transition-all hover:bg-card hover:border-slate-700"
          >
            {/* Code */}
            <div className="col-span-2">
              <input
                type="text"
                value={course.code}
                onChange={(e) => handleChange(course.id, 'code', e.target.value)}
                placeholder="CODE"
                disabled={readOnly}
                className="w-full bg-transparent text-sm font-bold font-mono text-white focus:outline-none placeholder-slate-700 uppercase"
              />
            </div>

            {/* Title */}
            <div className="col-span-4 flex items-center gap-2">
              <input
                type="text"
                value={course.title}
                onChange={(e) => handleChange(course.id, 'title', e.target.value)}
                placeholder="Course Title"
                disabled={readOnly}
                className="w-full bg-transparent text-sm text-slate-300 focus:outline-none placeholder-slate-700 focus:text-primary transition-colors"
              />
              {!readOnly && course.title.length > 3 && (
                 <button 
                  onClick={() => onFindResources(course)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-primary/20 hover:text-primary text-slate-500 transition-all"
                  title="Find Study Resources"
                 >
                   <Search size={14} />
                 </button>
              )}
            </div>

            {/* Credits */}
            <div className="col-span-2 flex justify-center">
              <input
                type="number"
                min="0"
                max="20"
                value={course.credits}
                onChange={(e) => handleChange(course.id, 'credits', parseInt(e.target.value) || 0)}
                disabled={readOnly}
                className="w-12 bg-slate-900 border border-slate-700 rounded text-center text-sm font-mono text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Grade */}
            <div className="col-span-3">
              <div className="relative">
                <select
                  value={course.grade}
                  onChange={(e) => handleChange(course.id, 'grade', e.target.value)}
                  disabled={readOnly}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm font-mono text-white focus:border-primary focus:outline-none appearance-none cursor-pointer hover:border-slate-500 transition-colors"
                >
                  {scale.map((s) => (
                    <option key={s.grade} value={s.grade} className="bg-slate-900">
                      {s.grade} ({s.point})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="col-span-1 flex justify-end">
              {!readOnly && (
                <button
                  onClick={() => handleRemove(course.id)}
                  className="text-slate-600 hover:text-accent transition-colors p-1.5 hover:bg-accent/10 rounded"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <button
          onClick={handleAddCourse}
          className="w-full py-3 border border-dashed border-slate-800 rounded-lg text-sm text-slate-500 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      )}
    </div>
  );
};