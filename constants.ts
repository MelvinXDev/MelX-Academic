import { GradeScaleItem, CalculationMode } from './types';

export const SCALE_4_0: GradeScaleItem[] = [
  { grade: 'A', point: 4.0 },
  { grade: 'A-', point: 3.7 },
  { grade: 'B+', point: 3.3 },
  { grade: 'B', point: 3.0 },
  { grade: 'B-', point: 2.7 },
  { grade: 'C+', point: 2.3 },
  { grade: 'C', point: 2.0 },
  { grade: 'C-', point: 1.7 },
  { grade: 'D+', point: 1.3 },
  { grade: 'D', point: 1.0 },
  { grade: 'F', point: 0.0 },
];

export const SCALE_5_0: GradeScaleItem[] = [
  { grade: 'A', point: 5.0 },
  { grade: 'B', point: 4.0 },
  { grade: 'C', point: 3.0 },
  { grade: 'D', point: 2.0 },
  { grade: 'E', point: 1.0 }, // Sometimes used
  { grade: 'F', point: 0.0 },
];

export const DEFAULT_COURSES = [
  { id: '1', code: 'CS101', title: 'Intro to Computer Science', credits: 4, grade: 'A' },
  { id: '2', code: 'MATH101', title: 'Calculus I', credits: 4, grade: 'B+' },
  { id: '3', code: 'ENG101', title: 'Academic Writing', credits: 3, grade: 'A-' },
  { id: '4', code: 'PHY101', title: 'General Physics', credits: 4, grade: 'B' },
];

export const MOCK_ANALYSIS = {
  summary: "Your academic performance is solid, particularly in core CS subjects.",
  recommendations: ["Focus on Physics to boost your overall CGPA.", "Maintain the A streak in practical courses."],
  projectedGPA: "3.75",
  sentiment: "positive",
  strategicPlan: [{ step: "Next Semester", details: "Take lighter electives." }]
};

export const getPoint = (grade: string, mode: CalculationMode): number => {
  const scale = mode === CalculationMode.Standard5 ? SCALE_5_0 : SCALE_4_0;
  const item = scale.find(s => s.grade === grade);
  return item ? item.point : 0;
};
