import React, { useState, useMemo, useRef } from 'react';
import { 
  Semester, Course, CalculationMode, ProcessingStatus, AIAnalysisResult, StudyResource 
} from './types';
import { SCALE_4_0, SCALE_5_0, getPoint } from './constants';
import { CourseList } from './components/CourseList';
import { AnalysisView } from './components/AnalysisView';
import { parseTranscriptImage, generateAcademicStrategy, findStudyResources } from './services/geminiService';
import { 
  Plus, Sparkles, LayoutDashboard, LineChart, 
  Trash2, Camera, X, ExternalLink, BookOpen, Search 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const App: React.FC = () => {
  // State
  const [mode, setMode] = useState<CalculationMode>(CalculationMode.Standard4);
  const [semesters, setSemesters] = useState<Semester[]>([
    { id: 'sem-1', name: 'Semester 1', courses: [], gpa: 0 }
  ]);
  const [activeTab, setActiveTab] = useState<'calc' | 'strategy'>('calc');
  const [targetCGPA, setTargetCGPA] = useState<number>(3.8);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Resource Finding State
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [activeResourceCourse, setActiveResourceCourse] = useState<Course | null>(null);
  const [foundResources, setFoundResources] = useState<StudyResource[]>([]);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived Values
  const activeScale = mode === CalculationMode.Standard5 ? SCALE_5_0 : SCALE_4_0;

  // Calculate GPA for a specific semester
  const calculateSemesterGPA = (courses: Course[]): number => {
    if (courses.length === 0) return 0;
    const totalPoints = courses.reduce((sum, c) => sum + (getPoint(c.grade, mode) * c.credits), 0);
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    return totalCredits === 0 ? 0 : parseFloat((totalPoints / totalCredits).toFixed(2));
  };

  // Update semester logic
  const handleUpdateCourses = (semId: string, updatedCourses: Course[]) => {
    setSemesters(prev => prev.map(sem => {
      if (sem.id === semId) {
        return {
          ...sem,
          courses: updatedCourses,
          gpa: calculateSemesterGPA(updatedCourses)
        };
      }
      return sem;
    }));
  };

  const addSemester = () => {
    const newId = `sem-${Date.now()}`;
    setSemesters([...semesters, { id: newId, name: `Semester ${semesters.length + 1}`, courses: [], gpa: 0 }]);
  };

  const removeSemester = (id: string) => {
    setSemesters(semesters.filter(s => s.id !== id));
  };

  // Calculate Overall CGPA
  const cgpa = useMemo(() => {
    let totalPoints = 0;
    let totalCredits = 0;
    semesters.forEach(sem => {
      sem.courses.forEach(c => {
        totalPoints += getPoint(c.grade, mode) * c.credits;
        totalCredits += c.credits;
      });
    });
    return totalCredits === 0 ? 0 : parseFloat((totalPoints / totalCredits).toFixed(2));
  }, [semesters, mode]);

  // Chart Data
  const chartData = useMemo(() => {
    let cumulativePoints = 0;
    let cumulativeCredits = 0;
    
    return semesters.map(sem => {
      sem.courses.forEach(c => {
        cumulativePoints += getPoint(c.grade, mode) * c.credits;
        cumulativeCredits += c.credits;
      });
      const cumulativeGPA = cumulativeCredits === 0 ? 0 : cumulativePoints / cumulativeCredits;
      
      return {
        name: sem.name,
        semGPA: sem.gpa,
        cgpa: parseFloat(cumulativeGPA.toFixed(2))
      };
    });
  }, [semesters, mode]);

  // Handlers
  const handleTranscriptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('scanning');
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        const mimeType = file.type;
        
        const parsedCourses = await parseTranscriptImage(base64Data, mimeType);
        
        if (parsedCourses.length > 0) {
          const newId = `sem-import-${Date.now()}`;
          const gpa = calculateSemesterGPA(parsedCourses);
          setSemesters(prev => [...prev, {
            id: newId,
            name: `Imported Transcript`,
            courses: parsedCourses,
            gpa
          }]);
          setStatus('complete');
        } else {
            setErrorMessage("Could not detect any courses. Please try a clearer image.");
            setStatus('error');
        }
      } catch (err) {
        setErrorMessage("Failed to process image. Ensure API Key is set.");
        setStatus('error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateStrategy = async () => {
    setStatus('thinking');
    setAnalysis(null);
    try {
      const result = await generateAcademicStrategy(semesters, cgpa, targetCGPA, mode);
      setAnalysis(result);
      setStatus('complete');
    } catch (e) {
      setErrorMessage("Strategy generation failed.");
      setStatus('error');
    }
  };

  const handleFindResources = async (course: Course) => {
    if (!course.title) return;
    setActiveResourceCourse(course);
    setFoundResources([]);
    setResourceModalOpen(true);
    setStatus('searching');
    
    try {
      const resources = await findStudyResources(course.code, course.title);
      setFoundResources(resources);
      setStatus('complete');
    } catch (e) {
      setErrorMessage("Could not find resources.");
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30 pb-20">
      
      {/* Top Navigation Bar - Minimalist Banking Style */}
      <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-xl border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-display font-bold tracking-tighter text-white">
              Mel<span className="text-primary">X</span>
            </div>
            <div className="hidden md:block h-4 w-[1px] bg-gray-800 mx-2"></div>
            <span className="hidden md:block text-xs font-mono text-gray-500 tracking-widest uppercase">Academic Intelligence</span>
          </div>
          
          <div className="flex items-center gap-2 bg-surface rounded-lg p-1 border border-gray-800">
            <button 
              onClick={() => setMode(CalculationMode.Standard4)}
              className={`px-3 py-1 rounded-md text-[10px] font-mono font-medium transition-all ${mode === CalculationMode.Standard4 ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
            >
              4.0 SCALE
            </button>
            <button 
              onClick={() => setMode(CalculationMode.Standard5)}
              className={`px-3 py-1 rounded-md text-[10px] font-mono font-medium transition-all ${mode === CalculationMode.Standard5 ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
            >
              5.0 SCALE
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-24 px-4 max-w-7xl mx-auto">
        
        {/* Dashboard Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
          {/* Main Metric - Banking Style Gauge */}
          <div className="lg:col-span-4 bg-card border border-gray-800 rounded-2xl p-6 shadow-card relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <LayoutDashboard size={120} />
            </div>
            
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-1">Cumulative GPA</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-display font-bold text-white tracking-tight">{cgpa.toFixed(2)}</span>
                  <span className="text-slate-600 font-medium">/ {mode === CalculationMode.Standard5 ? '5.00' : '4.00'}</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full border-4 border-gray-800 flex items-center justify-center relative">
                 <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin-slow" style={{ animationDuration: '3s' }}></div>
                 <span className="text-[10px] font-bold text-primary">A+</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-mono">
                <span>Progress</span>
                <span>{(cgpa / (mode === CalculationMode.Standard5 ? 5 : 4) * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary shadow-[0_0_10px_#06b6d4]"
                  style={{ width: `${(cgpa / (mode === CalculationMode.Standard5 ? 5 : 4)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Analytics Chart */}
          <div className="lg:col-span-8 bg-card border border-gray-800 rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-slate-400 text-xs font-mono uppercase tracking-widest">Performance Velocity</h3>
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span className="text-xs text-slate-400">Semester GPA</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span className="text-xs text-slate-400">Cumulative</span>
                 </div>
              </div>
            </div>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCgpa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis domain={[0, mode === CalculationMode.Standard5 ? 6 : 5]} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="basis" dataKey="semGPA" stroke="#06b6d4" strokeWidth={2} fill="url(#colorSem)" />
                  <Area type="basis" dataKey="cgpa" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorCgpa)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-6 bg-surface p-1 rounded-xl border border-gray-900 w-fit">
          <button
            onClick={() => setActiveTab('calc')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'calc' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <LayoutDashboard size={16} />
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab('strategy')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'strategy' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <LineChart size={16} />
            Strategy
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'calc' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-2">
              <h2 className="text-xl font-display font-semibold text-white">Active Semesters</h2>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleTranscriptUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={status === 'scanning'}
                  className="flex items-center gap-2 px-4 py-2 bg-surface border border-gray-800 hover:bg-gray-800 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 text-slate-300"
                >
                  {status === 'scanning' ? <span className="animate-spin">⏳</span> : <Camera size={14} />}
                  SCAN TRANSCRIPT
                </button>
                <button 
                  onClick={addSemester}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primaryDark text-black rounded-lg text-xs font-bold transition-colors shadow-glow"
                >
                  <Plus size={14} />
                  NEW SEMESTER
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl flex items-center justify-between">
                <span>{errorMessage}</span>
                <button onClick={() => setErrorMessage(null)}><X size={14} /></button>
              </div>
            )}

            <div className="grid gap-6">
              {semesters.map((sem) => (
                <div key={sem.id} className="bg-card border border-gray-800 rounded-xl overflow-hidden shadow-sm transition-all hover:border-gray-700">
                  <div className="p-4 bg-gray-900/40 border-b border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <input 
                        className="bg-transparent font-display font-semibold text-white focus:outline-none focus:text-primary transition-colors"
                        value={sem.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSemesters(prev => prev.map(s => s.id === sem.id ? { ...s, name: val } : s));
                        }}
                      />
                      <div className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-800 text-primary border border-gray-700">
                        GPA {sem.gpa.toFixed(2)}
                      </div>
                    </div>
                    <button onClick={() => removeSemester(sem.id)} className="text-gray-600 hover:text-accent transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="p-4">
                    <CourseList 
                      courses={sem.courses} 
                      scale={activeScale} 
                      onUpdate={(courses) => handleUpdateCourses(sem.id, courses)}
                      onFindResources={handleFindResources}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Strategy Control Panel */}
             <div className="lg:col-span-4 space-y-6">
                <div className="bg-card border border-gray-800 rounded-2xl p-6 shadow-card">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">MelX Strategist</h3>
                      <p className="text-[10px] text-gray-500 font-mono uppercase">Model: MelX 3.0 Pro</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Goal</label>
                        <span className="font-mono text-xl font-bold text-primary">{targetCGPA.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" 
                        min={cgpa} 
                        max={mode === CalculationMode.Standard5 ? 5 : 4} 
                        step="0.01"
                        value={targetCGPA}
                        onChange={(e) => setTargetCGPA(parseFloat(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-gray-600 font-mono mt-1">
                        <span>Current</span>
                        <span>Max</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleGenerateStrategy}
                      disabled={status === 'thinking'}
                      className="w-full py-4 bg-white text-black rounded-xl font-bold text-sm shadow-glow hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {status === 'thinking' ? (
                        <>COMPUTING...</>
                      ) : (
                        <>GENERATE STRATEGY <Sparkles size={14} /></>
                      )}
                    </button>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-800">
                     <div className="flex items-start gap-3">
                        <div className="w-1 h-full bg-gray-800 rounded-full"></div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Our AI engine analyzes course difficulty vectors and credit loads to forecast the optimal path to your target GPA.
                        </p>
                     </div>
                  </div>
                </div>
             </div>

             {/* Strategy Output */}
             <div className="lg:col-span-8">
                <AnalysisView analysis={analysis} loading={status === 'thinking'} />
             </div>
          </div>
        )}
      </main>

      {/* Resource Scout Modal */}
      {resourceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-surface border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Search size={18} className="text-primary" />
                  Resource Scout
                </h3>
                <p className="text-sm text-gray-500">Searching specifically for {activeResourceCourse?.code}</p>
              </div>
              <button 
                onClick={() => setResourceModalOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {status === 'searching' ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-400 animate-pulse">Scanning academic repositories...</p>
                </div>
              ) : foundResources.length > 0 ? (
                <div className="grid gap-3">
                  {foundResources.map((res, idx) => (
                    <a 
                      key={idx} 
                      href={res.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex items-start gap-4 p-4 bg-card border border-gray-800 rounded-xl hover:border-primary/50 hover:bg-gray-900 transition-all"
                    >
                      <div className="p-3 bg-gray-800 rounded-lg group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                        <BookOpen size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white group-hover:text-primary transition-colors line-clamp-1">{res.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono text-gray-500 uppercase">{res.source}</span>
                          <ExternalLink size={12} className="text-gray-600" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No resources found. Try checking the course code.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;