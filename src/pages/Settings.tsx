import React, { useState } from 'react';
import { Moon, Sun, Bell, Shield, Key, Smartphone, Monitor, BrainCircuit } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import AIConfiguration from '../components/settings/AIConfiguration';

const Settings: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('appearance');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your app preferences and account settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Navigation Sidebar for Settings */}
          <div className="space-y-1 md:col-span-1">
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'appearance' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <Monitor className="w-5 h-5" />
              <span>Appearance</span>
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'ai' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <BrainCircuit className="w-5 h-5" />
              <span>AI Configuration</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors opacity-50 cursor-not-allowed">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors opacity-50 cursor-not-allowed">
              <Shield className="w-5 h-5" />
              <span>Privacy & Security</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors opacity-50 cursor-not-allowed">
              <Key className="w-5 h-5" />
              <span>Account</span>
            </button>
          </div>

          {/* Settings Content */}
          <div className="md:col-span-3 space-y-6">
            {activeTab === 'appearance' && (
              <>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-200">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Appearance</h2>
                  
                  {/* Theme Toggle Section */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-yellow-500/10 text-yellow-600'}`}>
                        {isDark ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Adjust the appearance of the application</p>
                      </div>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button
                      onClick={toggleTheme}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                        isDark ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
                          isDark ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-200 opacity-60">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Interface Options</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                          <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Compact Mode</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Reduce spacing to fit more content</p>
                        </div>
                      </div>
                      <button className="relative inline-flex h-7 w-14 items-center rounded-full bg-gray-300 dark:bg-gray-700 transition-colors duration-300 cursor-not-allowed">
                        <span className="inline-block h-5 w-5 transform rounded-full bg-white translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'ai' && <AIConfiguration />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
