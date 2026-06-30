import React, { useState, useRef, useEffect } from "react";
import {
  LuSend,
  LuBot,
  LuUser,
  LuShieldAlert,
  LuMessageSquare,
  LuPlus,
  LuMenu,
  LuX,
  LuFileText
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import API from "../../api/API";

export default function AIassist() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Hello. I am GuardLens AI, your safety guide and reporting assistant. Are you safe right now, or do you need to report an incident?",
      intent: "chat"
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [chatList, setChatList] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    fetchChatList();
  }, []);

  const fetchChatList = async () => {
    try {
      const response = await API.get("/ai/chat-sessions");
      if (response.data.success) setChatList(response.data.data);
    } catch (error) {
      console.error("Failed to load chat history", error);
    }
  };

  const loadSession = async (sessionId) => {
    setIsLoading(true);
    setIsSidebarOpen(false);
    try {
      const response = await API.get(`/ai/chat-sessions/${sessionId}`);
      if (response.data.success) {
        setMessages(response.data.data.messages);
        setCurrentSessionId(sessionId);
      }
    } catch (error) {
      console.error("Failed to load session", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([{ role: "model", text: "Hello. I am GuardLens AI, your safety guide and reporting assistant. Are you safe right now, or do you need to report an incident?", intent: "chat" }]);
    setIsSidebarOpen(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();

    const newMessages = [...messages, { role: "user", text: userMessage }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const historyForApi = messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

      const response = await API.post("/ai/chat", {
        message: userMessage,
        history: historyForApi,
        sessionId: currentSessionId,
      });

      const data = response.data;

      if (data.success) {
        setMessages((prev) => [...prev, { 
          role: "model", 
          text: data.reply,
          intent: data.intent,
          reportData: data.reportData
        }]);
      }
      if (!currentSessionId && data.sessionId) {
        setCurrentSessionId(data.sessionId);
        fetchChatList();
      }
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage =
        error.status === 503 || error.response?.status === 503
          ? "GuardLens AI is currently experiencing high traffic. Please try again in a moment."
          : "Failed to connect to the assistant. Please check your connection.";

      setMessages((prev) => [
        ...prev,
        { role: "model", text: `⚠️ ${errorMessage}`, intent: "chat" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-row h-[92dvh]  md:h-[100vh] max-h-[800px] w-full mx-auto bg-(--gl-bg-base) border border-(--gl-border-light) overflow-hidden font-satoshi relative">
     
      {isSidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        /> 
      )}
      <div className={`absolute md:relative z-30 flex flex-col w-64 h-full bg-(--gl-bg-surface) border-r border-(--gl-border-light) transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-4 border-b border-(--gl-border-light) flex items-center justify-between">
          <h2 className="font-bold text-(--gl-text-main) flex items-center gap-2">
            <LuMessageSquare size={18} /> History
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-(--gl-text-muted)">
            <LuX size={20} />
          </button>
        </div>

        <div className="p-3">
          <button onClick={startNewChat} className="w-full flex items-center justify-center gap-2 bg-(--gl-brand-primary) text-(--gl-text-inverse) font-bold py-2.5 rounded-xl">
            <LuPlus size={18} /> New Chat
          </button>
        </div>

        <div className=" flex-1 overflow-y-auto min-h-0 px-3 pb-3 flex flex-col gap-1">
          {chatList.map((chat) => (
            <button
              key={chat._id}
              onClick={() => loadSession(chat._id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium shrink-0 truncate ${
                currentSessionId === chat._id
                  ? "bg-(--gl-bg-surface-hover) border border-(--gl-border-focus) text-(--gl-brand-primary)"
                  : "text-(--gl-text-muted)"
              }`}
            >
              {chat.title}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full h-full relative z-10 bg-(--gl-bg-base)">

        <div className=" flex items-center gap-3 px-6 py-4 bg-(--gl-bg-surface) border-b border-(--gl-border-light)">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="md:hidden p-2 -ml-2 text-(--gl-text-main) hover:bg-(--gl-bg-surface-hover) rounded-lg transition-colors"
          >
            <LuMenu size={24} />
          </button>
          <div className="p-2 bg-(--gl-brand-primary)/10 text-(--gl-brand-primary) rounded-lg">
            <LuShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-(--gl-text-main) font-integral">
              GuardLens AI
            </h2>
            <p className="text-xs text-(--gl-text-muted) font-medium">
              Intake & Safety Assistant
            </p>
          </div>
        </div>

        <div className="flex-1  overflow-y-auto p-6 flex flex-col gap-6 bg-(--gl-bg-base)">
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`flex-shrink-0  w-10 h-10 flex items-center justify-center rounded-full ${msg.role === "user" ? "bg-(--gl-brand-primary) text-(--gl-text-inverse)" : "bg-(--gl-bg-surface) border border-(--gl-border-light) text-(--gl-text-main)"}`}>
                {msg.role === "user" ? <LuUser size={20} /> : <LuBot size={20} />}
              </div>

              <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm md:text-base leading-relaxed ${msg.role === "user" ? "bg-(--gl-brand-primary) text-(--gl-text-inverse) rounded-tr-none" : "bg-(--gl-bg-surface) border border-(--gl-border-light) text-(--gl-text-main) rounded-tl-none whitespace-pre-wrap"}`}>
                {msg.text}

                {msg.role === "model" && msg.intent === "report_ready" && msg.reportData && (
                  <div className="mt-4 p-4 bg-(--gl-bg-base) border border-(--gl-border-light) rounded-xl shadow-sm text-(--gl-text-main)">
                    <h4 className="font-bold flex items-center gap-2 text-(--gl-text-main) mb-3 border-b border-(--gl-border-light) pb-2">
                      <LuFileText className="text-(--gl-brand-primary)" size={18} /> Draft Report Ready
                    </h4>
                    <div className="flex flex-col gap-2 text-sm text-(--gl-text-muted) mb-4">
                      <p><strong>Category:</strong> {msg.reportData.crimeType}</p>
                      <p><strong>Desc:</strong> {msg.reportData.description}</p>
                    </div>
                    <button 
                      onClick={() => navigate('/user/review-report', { state: { prefillData: msg.reportData } })}
                      className="w-full py-2.5 bg-(--gl-brand-primary) text-(--gl-text-inverse) font-bold rounded-lg hover:bg-(--gl-brand-hover) transition-colors flex items-center justify-center gap-2"
                    >
                      Review & Submit Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 flex-row">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-(--gl-bg-surface) border border-(--gl-border-light) text-(--gl-text-main)">
                <LuBot size={20} />
              </div>
              <div className="bg-(--gl-bg-surface) border border-(--gl-border-light) px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                <div className="w-2 h-2 bg-(--gl-brand-primary) rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-(--gl-brand-primary) rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-(--gl-brand-primary) rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 bg-(--gl-bg-surface) border-t border-(--gl-border-light) flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Type your message..."
            className="flex-1 max-h-32 min-h-[52px] bg-(--gl-bg-base) border border-(--gl-border-light) text-(--gl-text-main) rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-(--gl-border-focus) resize-none"
            rows={1}
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="h-[52px] px-6 bg-(--gl-brand-primary) text-(--gl-text-inverse) rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
            <span className="hidden sm:inline">Send</span>
            <LuSend size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}