import { GoogleGenAI, Type } from "@google/genai";
import { Course, Semester, AIAnalysisResult, CalculationMode, StudyResource } from '../types';

// Helper to get client with current key
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

/**
 * Uses Gemini Vision (2.5 Flash) to parse an image of a transcript or grade slip.
 */
export const parseTranscriptImage = async (base64Image: string, mimeType: string): Promise<Course[]> => {
  const ai = getAiClient();
  
  const prompt = `
    Analyze this academic transcript/grade slip image.
    Extract all visible courses. 
    For each course, identify the Course Code, Course Title (if available, otherwise guess based on context or leave empty), Credits (default to 3 if unclear), and Grade.
    Return the data as a clean JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
              title: { type: Type.STRING },
              credits: { type: Type.NUMBER },
              grade: { type: Type.STRING }
            },
            required: ["code", "credits", "grade"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const rawData = JSON.parse(text);
    // Map to our Course interface adding IDs
    return rawData.map((c: any, index: number) => ({
      id: `parsed-${Date.now()}-${index}`,
      code: c.code || "UNKNOWN",
      title: c.title || "Parsed Course",
      credits: c.credits || 3,
      grade: c.grade || "C"
    }));

  } catch (error) {
    console.error("Error parsing transcript:", error);
    throw error;
  }
};

/**
 * Uses Gemini 3 Pro with Google Search to find study resources.
 */
export const findStudyResources = async (courseCode: string, courseTitle: string): Promise<StudyResource[]> => {
  const ai = getAiClient();
  const query = `Find high quality, free or academic study resources, PDFs, video lectures, and syllabus guides for the university course: ${courseCode} ${courseTitle}. Focus on reputable educational sources.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    // Extract grounding chunks
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (!chunks) return [];

    const resources: StudyResource[] = [];
    
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) {
        resources.push({
          title: chunk.web.title,
          uri: chunk.web.uri,
          source: new URL(chunk.web.uri).hostname.replace('www.', '')
        });
      }
    });

    // Deduplicate based on URI
    const uniqueResources = resources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);
    return uniqueResources.slice(0, 5); // Return top 5

  } catch (error) {
    console.error("Resource search failed:", error);
    return [];
  }
};

/**
 * Uses Gemini 3 Pro to provide advanced academic advice and strategy.
 */
export const generateAcademicStrategy = async (
  semesters: Semester[], 
  currentCGPA: number, 
  targetCGPA: number,
  mode: CalculationMode
): Promise<AIAnalysisResult> => {
  const ai = getAiClient();

  const modelName = 'gemini-3-pro-preview';

  const context = JSON.stringify({
    semesters: semesters.map(s => ({
      name: s.name,
      gpa: s.gpa,
      courses: s.courses.map(c => ({ code: c.code, grade: c.grade, credits: c.credits, title: c.title }))
    })),
    currentCGPA: currentCGPA.toFixed(2),
    targetCGPA: targetCGPA.toFixed(2),
    scale: mode
  });

  const prompt = `
    You are MelX, an elite academic portfolio manager. Analyze the student's academic history provided in the JSON context.
    
    Goal: The student wants to move from ${currentCGPA.toFixed(2)} to ${targetCGPA.toFixed(2)}.

    1. Analyze the trends.
    2. Provide a 'Strategic Plan' - concrete steps to reach the target.
    3. Calculate roughly what GPA they need to average in the next 2-3 semesters to hit the target.
    4. Based on the *names* and *grades* of the courses (e.g., if they are good at CS courses vs English), suggest a potential "Career Path" and 3 "Potential Roles".
    
    Output JSON matching the specified schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { text: `Context: ${context}` },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            projectedGPA: { type: Type.STRING },
            sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'critical'] },
            careerPath: { type: Type.STRING },
            potentialRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
            strategicPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.STRING },
                  details: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Strategy generation failed:", error);
    return {
      summary: "Could not generate advanced strategy at this time.",
      recommendations: ["Ensure your API Key is valid."],
      projectedGPA: "N/A",
      sentiment: "neutral",
      strategicPlan: []
    };
  }
};