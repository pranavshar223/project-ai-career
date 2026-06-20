import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Loader2, Target, BrainCircuit, Compass, Check, SkipForward, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type QuestionType = 'mcq' | 'msq' | 'input' | 'textarea' | 'info' | 'success' | 'welcome';

interface Question {
  id: number;
  type: QuestionType;
  field?: string;
  title: string;
  description?: string;
  options?: string[];
  maxSelect?: number;
  required?: boolean;
  placeholder?: string;
}

const questions: Question[] = [
  {
    id: 0,
    type: 'welcome',
    title: 'Welcome to Your AI Career Assistant',
    description: 'Answer a few quick questions so I can understand your goals, experience, and interests. This helps me create a personalized roadmap designed specifically for you.',
  },
  {
    id: 1,
    type: 'mcq',
    field: 'userType',
    title: 'What best describes you today?',
    options: ['School Student', 'College Student', 'Recent Graduate', 'Working Professional', 'Career Switcher', 'Freelancer', 'Entrepreneur'],
    required: true,
  },
  {
    id: 2,
    type: 'msq',
    field: 'interests',
    title: 'Which fields are you interested in?',
    options: ['Software Development', 'Artificial Intelligence', 'Machine Learning', 'Data Science', 'Cybersecurity', 'Cloud Computing', 'DevOps', 'Mobile App Development', 'Web Development', 'UI/UX Design', 'Game Development', 'Blockchain', 'Embedded Systems', 'Robotics', 'Product Management', 'Startup & Entrepreneurship', 'Not Sure Yet'],
    maxSelect: 5,
    required: true,
  },
  {
    id: 3,
    type: 'mcq',
    field: 'primaryGoal',
    title: 'What is your primary goal right now?',
    options: ['Get My First Internship', 'Get My First Job', 'Switch Career', 'Crack Product-Based Companies', 'Become an AI Engineer', 'Become a Software Engineer', 'Become a Data Scientist', 'Become a Cybersecurity Expert', 'Build My Startup', 'Freelancing', 'Higher Studies', 'Research Career', 'Not Sure Yet'],
    required: true,
  },
  {
    id: 4,
    type: 'mcq',
    field: 'skillLevel',
    title: 'How would you rate your current skill level?',
    options: ['Complete Beginner', 'Know Basic Programming', 'Can Solve Simple Problems', 'Built Small Projects', 'Intermediate Developer', 'Advanced Developer'],
    required: true,
  },
  {
    id: 5,
    type: 'msq',
    field: 'knownSkills',
    title: 'Which technologies or programming languages do you already know?',
    options: ['C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'MongoDB', 'Git', 'Linux', 'HTML/CSS', 'Flutter', 'Django', 'Spring Boot', 'TensorFlow', 'PyTorch', 'None Yet'],
    required: false,
  },
  {
    id: 6,
    type: 'mcq',
    field: 'weeklyTime',
    title: 'How much time can you dedicate each week?',
    options: ['Less Than 5 Hours', '5-10 Hours', '10-20 Hours', '20-30 Hours', 'More Than 30 Hours'],
    required: true,
  },
  {
    id: 7,
    type: 'msq',
    field: 'challenges',
    title: 'What are your biggest challenges?',
    options: ["Don't Know Where To Start", 'Lack Consistency', 'DSA Problems', 'Programming Fundamentals', 'Building Projects', 'Resume Preparation', 'Interview Preparation', 'English Communication', 'Confidence', 'Finding Internships', 'Finding Jobs', 'Networking', 'Time Management', 'Learning Too Many Things', 'No Guidance'],
    maxSelect: 3,
    required: true,
  },
  {
    id: 8,
    type: 'mcq',
    field: 'careerConfidence',
    title: 'How confident are you about your career path?',
    options: ['Completely Lost', 'Somewhat Confused', 'Have Basic Direction', 'Mostly Clear', 'Very Clear'],
    required: true,
  },
  {
    id: 9,
    type: 'info',
    title: 'Help me personalize your roadmap even further.',
    description: 'The next few questions are optional but will greatly improve your recommendations.',
  },
  {
    id: 10,
    type: 'input',
    field: 'institution',
    title: 'Which college, school, or institution are you studying at?',
    placeholder: 'e.g., Stanford University',
    required: false,
  },
  {
    id: 11,
    type: 'input',
    field: 'graduationYear',
    title: 'What is your graduation year?',
    placeholder: 'e.g., 2025',
    required: false,
  },
  {
    id: 12,
    type: 'msq',
    field: 'preferredCompanyTypes',
    title: 'What kind of companies would you like to work for?',
    options: ['Startups', 'Product-Based Companies', 'Service-Based Companies', 'MNCs', 'Research Labs', 'Government Organizations', 'Freelancing', 'Own Startup'],
    required: false,
  },
  {
    id: 13,
    type: 'input',
    field: 'dreamCompanies',
    title: 'What are your dream companies?',
    placeholder: 'Google, Microsoft, NVIDIA, OpenAI, Amazon',
    required: false,
  },
  {
    id: 14,
    type: 'mcq',
    field: 'learningStyle',
    title: 'What is your preferred learning style?',
    options: ['Video Tutorials', 'Reading Articles', 'Documentation', 'Hands-On Projects', 'Mentor Guidance', 'Community Learning'],
    required: false,
  },
  {
    id: 15,
    type: 'textarea',
    field: 'careerGoalDesc',
    title: 'Describe your career goal in one sentence.',
    placeholder: 'I want to become an AI Engineer and get an internship within 12 months.',
    required: false,
  },
  {
    id: 16,
    type: 'success',
    title: 'Your Career Profile Is Ready',
    description: "Your profile is saved! Head to the dashboard to view your stats, or go to the chat to generate your roadmap.",
  }
];

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { completeOnboarding, user } = useAuth();

  // Load existing answers on mount
  useEffect(() => {
    if (user?.onboardingProfile) {
      setAnswers(user.onboardingProfile);
      // Optional: fast-forward step based on missing required fields
    }
  }, [user]);

  const currentQ = questions[step];
  
  // Calculate Progress (excluding welcome and success steps)
  const totalSteps = questions.filter(q => q.field).length;
  const currentStep = questions.slice(0, step + 1).filter(q => q.field).length;
  const progressPercent = Math.max(0, Math.min(100, (currentStep / totalSteps) * 100));

  const saveProgress = async (newAnswers: Record<string, string | string[]>, isFinal = false) => {
    const res = await axios.post('/users/onboarding', {
      ...newAnswers,
      ...(isFinal ? { onboardingCompleted: true } : {})
    });
    return res.data;
  };

  const handleNext = async () => {
    setError('');
    
    // Validation
    if (currentQ.required && currentQ.field) {
      const val = answers[currentQ.field];
      if (!val || (Array.isArray(val) && val.length === 0)) {
        setError('This question is required. Please provide an answer.');
        return;
      }
    }

    // Auto-save progress in background
    if (currentQ.field) {
      saveProgress({ [currentQ.field]: answers[currentQ.field] }).catch(err => {
        console.error('Failed to auto-save onboarding progress', err);
      });
    }

    if (step < questions.length - 1) {
      setStep(prev => prev + 1);
    }
  };

  const handleSkipOptionalSection = () => {
    // Jump straight to success screen
    setStep(questions.length - 1);
  };

  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Final save marking as completed
      const data = await saveProgress(answers, true);
      
      if (data.user) {
        completeOnboarding(data.user);
        navigate('/dashboard'); 
      } else {
        throw new Error('No user data returned');
      }
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(errorResponse.response?.data?.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleOptionToggle = (option: string) => {
    if (!currentQ.field) return;

    if (currentQ.type === 'mcq') {
      setAnswers(prev => ({ ...prev, [currentQ.field!]: option }));
      // Auto-advance for MCQ if we want, but let's stick to explicit Continue button to avoid misclicks
    } else if (currentQ.type === 'msq') {
      setAnswers(prev => {
        const currentArr = (prev[currentQ.field!] as string[]) || [];
        if (currentArr.includes(option)) {
          return { ...prev, [currentQ.field!]: currentArr.filter(item => item !== option) };
        } else {
          if (currentQ.maxSelect && currentArr.length >= currentQ.maxSelect) {
            return prev; // Do nothing if max reached
          }
          return { ...prev, [currentQ.field!]: [...currentArr, option] };
        }
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!currentQ.field) return;
    setAnswers(prev => ({ ...prev, [currentQ.field!]: e.target.value }));
  };

  const isCurrentValid = () => {
    if (!currentQ.required) return true;
    if (!currentQ.field) return true;
    const val = answers[currentQ.field];
    return val && (!Array.isArray(val) || val.length > 0);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 sm:p-8 font-sans">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-indigo-900/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-violet-900/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header & Progress Bar */}
      {currentQ.type !== 'welcome' && currentQ.type !== 'success' && (
        <div className="w-full max-w-3xl mb-8 relative z-10 pt-4">
          <div className="flex items-center justify-between mb-2 text-sm text-slate-400 font-medium">
            <button 
              onClick={() => setStep(prev => Math.max(0, prev - 1))}
              className="flex items-center hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </button>
            <span>{currentStep} of {totalSteps}</span>
            <span className="text-indigo-400">~ 1 Min</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 w-full flex items-center justify-center relative z-10">
        <div className="w-full max-w-2xl">
          <div className="relative group">
            {/* Glowing Border Pattern (only for welcome/success) */}
            {(currentQ.type === 'welcome' || currentQ.type === 'success') && (
              <div className="absolute -inset-[3px] bg-gradient-to-r from-cyan-400 via-violet-600 to-fuchsia-600 rounded-3xl opacity-50 blur-lg group-hover:opacity-75 transition duration-500 animate-pulse"></div>
            )}

            <div className={`relative bg-slate-900/80 backdrop-blur-sm border border-slate-800 ${currentQ.type === 'welcome' || currentQ.type === 'success' ? 'rounded-3xl p-8 sm:p-12 shadow-2xl text-center' : 'rounded-3xl p-6 sm:p-10'}`}>
              
              {/* Special Screens: Welcome & Info & Success */}
              {(currentQ.type === 'welcome' || currentQ.type === 'info' || currentQ.type === 'success') && (
                <div className="text-center animate-in fade-in zoom-in duration-500">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800/50 rounded-2xl border border-indigo-500/30 text-indigo-400 mb-8 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    {currentQ.type === 'welcome' && <BrainCircuit className="w-10 h-10" />}
                    {currentQ.type === 'info' && <Compass className="w-10 h-10" />}
                    {currentQ.type === 'success' && <Target className="w-10 h-10" />}
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                    {currentQ.title}
                  </h1>
                  <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto">
                    {currentQ.description}
                  </p>

                  {currentQ.type === 'info' && (
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <button
                        onClick={handleSkipOptionalSection}
                        className="px-6 py-4 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <SkipForward className="w-5 h-5" /> Skip Optional Section
                      </button>
                      <button
                        onClick={handleNext}
                        className="bg-indigo-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
                      >
                        Continue <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {currentQ.type === 'welcome' && (
                    <button
                      onClick={handleNext}
                      className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-slate-900 py-4 px-10 rounded-xl font-bold text-lg hover:bg-slate-100 transition-colors shadow-lg shadow-white/10 group"
                    >
                      Start
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  {currentQ.type === 'success' && (
                    <button
                      onClick={handleCompleteOnboarding}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 px-10 rounded-xl font-bold text-lg hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 group"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
                      ) : (
                        <>Go to Dashboard <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Question Screens */}
              {currentQ.type !== 'welcome' && currentQ.type !== 'info' && currentQ.type !== 'success' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {currentQ.title}
                  </h2>
                  <div className="flex items-center justify-between mb-8">
                    {currentQ.maxSelect && (
                      <p className="text-indigo-400 text-sm font-medium">Select up to {currentQ.maxSelect}</p>
                    )}
                    {!currentQ.required && (
                      <span className="text-slate-500 text-sm bg-slate-800 px-3 py-1 rounded-full">Optional</span>
                    )}
                  </div>

                  {error && (
                    <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-sm text-center">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {currentQ.options && (currentQ.type === 'mcq' || currentQ.type === 'msq') && (
                      <div className={currentQ.options.length > 8 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-3"}>
                        {currentQ.options.map(option => {
                          const isSelected = currentQ.type === 'mcq' 
                            ? answers[currentQ.field!] === option
                            : ((answers[currentQ.field!] as string[]) || []).includes(option);

                          return (
                            <button
                              key={option}
                              onClick={() => handleOptionToggle(option)}
                              className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group ${
                                isSelected
                                  ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                              }`}
                            >
                              <span className={`font-medium ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                {option}
                              </span>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isSelected 
                                  ? 'bg-indigo-500 border-indigo-500' 
                                  : 'border-slate-600 group-hover:border-slate-500'
                              }`}>
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {currentQ.type === 'input' && (
                      <input
                        type="text"
                        value={answers[currentQ.field!] || ''}
                        onChange={handleInputChange}
                        placeholder={currentQ.placeholder}
                        className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-6 py-5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-lg"
                        autoFocus
                      />
                    )}

                    {currentQ.type === 'textarea' && (
                      <textarea
                        value={answers[currentQ.field!] || ''}
                        onChange={handleInputChange}
                        placeholder={currentQ.placeholder}
                        rows={4}
                        className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-6 py-5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-lg resize-none"
                        autoFocus
                      />
                    )}
                  </div>

                  <div className="mt-10 flex items-center gap-4">
                    {!currentQ.required && currentQ.field && (!answers[currentQ.field] || answers[currentQ.field].length === 0) && (
                      <button
                        onClick={handleNext}
                        className="px-6 py-4 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        Skip
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      disabled={!isCurrentValid()}
                      className={`flex-1 flex items-center justify-center py-4 px-8 rounded-xl font-bold text-lg transition-all ${
                        isCurrentValid() 
                          ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-white/5 group' 
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Continue
                      {isCurrentValid() && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
