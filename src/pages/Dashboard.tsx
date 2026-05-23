import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios, { AxiosError } from "axios";
import { TrendingUp, Target, BookOpen, Users, Plus, RefreshCw, AlertCircle } from "lucide-react";
import SkillGapChart from "../components/Dashboard/SkillGapChart";
import StreakTracker from "../components/Dashboard/StreakTracker";
import RoadmapTimeline from "../components/Dashboard/RoadmapTimeline";
import { SkillGap, Roadmap, RoadmapItem, Skill, User, DashboardAnalytics } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptationMessage, setAdaptationMessage] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Generate roadmap form state
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    careerGoal: "",
    targetRole: "",
    timeframe: "6-months"
  });

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadDashboardData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [profileRes, analyticsRes, roadmapsRes] = await Promise.all([
        axios.get("/users/profile", { headers: authHeaders }),
        axios.get("/analytics/dashboard", { headers: authHeaders }).catch(() => ({ data: { analytics: null } })),
        axios.get("/roadmaps", { headers: authHeaders })
      ]);

      setUserProfile(profileRes.data.profile);
      setAnalytics(analyticsRes.data.analytics);

      if (roadmapsRes.data.roadmaps.length > 0) {
        const latest = roadmapsRes.data.roadmaps[0];
        setActiveRoadmap(latest);
        setRoadmapItems(latest.items || []);
      }

      if (profileRes.data.profile.skills) {
        const gaps = profileRes.data.profile.skills.map((skill: Skill) => {
          const levelMap: Record<string, number> = { beginner: 20, intermediate: 60, advanced: 90 };
          const current = levelMap[skill.level] ?? 40;
          return {
            skill: skill.name,
            current,
            required: 85,
            gap: Math.max(0, 85 - current)
          };
        });
        setSkillGaps(gaps);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ─── Generate Roadmap ─────────────────────────────────────────
  const handleGenerateRoadmap = async () => {
    if (!generateForm.careerGoal.trim()) {
      setGenerateError("Please enter a career goal.");
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await axios.post(
        "/roadmaps/generate",
        generateForm,
        { headers: authHeaders }
      );
      const newRoadmap = res.data.roadmap;
      setActiveRoadmap(newRoadmap);
      setRoadmapItems(newRoadmap.items || []);
      setShowGenerateForm(false);
      setGenerateForm({ careerGoal: "", targetRole: "", timeframe: "6-months" });
    } catch (error) {
      setGenerateError(
        (error as AxiosError)?.response?.data?.error || (error as AxiosError)?.response?.data?.message || "Failed to generate roadmap. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Toggle Item (with auto-adapt) ───────────────────────────
  const handleToggleRoadmapItem = async (itemId: string) => {
    if (!activeRoadmap) return;

    // Optimistic update
    setRoadmapItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );

    try {
      const res = await axios.put(
        `/roadmaps/${activeRoadmap.id}/items/${itemId}/toggle`,
        { autoAdapt: true },
        { headers: authHeaders }
      );

      // If AI added new tasks, reload roadmap
      if (res.data.adaptationTriggered) {
        setIsAdapting(true);
        setAdaptationMessage("🤖 AI added new tasks based on your progress!");
        await loadDashboardData();
        setIsAdapting(false);
        setTimeout(() => setAdaptationMessage(null), 4000);
      } else {
        // Just update progress
        setActiveRoadmap((prev) => (prev ? { ...prev, progress: res.data.progress } : prev));
      }
    } catch (error) {
      // Revert optimistic update
      setRoadmapItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        )
      );
      console.error("Error toggling roadmap item:", error);
    }
  };

  // ─── Manual Adapt (for missed tasks) ─────────────────────────
  const handleAdaptMissed = async (itemId: string) => {
    if (!activeRoadmap) return;
    setIsAdapting(true);
    setAdaptationMessage(null);
    try {
      const res = await axios.post(
        `/roadmaps/${activeRoadmap.id}/adapt`,
        { triggerType: 'missed', itemId },
        { headers: authHeaders }
      );
      setAdaptationMessage(`🤖 ${res.data.adaptationReason}`);
      setActiveRoadmap(res.data.roadmap);
      setRoadmapItems(res.data.roadmap.items || []);
      setTimeout(() => setAdaptationMessage(null), 5000);
    } catch (error) {
      console.error("Error adapting roadmap:", error);
    } finally {
      setIsAdapting(false);
    }
  };

  const stats = [
    {
      title: "Skills Learned",
      value: userProfile?.skills?.length?.toString() || "0",
      change: "+2 this week",
      icon: BookOpen,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: "Career Progress",
      value: activeRoadmap?.progress?.percentage != null
        ? `${activeRoadmap.progress.percentage}%`
        : "0%",
      change: `${activeRoadmap?.progress?.completed || 0} tasks done`,
      icon: TrendingUp,
      color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      title: "Tasks Missed",
      value: activeRoadmap?.progress?.missed?.toString() || "0",
      change: "AI will adapt",
      icon: AlertCircle,
      color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
    },
    {
      title: "Chat Messages",
      value: analytics?.overview?.totalChatMessages?.toString() || "0",
      change: "+3 this week",
      icon: Users,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Career Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Track your progress and stay on top of your career goals</p>
          </div>
          <button
            onClick={() => setShowGenerateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {activeRoadmap ? "New Roadmap" : "Generate Roadmap"}
          </button>
        </div>

        {/* Adaptation Message */}
        {adaptationMessage && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
            <RefreshCw className={`w-5 h-5 text-blue-600 dark:text-blue-400 ${isAdapting ? 'animate-spin' : ''}`} />
            <p className="text-blue-800 dark:text-blue-300 font-medium">{adaptationMessage}</p>
          </div>
        )}

        {/* Generate Roadmap Modal */}
        {showGenerateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Generate Your Roadmap</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Career Goal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Data Scientist, Full Stack Developer"
                    value={generateForm.careerGoal}
                    onChange={e => setGenerateForm(f => ({ ...f, careerGoal: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Role <span className="text-gray-400 dark:text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ML Engineer at Google"
                    value={generateForm.targetRole}
                    onChange={e => setGenerateForm(f => ({ ...f, targetRole: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timeframe</label>
                  <select
                    value={generateForm.timeframe}
                    onChange={e => setGenerateForm(f => ({ ...f, timeframe: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="3-months">3 Months</option>
                    <option value="6-months">6 Months</option>
                    <option value="1-year">1 Year</option>
                    <option value="2-years">2 Years</option>
                  </select>
                </div>

                {generateError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {generateError}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowGenerateForm(false); setGenerateError(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateRoadmap}
                  disabled={isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
              </div>

              {isGenerating && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                  AI is building your personalized roadmap... this may take 10-20 seconds.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">{stat.change}</p>
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

            {roadmapItems.length > 0 ? (
              <div>
                {/* Roadmap header with adapt controls */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{activeRoadmap?.title}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeRoadmap?.progress?.completed}/{activeRoadmap?.progress?.total} tasks completed
                      {activeRoadmap?.progress?.missed > 0 && (
                        <span className="ml-2 text-red-500">· {activeRoadmap.progress.missed} missed</span>
                      )}
                    </p>
                  </div>
                  {activeRoadmap?.lastAdaptedAt && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                      AI adapted {new Date(activeRoadmap.lastAdaptedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Missed task alert with adapt button */}
                {roadmapItems.some((i: RoadmapItem) => (i as RoadmapItem & { status?: string }).status === 'missed') && (
                  <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <p className="text-orange-800 dark:text-orange-300 text-sm font-medium">
                        You have missed tasks. Let AI adapt your roadmap.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const missedItem = roadmapItems.find((i: RoadmapItem) => (i as RoadmapItem & { status?: string }).status === 'missed');
                        if (missedItem) handleAdaptMissed(missedItem.id);
                      }}
                      disabled={isAdapting}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-60 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAdapting ? 'animate-spin' : ''}`} />
                      Adapt Now
                    </button>
                  </div>
                )}

                <RoadmapTimeline
                  items={roadmapItems}
                  onToggleComplete={handleToggleRoadmapItem}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center transition-colors duration-200">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Roadmap Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Generate your personalized AI career roadmap to get started.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowGenerateForm(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Generate Roadmap
                  </button>
                  <Link
                    to="/chat"
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Ask AI in Chat
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <StreakTracker
              currentStreak={userProfile?.streak?.current || 0}
              longestStreak={userProfile?.streak?.longest || 0}
              completedDays={
                userProfile?.streak?.completedDays?.map((d: string) => new Date(d)) || []
              }
            />

            {/* Roadmap Phase Progress */}
            {roadmapItems.length > 0 && (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Phase Progress</h3>
                {['foundation', 'development', 'advanced', 'professional'].map(phase => {
                  const phaseItems = roadmapItems.filter((i: RoadmapItem) => (i as RoadmapItem & { phase?: string }).phase === phase);
                  if (phaseItems.length === 0) return null;
                  const done = phaseItems.filter(i => i.completed).length;
                  const pct = Math.round((done / phaseItems.length) * 100);
                  return (
                    <div key={phase} className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{phase}</span>
                        <span className="text-gray-500 dark:text-gray-400">{done}/{phaseItems.length}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <div
                          className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/profile">
                  <button className="w-full text-left p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors">
                    <div className="font-medium text-blue-900 dark:text-blue-300">Update Skills</div>
                    <div className="text-sm text-blue-700 dark:text-blue-400">Add new skills you've learned</div>
                  </button>
                </Link>
                <Link to="/jobs">
                  <button className="w-full text-left p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-colors">
                    <div className="font-medium text-green-900 dark:text-green-300">Find Jobs</div>
                    <div className="text-sm text-green-700 dark:text-green-400">Browse matched opportunities</div>
                  </button>
                </Link>
                <Link to="/chat">
                  <button className="w-full text-left p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors">
                    <div className="font-medium text-purple-900 dark:text-purple-300">Chat with AI</div>
                    <div className="text-sm text-purple-700 dark:text-purple-400">Get career guidance</div>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
