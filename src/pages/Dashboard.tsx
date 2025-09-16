import React, { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, Target, BookOpen, Users } from "lucide-react";
import SkillGapChart from "../components/Dashboard/SkillGapChart";
import StreakTracker from "../components/Dashboard/StreakTracker";
import RoadmapTimeline from "../components/Dashboard/RoadmapTimeline";
import { SkillGap, RoadmapItem } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  const loadDashboardData = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      // Load user profile
      const profileResponse = await axios.get("/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserProfile(profileResponse.data.profile);

      // Load analytics
      const analyticsResponse = await axios.get("/analytics/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(analyticsResponse.data.analytics);

      // Load roadmaps
      const roadmapsResponse = await axios.get("/roadmaps", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (roadmapsResponse.data.roadmaps.length > 0) {
        const latestRoadmap = roadmapsResponse.data.roadmaps[0];
        setRoadmapItems(latestRoadmap.items || []);
      }

      // Generate skill gaps from user skills
      if (profileResponse.data.profile.skills) {
        const gaps = profileResponse.data.profile.skills.map((skill: any) => {
          const currentLevel =
            skill.level === "beginner"
              ? 1
              : skill.level === "intermediate"
              ? 60
              : 90;
          const requiredLevel = 85; // Target level
          return {
            skill: skill.name,
            current: currentLevel,
            required: requiredLevel,
            gap: Math.max(0, requiredLevel - currentLevel),
          };
        });
        setSkillGaps(gaps);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Fallback to empty data
      setSkillGaps([]);
      setRoadmapItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRoadmapItem = async (id: string) => {
    try {
      // Find the roadmap that contains this item
      const roadmapsResponse = await axios.get("/roadmaps", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (roadmapsResponse.data.roadmaps.length > 0) {
        const roadmapId = roadmapsResponse.data.roadmaps[0].id;

        await axios.put(
          `/roadmaps/${roadmapId}/items/${id}/toggle`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Update local state
        setRoadmapItems((items) =>
          items.map((item) =>
            item.id === id ? { ...item, completed: !item.completed } : item
          )
        );
      }
    } catch (error) {
      console.error("Error toggling roadmap item:", error);
    }
  };

  const stats = [
    {
      title: "Skills Learned",
      value: userProfile?.skills?.length?.toString() || "0",
      change: "+2 this week",
      icon: BookOpen,
      color: "text-blue-600 bg-blue-100",
    },
    {
      title: "Career Progress",
      value: analytics?.overview?.avgSkillProgress
        ? `${Math.round(analytics.overview.avgSkillProgress)}%`
        : "0%",
      change: "+5% this month",
      icon: TrendingUp,
      color: "text-green-600 bg-green-100",
    },
    {
      title: "Goals Achieved",
      value: `${
        userProfile?.careerGoals?.filter((g: any) => g.completed)?.length || 0
      }/${userProfile?.careerGoals?.length || 0}`,
      change: "1 completed",
      icon: Target,
      color: "text-purple-600 bg-purple-100",
    },
    {
      title: "Chat Messages",
      value: analytics?.overview?.totalChatMessages?.toString() || "0",
      change: "+3 this week",
      icon: Users,
      color: "text-orange-600 bg-orange-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Career Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Track your progress and stay on top of your career goals
          </p>
        </div>

        {/* Stats
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {skillGaps.length > 0 && <SkillGapChart data={skillGaps} />}
            {roadmapItems.length > 0 && (
              <RoadmapTimeline
                items={roadmapItems}
                onToggleComplete={handleToggleRoadmapItem}
              />
            )}
            {skillGaps.length === 0 && roadmapItems.length === 0 && (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Get Started
                </h3>
                <p className="text-gray-600 mb-4">
                  Start by chatting with our AI assistant to create your
                  personalized career roadmap.
                </p>

                <Link
                  to="/chat"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Chat
                </Link>
              </div>
            )}
          </div>
          {/* Right Column */}
          <div className="space-y-8">
            <StreakTracker
              currentStreak={userProfile?.streak?.current || 0}
              longestStreak={userProfile?.streak?.longest || 0}
              completedDays={
                userProfile?.streak?.completedDays?.map(
                  (d: string) => new Date(d)
                ) || []
              }
            />

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <div className="font-medium text-blue-900">Update Skills</div>
                  <div className="text-sm text-blue-700">
                    Add new skills you've learned
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <div className="font-medium text-green-900">Find Jobs</div>
                  <div className="text-sm text-green-700">
                    Browse matched opportunities
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                  <div className="font-medium text-purple-900">
                    Chat with AI
                  </div>
                  <div className="text-sm text-purple-700">
                    Get career guidance
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
