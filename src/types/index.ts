export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'professional' | 'career_switcher';
  onboardingCompleted: boolean;
  onboardingVersion?: number;
  journeyIntent?: 'focused' | 'exploring' | 'career_change';
  createdAt: Date;
  lastLogin?: Date;
}

export interface Skill {
  _id?: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

export interface CareerGoal {
  _id?: string;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  targetDate?: Date;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  type: 'skill' | 'project' | 'certification';
  duration: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url: string;
  posted: Date;
  matchScore: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: any;
}

export interface ApiChatMessage {
  id: string;
  content: string;
  role: string;
  timestamp: string;
  metadata?: any;
}

export interface SkillGap {
  skill: string;
  current: number;
  required: number;
  gap: number;
}

export interface RoadmapProgress {
  percentage: number;
  completed: number;
  missed: number;
}

export interface Roadmap {
  id: string;
  items: RoadmapItem[];
  progress?: RoadmapProgress;
  lastAdaptedAt?: string | Date;
  [key: string]: unknown;
}

export interface DashboardAnalyticsOverview {
  totalChatMessages: number;
}

export interface DashboardAnalytics {
  overview: DashboardAnalyticsOverview;
}