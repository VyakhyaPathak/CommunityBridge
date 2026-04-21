import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const ANALYZE_NEED_PROMPT = `
You are a community needs analyst for NGOs in India. Analyze the submitted community need report.

Return a JSON object matching the requested schema.
`;

export const MATCH_VOLUNTEERS_PROMPT = `
You are an expert volunteer coordinator for NGOs. Match volunteers to community needs based on skills, location proximity, and availability.

Return a JSON array ranking the top 5 most suitable volunteers.
`;

export async function analyzeNeed(title: string, description: string, address: string, urgency_input: number) {
  const prompt = `${ANALYZE_NEED_PROMPT}
  Need to analyze:
  Title: ${title}
  Description: ${description}
  Location: ${address}
  User-reported urgency (1-5 scale): ${urgency_input}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          urgency_score: { type: Type.NUMBER },
          key_issues: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggested_volunteer_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          estimated_people_affected: { type: Type.STRING },
          is_recurring: { type: Type.BOOLEAN },
          summary: { type: Type.STRING },
          recommended_response_time: { type: Type.STRING },
        },
        required: ["category", "urgency_score", "summary"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function matchVolunteers(need: any, volunteers: any[]) {
  const volunteersJson = JSON.stringify(volunteers.map(v => ({
    id: v.id,
    name: v.name,
    skills: v.skill_tags,
    lat: v.lat,
    lng: v.lng,
    is_available: v.is_available,
    total_tasks_completed: v.total_tasks_completed
  })), null, 2);

  const prompt = `${MATCH_VOLUNTEERS_PROMPT}
  Community Need:
  - Title: ${need.title}
  - Category: ${need.category}
  - Description: ${need.description}
  - Location: ${need.address}
  - Urgency score: ${need.urgency_score}/10

  Available Volunteers:
  ${volunteersJson}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            volunteer_id: { type: Type.STRING },
            match_score: { type: Type.NUMBER },
            reason: { type: Type.STRING },
            priority_rank: { type: Type.NUMBER },
            estimated_travel_km: { type: Type.NUMBER },
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}
