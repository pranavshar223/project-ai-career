export interface User {
  id: string;
  email: string;
  name: string;
  background: 'student' | 'professional';
  createdAt: Date;
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

export interface CareerGoal {
  title: string;
  description: string;
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
}

export interface SkillGap {
  skill: string;
  current: number;
  required: number;
  gap: number;
}