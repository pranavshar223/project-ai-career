import React, { useState, useEffect } from "react";
import axios from "axios";
import ChatInterface from "../components/Chat/ChatInterface";
import { ChatMessage } from "../types";
import { useAuth } from "../contexts/AuthContext";

const Chat: React.FC = () => {
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
      }
    } catch (error) {
      // Chat history not found is fine — fresh session
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

    setMessages((prev) => [...prev, userMessage]);
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

        // ✅ If AI detected roadmap intent, auto-generate roadmap
        // ✅ Fixed URL: removed /api/ prefix (baseURL is already /api)
        if (response.data.response.roadmapData) {
          const { careerGoal, targetRole, timeframe } =
            response.data.response.roadmapData;

          try {
            await axios.post(
              "/roadmaps/generate",  // ✅ Fixed: was /api/roadmaps/generate
              {
                careerGoal,
                targetRole,
                timeframe: timeframe || "6-months",
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            console.log("Roadmap generated and saved from chat");

            // Notify user that roadmap was created
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
          <h1 className="text-3xl font-bold text-gray-900">
            AI Career Assistant
          </h1>
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