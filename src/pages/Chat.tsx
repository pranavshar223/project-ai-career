import React, { useState, useEffect } from "react";
import axios from "axios";
import ChatInterface from "../components/Chat/ChatInterface";
import { ChatMessage } from "../types";
import { useAuth } from "../contexts/AuthContext";

interface ChatProps {
  onSessionsChange?: (sessions: { id: string; title: string; date: string }[]) => void;
}

const Chat: React.FC<ChatProps> = ({ onSessionsChange }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);
  const { token } = useAuth();

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const response = await axios.get(`/chat/history/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.messages) {
        const formattedMessages: ChatMessage[] = response.data.messages.map(
          (msg: any) => ({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            timestamp: new Date(msg.timestamp),
          })
        );
        setMessages(formattedMessages);

        // Build session list for sidebar
        if (onSessionsChange && formattedMessages.length > 0) {
          const firstUserMsg = formattedMessages.find((m) => m.role === "user");
          onSessionsChange([
            {
              id: sessionId,
              title: firstUserMsg
                ? firstUserMsg.content.slice(0, 40) + "..."
                : "Session",
              date: new Date().toLocaleDateString(),
            },
          ]);
        }
      }
    } catch (error) {
      console.log("No previous chat history for this session");
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const updated = [...prev, userMessage];
      // Update sidebar session title from first user message
      if (onSessionsChange && prev.filter((m) => m.role === "user").length === 0) {
        onSessionsChange([
          {
            id: sessionId,
            title: content.slice(0, 40) + (content.length > 40 ? "..." : ""),
            date: new Date().toLocaleDateString(),
          },
        ]);
      }
      return updated;
    });

    setIsLoading(true);

    try {
      const response = await axios.post(
        "/chat/message",
        { content, sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.response) {
        const aiMessage: ChatMessage = {
          id: response.data.response.id,
          content: response.data.response.content,
          role: "assistant",
          timestamp: new Date(response.data.response.timestamp),
        };

        setMessages((prev) => [...prev, aiMessage]);

        if (response.data.response.roadmapData) {
          const { careerGoal, targetRole, timeframe } =
            response.data.response.roadmapData;
          try {
            await axios.post(
              "/roadmaps/generate",
              { careerGoal, targetRole, timeframe: timeframe || "6-months" },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const roadmapNotice: ChatMessage = {
              id: (Date.now() + 2).toString(),
              content: `✅ I've generated your personalized roadmap for **${careerGoal}**! Head to the Dashboard to see it.`,
              role: "assistant",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, roadmapNotice]);
          } catch (err) {
            console.error("Error generating roadmap from chat:", err);
          }
        }
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content:
          error.response?.data?.message ||
          "I'm sorry, I encountered an error. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Career Assistant</h1>
          <p className="text-gray-600 mt-2">
            Get personalized career guidance powered by AI. Ask about skills,
            roadmaps, or career planning.
          </p>
        </div>
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default Chat;