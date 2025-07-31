import { GoogleGenAI, Type } from "@google/genai";
import type { Speech, SpeakerRole, Team, Feedback } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function generateTopics(category: string): Promise<string[]> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate three distinct and debatable topics related to ${category}. The topics should be suitable for a competitive high school or college-level debate.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topics: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.topics.slice(0, 3);
    } catch (error) {
        console.error("Error generating topics:", error);
        // Fallback topics
        return [
            "Should social media platforms be regulated as public utilities?",
            "Is universal basic income a viable solution to poverty?",
            "Should AI development be paused for ethical review?",
        ];
    }
}

export async function generateSpeech(role: SpeakerRole, topic: string, history: Speech[], team: Team, speechTime: number): Promise<string> {
    const historyText = history.map(s => `${s.speakerRole}: "${s.transcript}"`).join('\n\n');
    const prompt = `
        You are an expert debater, performing the role of ${role} for ${team}.
        The debate topic is: "${topic}".
        
        The debate transcript so far:
        ${historyText.length > 0 ? historyText : "This is the first speech."}

        Your task is to deliver a powerful and coherent speech for your role, as plain text.
        - If you are the first speaker, introduce your team's stance and provide a roadmap for your arguments.
        - If you are responding to previous speakers, you MUST directly address their points before introducing new arguments or reinforcing your own.
        - Your speech should be approximately ${Math.floor((speechTime / 60) * 130)} words long to fit within a ${speechTime / 60}-minute time limit.
        - The tone should be appropriate for a debate: confident, persuasive, and sometimes assertive.
        - Do not use any special formatting like SSML or Markdown. Just provide the raw text of the speech.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Error generating speech:", error);
        return "I am unable to generate a speech at this moment. Please check the configuration.";
    }
}

export async function askJudge(topic: string, history: Speech[], question: string): Promise<string> {
    const historyText = history.map(s => `${s.speakerRole}: "${s.transcript}"`).join('\n\n');
    const prompt = `
        You are a world-class, neutral debate judge and an expert on the debate topic.
        The debate topic is: "${topic}".

        A debater has paused the debate to ask you for a clarification. Your answer should be impartial and should not help one side more than the other.
        The user's question is: "${question}"

        Provide a concise, neutral, and informative answer to the question. Do not take a side in the debate. Your role is to clarify rules, facts, or concepts if needed.
        Base your answer on the context of the debate so far if relevant.
        Do not add conversational fluff. Just provide the answer.

        Debate Transcript (for context):
        ${historyText.length > 0 ? historyText : "No speeches have been made yet."}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error asking judge:", error);
        return "I am unable to provide an answer at this moment. Please try again later.";
    }
}


export async function generateFeedback(topic: string, history: Speech[], userRoles: SpeakerRole[]): Promise<Feedback> {
    const historyText = history.map(s => `${s.speakerRole}: "${s.transcript}"`).join('\n\n');
    const userRolesText = userRoles.join(' and ');
    
    const prompt = `
        You are a world-class, expert debate judge providing feedback on a debate.
        The topic was: "${topic}".
        The full transcript is below:
        ${historyText}

        Your task is to provide detailed, expert feedback for the human user who performed as ${userRolesText}. Your analysis must be structured as a JSON object.

        Analyze the user's performance based on these four criteria, providing an integer score from 1 to 10 for each:
        1.  **Speaking Points**: Clarity, pacing, tone, and overall verbal delivery.
        2.  **Logic and Reasoning**: The strength, coherence, and logical consistency of arguments.
        3.  **Rhetoric and Persuasion**: Effective use of language, emotional appeal, and persuasive techniques.
        4.  **Rebuttal and Adaptation**: How well they addressed opponent's points and adapted their strategy.

        Then, provide the following qualitative feedback:
        -   **overallSummary**: A concise (2-3 sentences) executive summary of their performance.
        -   **strengths**: A bulleted list (as an array of strings) of 2-3 key strengths.
        -   **areasForImprovement**: A bulleted list (as an array of strings) of 2-3 specific, actionable areas for growth.
        -   **strategicAdvice**: A paragraph of high-level strategic advice for future debates.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        scores: {
                            type: Type.OBJECT,
                            properties: {
                                speakingPoints: { type: Type.INTEGER, description: 'Score out of 10 for speaking.' },
                                logicAndReasoning: { type: Type.INTEGER, description: 'Score out of 10 for logic.' },
                                rhetoricAndPersuasion: { type: Type.INTEGER, description: 'Score out of 10 for rhetoric.' },
                                rebuttalAndAdaptation: { type: Type.INTEGER, description: 'Score out of 10 for rebuttal.' },
                            },
                            required: ["speakingPoints", "logicAndReasoning", "rhetoricAndPersuasion", "rebuttalAndAdaptation"]
                        },
                        overallSummary: { type: Type.STRING, description: 'A 2-3 sentence executive summary.' },
                        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of key strengths.' },
                        areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of areas for improvement.' },
                        strategicAdvice: { type: Type.STRING, description: 'High-level strategic advice.' }
                    },
                    required: ["scores", "overallSummary", "strengths", "areasForImprovement", "strategicAdvice"]
                }
            }
        });

        return JSON.parse(response.text) as Feedback;
    } catch (error) {
        console.error("Error generating feedback:", error);
        return {
            scores: { speakingPoints: 0, logicAndReasoning: 0, rhetoricAndPersuasion: 0, rebuttalAndAdaptation: 0 },
            overallSummary: "Could not generate feedback due to an error. The AI judge may be unavailable or there was an issue with the debate data.",
            strengths: ["No analysis available."],
            areasForImprovement: ["No analysis available."],
            strategicAdvice: "Unable to provide advice at this time."
        };
    }
}