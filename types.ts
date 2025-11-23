export interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  grade: string; // "A", "B+", etc.
  gradePoint?: number; // Calculated based on scale
}

export interface Semester {
  id: string;
  name: string;
  courses: Course[];
  gpa: number;
}

export interface GradeScaleItem {
  grade: string;
  point: number;
  minScore?: number;
  maxScore?: number;
}

export interface StudyResource {
  title: string;
  uri: string;
  source: string;
}

export interface AIAnalysisResult {
  summary: string;
  recommendations: string[];
  projectedGPA: string;
  sentiment: 'positive' | 'neutral' | 'critical';
  strategicPlan: Array<{ step: string; details: string }>;
  careerPath?: string;
  potentialRoles?: string[];
}

export enum CalculationMode {
  Standard4 = '4.0 Scale',
  Standard5 = '5.0 Scale',
}

export type ProcessingStatus = 'idle' | 'scanning' | 'thinking' | 'searching' | 'complete' | 'error';