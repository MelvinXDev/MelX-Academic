import React from 'react';
import { AIAnalysisResult } from '../types';
import { BrainCircuit, TrendingUp, AlertTriangle, CheckCircle, Briefcase, Zap } from 'lucide-react';

interface AnalysisViewProps {
  analysis: AIAnalysisResult | null;
  loading: boolean;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, loading }) => {
  if (loading) {
    return (
      <div className="h-full min-h-[400px] w-full flex flex-col items-center justify-center space-y-6 p-8 bg-card/30 border border-slate-800 rounded-2xl animate-pulse">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
          <BrainCircuit size={64} className="text-primary relative z-10 animate-spin-slow" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-display font-bold text-white mb-2">Processing Data</h3>
          <p className="text-slate-400 font-mono text-sm">Gemini 3 Pro is computing strategic vectors...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="h-full min-h-[400px] w-full flex flex-col items-center justify-center p-8 bg-card/30 border border-dashed border-slate-800 rounded-2xl text-center group hover:border-slate-700 transition-colors">
        <div className="p-4 bg-slate-900 rounded-full mb-6 group-hover:bg-slate-800 transition-colors">
          <BrainCircuit size={48} className="text-slate-600 group-hover:text-primary transition-colors" />
        </div>
        <h3 className="text-xl font-display font-bold text-white mb-2">Strategy Engine Idle</h3>
        <p className="text-slate-500 text-sm max-w-md leading-relaxed">
          Configure your target metrics in the control panel to generate a comprehensive academic portfolio analysis and career alignment report.
        </p>
      </div>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-success border-success/30 bg-success/5';
      case 'critical': return 'text-accent border-accent/30 bg-accent/5';
      default: return 'text-amber-400 border-amber-900/50 bg-amber-900/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Metric Card */}
      <div className={`p-8 rounded-2xl border ${getSentimentColor(analysis.sentiment)} relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <TrendingUp size={100} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <h3 className="text-lg font-bold font-mono uppercase tracking-widest flex items-center gap-2">
              {analysis.sentiment === 'positive' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              Assessment Report
            </h3>
            <p className="text-base font-medium opacity-90 leading-relaxed">{analysis.summary}</p>
          </div>
          <div className="text-left md:text-right bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
            <span className="block text-xs uppercase tracking-wider opacity-70 font-mono mb-1">Required Future GPA</span>
            <span className="text-4xl font-display font-bold tracking-tight">{analysis.projectedGPA}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Career Insights (New) */}
        <div className="bg-card border border-slate-800 rounded-2xl p-6 hover:shadow-glow transition-shadow duration-500">
          <h4 className="text-xs font-bold font-mono text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
            <Briefcase size={16} /> Career Alignment
          </h4>
          
          <div className="mb-6">
            <p className="text-sm text-slate-400 mb-2">Recommended Path</p>
            <p className="text-lg font-semibold text-white">{analysis.careerPath || "General Studies"}</p>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-3">Potential Roles</p>
            <div className="flex flex-wrap gap-2">
              {analysis.potentialRoles?.map((role, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs font-medium text-slate-300">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-card border border-slate-800 rounded-2xl p-6">
          <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Zap size={16} /> Key Optimizations
          </h4>
          <ul className="space-y-4">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="min-w-[6px] h-[6px] rounded-full bg-primary mt-2 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Strategic Plan */}
        <div className="md:col-span-2 bg-card border border-slate-800 rounded-2xl p-6">
          <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
             Execution Roadmap
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysis.strategicPlan.map((step, idx) => (
              <div key={idx} className="relative p-4 bg-slate-900/50 rounded-xl border border-slate-800/50 hover:border-primary/50 transition-colors">
                <div className="absolute top-4 right-4 text-slate-700 font-display font-bold text-2xl opacity-20">0{idx + 1}</div>
                <h5 className="text-sm font-bold text-white mb-2">{step.step}</h5>
                <p className="text-xs text-slate-500 leading-relaxed">{step.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};