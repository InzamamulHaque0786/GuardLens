import { GoogleGenAI } from '@google/genai';
import { ChatSession } from '../models/chatSession.model.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_FALLBACKS = [
    "gemini-3.1-flash-lite",
];



export const chatWithAI = async (req, res) => {
    try {
        const { message, history = [], sessionId } = req.body;

        if (!message) return res.status(400).json({ success: false, message: "Message required." });


        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60 * 1000;
        const localNow = new Date(now.getTime() - offsetMs);
        const currentDateTime = localNow.toISOString().substring(0, 16);

        const SYSTEM_INSTRUCTION = `You are GuardLens AI, an empathetic crime reporting assistant and safety advisor.
        CRITICAL CONTEXT: The current exact date and time is ${currentDateTime}.

        CRIME CATEGORIES (You MUST map the user's issue to one of these EXACT strings):
        "Theft", "Assault", "Vandalism", "Burglary", "Harassment", "Fraud", "Kidnapping", "Cybercrime", "Homicide", "Other"

        RULES:
        1. Provide immediate safety and legal advice based on the situation described.
        2. If the user wants to report an incident, ask them for a description if they haven't provided it. Location and time are optional.
        3. Set "intent" to "chat" while you are giving advice or gathering information.
        4. Set "intent" to "report_ready" ONLY when you have given your advice AND have at least a description of the incident.

        You MUST respond in valid JSON format exactly like this:
        {
          "reply": "Your conversational response, advice, or follow-up question",
          "intent": "chat" OR "report_ready",
          "reportData": {
            "crimeType": "One of the 10 exact categories above, or Other",
            "description": "Summary of the incident, or null",
            "location": "Extracted location if mentioned, or null",
            "time": "Extracted time STRICTLY in YYYY-MM-DDTHH:mm format. You MUST calculate relative dates based on the current time ${currentDateTime}. (e.g., if current date is 2026-06-25 and user says 'yesterday at 4pm', output '2026-06-24T16:00'). If no time is mentioned, output null.",
            "reporterType": "victim" or "spectator"
          }
        }`;


        let aiResponseObj = null;
        let successfulModel = null;

        for (const modelName of MODEL_FALLBACKS) {
            try {
                const chat = ai.chats.create({
                    model: modelName,
                    config: { 
                        systemInstruction: SYSTEM_INSTRUCTION,
                        responseMimeType: "application/json" 
                    },
                    history: history 
                });
                
                const response = await chat.sendMessage({ message: message });
                
                aiResponseObj = JSON.parse(response.text); 
                successfulModel = modelName;
                break; 
            } catch (error) {
                console.warn(`${modelName} failed. Trying next...`);
            }
        }

        if (!aiResponseObj) throw new Error("All fallback models failed.");

        let session;
        if (sessionId) {
            session = await ChatSession.findById(sessionId);
            if (session) {
                session.messages.push({ role: 'user', text: message });
                session.messages.push({ role: 'model', text: aiResponseObj.reply }); 
                await session.save();
            }
        } else {
            const titleResponse = await ai.chats.create({ model: 'gemini-3.1-flash-lite' })
                .sendMessage({ message: `Summarize this in 3 short words for a chat title: "${message}"` });
            
            const title = titleResponse.text.replace(/["']/g, '').trim() || "New Chat";

            session = await ChatSession.create({
                userId: req.user.id,
                title: title,
                messages: [
                    ...history.map(h => ({ role: h.role, text: h.parts[0].text })),
                    { role: 'user', text: message },
                    { role: 'model', text: aiResponseObj.reply } 
                ]
            });
        }

        return res.status(200).json({
            success: true,
            reply: aiResponseObj.reply,
            intent: aiResponseObj.intent,
            reportData: aiResponseObj.reportData,
            sessionId: session._id,
            modelUsed: successfulModel
        });

    } catch (error) {
        console.error("AI Chat Error:", error);
        return res.status(503).json({ success: false, message: "Service unavailable." });
    }
};

export const getChatHistory = async (req, res) => {
    try {
        const sessions = await ChatSession.find({ userId: req.user.id })
            .select('title updatedAt')
            .sort({ updatedAt: -1 }); 

        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load chat history." });
    }
};

export const getChatSession = async (req, res) => {
    try {
        const session = await ChatSession.findOne({ 
            _id: req.params.sessionId, 
            userId: req.user.id 
        });

        if (!session) return res.status(404).json({ success: false, message: "Chat not found." });

        res.status(200).json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load chat." });
    }
};