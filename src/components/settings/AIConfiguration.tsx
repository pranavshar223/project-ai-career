import React, { useState, useEffect } from 'react';
import { Cpu, Zap, BrainCircuit, FileJson, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  tier: string;
  reasoning: number;
  speed: number;
  structuredOutput: number;
  recommendedFor: string[];
  badges: string[];
}

interface AIPreferences {
  activeProvider: string;
  taskModels: {
    [key: string]: string;
  };
}

const AIConfiguration: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [preferences, setPreferences] = useState<AIPreferences>({ activeProvider: 'system_default', taskModels: {} });
  const [systemProvider, setSystemProvider] = useState<string>('');
  const [tasks, setTasks] = useState<{id: string, name: string, purpose: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [registryRes, prefsRes] = await Promise.all([
        axios.get('/ai-config/registry'),
        axios.get('/ai-config/preferences')
      ]);
      setModels(registryRes.data.models);
      setSystemProvider(registryRes.data.systemDefaultProvider);
      if (registryRes.data.tasks) setTasks(registryRes.data.tasks);
      
      const prefs = prefsRes.data;
      if (!prefs.taskModels) prefs.taskModels = {};
      setPreferences(prefs);
    } catch (error) {
      console.error('Error fetching AI config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = async (provider: string) => {
    try {
      setSaving(true);
      const res = await axios.put('/ai-config/preferences', { activeProvider: provider });
      setPreferences(res.data.settings);
    } catch (error) {
      console.error('Error updating provider:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleModelChange = async (taskType: string, modelId: string) => {
    try {
      setSaving(true);
      const newModels = { ...preferences.taskModels, [taskType]: modelId };
      const res = await axios.put('/ai-config/preferences', { taskModels: newModels });
      setPreferences(res.data.settings);
    } catch (error) {
      console.error('Error updating model:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreset = async (presetName: string) => {
    try {
      setSaving(true);
      const res = await axios.post('/ai-config/preferences/presets', { presetName });
      setPreferences(res.data.settings);
    } catch (error) {
      console.error('Error applying preset:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading AI Configuration...</div>;
  }

  const activeProvider = preferences.activeProvider === 'system_default' ? systemProvider : preferences.activeProvider;



  return (
    <div className="space-y-8 animate-fade-in">
      {/* Active Provider Status */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1 flex items-center">
              <Cpu className="w-6 h-6 mr-2" />
              Active AI Provider
            </h2>
            <p className="text-blue-100 mb-4 max-w-lg">
              {activeProvider === 'openrouter' 
                ? 'OpenRouter provides access to multiple free and premium AI models from various creators.'
                : 'Google Gemini provides native, highly-optimized Google models.'}
            </p>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium border border-white/30 backdrop-blur-sm flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Connected to {activeProvider === 'openrouter' ? 'OpenRouter' : 'Gemini'}
              </span>
            </div>
          </div>
          <div className="hidden sm:block">
            <select
              value={preferences.activeProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              disabled={saving}
              className="bg-white/10 border border-white/20 text-white text-sm rounded-lg focus:ring-white focus:border-white block w-full p-2.5 backdrop-blur-md appearance-none"
            >
              <option value="system_default" className="text-gray-900">System Default ({systemProvider})</option>
              <option value="openrouter" className="text-gray-900">Force OpenRouter</option>
              <option value="gemini" className="text-gray-900">Force Google Gemini</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recommended Presets */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommended Configurations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => handlePreset('balanced')}
            disabled={saving}
            className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col items-start group"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg mb-3 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Balanced Mode</h4>
            <p className="text-xs text-gray-500 mt-1">Best mix of speed and intelligence. Recommended for most users.</p>
          </button>
          <button 
            onClick={() => handlePreset('speed')}
            disabled={saving}
            className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-yellow-500 hover:shadow-md transition-all text-left flex flex-col items-start group"
          >
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg mb-3 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Speed Mode</h4>
            <p className="text-xs text-gray-500 mt-1">Uses the fastest models. Best for quick chats and low latency.</p>
          </button>
          <button 
            onClick={() => handlePreset('intelligence')}
            disabled={saving}
            className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-purple-500 hover:shadow-md transition-all text-left flex flex-col items-start group"
          >
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg mb-3 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Intelligence Mode</h4>
            <p className="text-xs text-gray-500 mt-1">Uses massive 30B+ parameters models for the highest quality outputs.</p>
          </button>
        </div>
      </div>

      {/* Current Model Assignments */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Task Assignments</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tasks.map(task => (
            <div key={task.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">{task.name}</h4>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 h-10">{task.purpose}</p>
              
              <div className="mt-auto">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Assigned Model</label>
                <select
                  value={preferences.taskModels[task.id] || ''}
                  onChange={(e) => handleModelChange(task.id, e.target.value)}
                  disabled={saving}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors"
                >
                  <option value="">System Recommended</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.tier === 'free' ? '(Free)' : '(Pro)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Models Library */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Models Library</h3>
        <div className="space-y-4">
          {models.map(model => (
            <div key={model.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{model.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${model.tier === 'free' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {model.tier.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{model.provider}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {model.badges.map(badge => (
                    <span key={badge} className="flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                      {badge === 'Fast' && <Zap className="w-3 h-3 mr-1" />}
                      {badge === 'High Reasoning' && <BrainCircuit className="w-3 h-3 mr-1" />}
                      {badge === 'Structured Output' && <FileJson className="w-3 h-3 mr-1" />}
                      {badge}
                    </span>
                  ))}
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Best for: </span>
                  {model.recommendedFor.map(r => r.replace('_', ' ')).join(', ')}
                </div>
              </div>

              <div className="flex gap-4 md:border-l md:border-gray-100 dark:md:border-gray-800 md:pl-6 min-w-[200px]">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Reasoning</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(model.reasoning / 10) * 100}%` }}></div>
                  </div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 text-right">{model.reasoning}/10</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Speed</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1">
                    <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${(model.speed / 10) * 100}%` }}></div>
                  </div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 text-right">{model.speed}/10</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIConfiguration;
