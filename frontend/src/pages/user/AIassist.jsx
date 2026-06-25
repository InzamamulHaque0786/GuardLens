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
    <div className="flex flex-row h-[91vh] md:h-[100vh] max-h-[800px] w-full  mx-auto bg-(--color-background-1) border border-(--color-border)  overflow-hidden  font-satoshi relative">
     
      {isSidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className={`absolute md:relative z-30 flex flex-col w-64 h-full bg-(--color-background-2) border-r border-(--color-border) transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-4 border-b border-(--color-border) flex items-center justify-between">
          <h2 className="font-bold text-(--color-primary) flex items-center gap-2">
            <LuMessageSquare size={18} /> History
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-(--color-muted-foreground)">
            <LuX size={20} />
          </button>
        </div>

        <div className="p-3">
          <button onClick={startNewChat} className="w-full flex items-center justify-center gap-2 bg-(--color-highlight) text-white font-bold py-2.5 rounded-xl">
            <LuPlus size={18} /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-1">
          {chatList.map((chat) => (
            <button
              key={chat._id}
              onClick={() => loadSession(chat._id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium truncate ${
                currentSessionId === chat._id
                  ? "bg-(--color-background-1) border border-(--color-border) text-(--color-primary)"
                  : "text-(--color-muted-foreground)"
              }`}
            >
              {chat.title}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full h-full relative z-10 bg-(--color-background-1)">

        <div className="flex items-center gap-3 px-6 py-4 bg-(--color-background-2) border-b border-(--color-border)">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="md:hidden p-2 -ml-2 text-(--color-primary) hover:bg-(--color-background-1) rounded-lg transition-colors"
          >
            <LuMenu size={24} />
          </button>
          <div className="p-2 bg-(--color-highlight)/10 text-(--color-highlight) rounded-lg">
            <LuShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-(--color-primary) font-integral">
              GuardLens AI
            </h2>
            <p className="text-xs text-(--color-muted-foreground) font-medium">
              Intake & Safety Assistant
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-(--color-background-1)">
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${msg.role === "user" ? "bg-(--color-highlight) text-white" : "bg-(--color-background-2) border border-(--color-border) text-(--color-primary)"}`}>
                {msg.role === "user" ? <LuUser size={20} /> : <LuBot size={20} />}
              </div>

              <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm md:text-base leading-relaxed ${msg.role === "user" ? "bg-(--color-highlight) text-white rounded-tr-none" : "bg-(--color-background-2) border border-(--color-border) text-(--color-primary) rounded-tl-none whitespace-pre-wrap"}`}>
                {msg.text}

                {msg.role === "model" && msg.intent === "report_ready" && msg.reportData && (
                  <div className="mt-4 p-4 bg-(--color-background-1) border border-(--color-border) rounded-xl shadow-sm text-black">
                    <h4 className="font-bold flex items-center gap-2 text-(--color-primary) mb-3 border-b border-(--color-border) pb-2">
                      <LuFileText className="text-blue-600" size={18} /> Draft Report Ready
                    </h4>
                    <div className="flex flex-col gap-2 text-sm text-(--color-muted-foreground) mb-4">
                      <p><strong>Category:</strong> {msg.reportData.crimeType}</p>
                      <p><strong>Desc:</strong> {msg.reportData.description}</p>
                    </div>
                    <button 
                      onClick={() => navigate('/user/review-report', { state: { prefillData: msg.reportData } })}
                      className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
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
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-(--color-background-2) border border-(--color-border) text-(--color-primary)">
                <LuBot size={20} />
              </div>
              <div className="bg-(--color-background-2) border border-(--color-border) px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                <div className="w-2 h-2 bg-(--color-highlight) rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-(--color-highlight) rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-(--color-highlight) rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 bg-(--color-background-2) border-t border-(--color-border) flex gap-3 items-end">
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
            className="flex-1 max-h-32 min-h-[52px] bg-(--color-background-1) border border-(--color-border) text-(--color-primary) rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-(--color-highlight) resize-none"
            rows={1}
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="h-[52px] px-6 bg-(--color-highlight) text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
            <span className="hidden sm:inline">Send</span>
            <LuSend size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}