import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User, Calendar, Book, Award, Target, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Skill, CareerGoal } from '../types';

const Profile: React.FC = () => {
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingOnboarding, setIsEditingOnboarding] = useState(false);
  const [isEditingEdu, setIsEditingEdu] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'beginner', category: 'general' });
  const [newGoal, setNewGoal] = useState({ title: '', description: '', priority: 'medium' });

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    background: 'professional',
    profile: {
      bio: '',
      location: '',
      website: '',
      experience: '0-1 years',
      interests: [],
      learningStyle: '',
      weeklyTime: 0,
      confidenceLevel: '',
      institution: '',
      graduationYear: 0,
      challenges: []
    },
    skills: [],
    careerGoals: [],
    preferences: {
      jobLocation: '',
      jobType: 'full-time',
      remoteWork: true,
      salaryRange: { min: 0, max: 0 },
      preferredCompanyTypes: [],
      dreamCompanies: ''
    },
    streak: {
      current: 0,
      longest: 0,
      completedDays: []
    },
    createdAt: new Date(),
  });

  const loadProfile = useCallback(async (silent = false) => {
    if (!token) return;

    if (!silent) setIsInitialLoading(true);
    try {
      const response = await axios.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.profile) {
        setProfile({
          ...response.data.profile,
          profile: response.data.profile.profile || {
            bio: '',
            location: '',
            website: '',
            experience: '0-1 years',
            interests: [],
            learningStyle: '',
            weeklyTime: 0,
            confidenceLevel: '',
            institution: '',
            graduationYear: 0,
            challenges: []
          },
          skills: response.data.profile.skills || [],
          careerGoals: response.data.profile.careerGoals || [],
          preferences: response.data.profile.preferences || {
            jobLocation: '',
            jobType: 'full-time',
            remoteWork: true,
            salaryRange: { min: 0, max: 0 },
            preferredCompanyTypes: [],
            dreamCompanies: ''
          },
          streak: response.data.profile.streak || {
            current: 0,
            longest: 0,
            completedDays: []
          }
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      if (!silent) setIsInitialLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    try {
      await axios.put('/users/profile', {
        name: profile.name,
        profile: profile.profile
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleSaveOnboarding = async () => {
    setIsSaving(true);
    try {
      await axios.put('/users/profile', {
        profile: profile.profile
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditingOnboarding(false);
    } catch (error) {
      console.error('Error saving career preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdu = async () => {
    setIsSaving(true);
    try {
      await axios.put('/users/profile', {
        profile: profile.profile
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditingEdu(false);
    } catch (error) {
      console.error('Error saving education:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    setIsSaving(true);
    try {
      await axios.put('/users/preferences', profile.preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditingCompany(false);
    } catch (error) {
      console.error('Error saving company preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) return;
    setIsSaving(true);
    try {
      await axios.post('/users/skills', newSkill, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewSkill({ name: '', level: 'beginner', category: 'general' });
      await loadProfile(true); // silent refresh
    } catch (error) {
      console.error('Error adding skill:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    // Optimistic update — remove immediately from UI
    setProfile(prev => ({ ...prev, skills: prev.skills.filter((s: Skill) => s._id !== skillId) }));
    try {
      const res = await axios.delete(`/users/skills/${skillId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sync with the authoritative list the server just returned
      if (res.data.skills) {
        setProfile(prev => ({ ...prev, skills: res.data.skills }));
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      await loadProfile(true); // revert on error
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.title.trim()) return;
    // Optimistic update — show new goal immediately with a temp id
    const tempGoal = { ...newGoal, _id: `temp_${Date.now()}` };
    setProfile(prev => ({ ...prev, careerGoals: [...prev.careerGoals, tempGoal] }));
    setNewGoal({ title: '', description: '', priority: 'medium' });
    setIsSaving(true);
    try {
      const res = await axios.post('/users/goals', newGoal, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Replace temp entry with the real goal returned by the server
      if (res.data.goal) {
        setProfile(prev => ({
          ...prev,
          careerGoals: prev.careerGoals.map((g: CareerGoal) =>
            g._id === tempGoal._id ? res.data.goal : g
          )
        }));
      }
    } catch (error) {
      console.error('Error adding goal:', error);
      // Revert optimistic update on failure
      setProfile(prev => ({ ...prev, careerGoals: prev.careerGoals.filter((g: CareerGoal) => g._id !== tempGoal._id) }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveGoal = async (goalId: string) => {
    // Optimistic update — remove immediately from UI
    setProfile(prev => ({ ...prev, careerGoals: prev.careerGoals.filter((g: CareerGoal) => g._id !== goalId) }));
    try {
      const res = await axios.delete(`/users/goals/${goalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sync with the authoritative list the server just returned
      if (res.data.careerGoals) {
        setProfile(prev => ({ ...prev, careerGoals: res.data.careerGoals }));
      }
    } catch (error) {
      console.error('Error removing goal:', error);
      await loadProfile(true); // revert on error
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your personal information and career preferences</p>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Saving...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit transition-colors duration-200">
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 bg-blue-600 text-white rounded-full text-2xl font-bold mx-auto mb-4">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{profile.name}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{profile.email}</p>
              <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                profile.role === 'student'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                  : profile.role === 'career_switcher'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                }`}>
                {profile.role === 'student' ? 'Student' : profile.role === 'career_switcher' ? 'Career Switcher' : 'Professional'}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm">Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Book className="w-4 h-4 mr-2" />
                <span className="text-sm">{profile.profile.experience} experience</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Target className="w-4 h-4 mr-2" />
                <span className="text-sm">{profile.streak.current} day streak</span>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Basic Information
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className={inputClass}
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{profile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <p className="text-gray-900 dark:text-gray-100">{profile.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.profile.location}
                      onChange={(e) => setProfile({
                        ...profile,
                        profile: { ...profile.profile, location: e.target.value }
                      })}
                      className={inputClass}
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{profile.profile.location || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience</label>
                  {isEditing ? (
                    <select
                      value={profile.profile.experience}
                      onChange={(e) => setProfile({
                        ...profile,
                        profile: { ...profile.profile, experience: e.target.value }
                      })}
                      className={inputClass}
                    >
                      <option value="0-1 years">0-1 years</option>
                      <option value="2 years">2 years</option>
                      <option value="3-5 years">3-5 years</option>
                      <option value="5+ years">5+ years</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{profile.profile.experience}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                {isEditing ? (
                  <textarea
                    value={profile.profile.bio}
                    onChange={(e) => setProfile({
                      ...profile,
                      profile: { ...profile.profile, bio: e.target.value }
                    })}
                    rows={3}
                    className={inputClass}
                  />
                ) : (
                  <p className="text-gray-900 dark:text-gray-100">{profile.profile.bio || 'No bio added yet'}</p>
                )}
              </div>

              {isEditing && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Education & Challenges */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Book className="w-5 h-5 mr-2 text-blue-500" />
                  Education & Challenges
                </h3>
                <button
                  onClick={() => setIsEditingEdu(!isEditingEdu)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditingEdu ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Institution</label>
                  {isEditingEdu ? (
                    <input
                      type="text"
                      value={profile.profile.institution}
                      onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, institution: e.target.value } })}
                      className={inputClass}
                      placeholder="e.g., Stanford University"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{profile.profile.institution || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Graduation Year</label>
                  {isEditingEdu ? (
                    <input
                      type="number"
                      value={profile.profile.graduationYear || ''}
                      onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, graduationYear: parseInt(e.target.value) || 0 } })}
                      className={inputClass}
                      placeholder="e.g., 2025"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{profile.profile.graduationYear || 'Not specified'}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Current Challenges</label>
                {isEditingEdu ? (
                  <input
                    type="text"
                    value={profile.profile.challenges?.join(', ') || ''}
                    onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, challenges: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })}
                    className={inputClass}
                    placeholder="e.g., Finding Internships, DSA Problems"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.profile.challenges && profile.profile.challenges.length > 0 ? (
                      profile.profile.challenges.map((ch: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-medium">{ch}</span>
                      ))
                    ) : (
                      <p className="text-gray-900 dark:text-gray-100">None specified</p>
                    )}
                  </div>
                )}
              </div>

              {isEditingEdu && (
                <div className="mt-6 flex justify-end">
                  <button onClick={handleSaveEdu} disabled={isSaving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* Company Preferences */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-500" />
                  Company Preferences
                </h3>
                <button
                  onClick={() => setIsEditingCompany(!isEditingCompany)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditingCompany ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Dream Companies</label>
                  {isEditingCompany ? (
                    <input
                      type="text"
                      value={profile.preferences.dreamCompanies}
                      onChange={(e) => setProfile({ ...profile, preferences: { ...profile.preferences, dreamCompanies: e.target.value } })}
                      className={inputClass}
                      placeholder="e.g., Google, Microsoft, OpenAI"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100">{profile.preferences.dreamCompanies || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Preferred Company Types</label>
                  {isEditingCompany ? (
                    <input
                      type="text"
                      value={profile.preferences.preferredCompanyTypes?.join(', ') || ''}
                      onChange={(e) => setProfile({ ...profile, preferences: { ...profile.preferences, preferredCompanyTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })}
                      className={inputClass}
                      placeholder="e.g., Startups, Product-Based Companies"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.preferences.preferredCompanyTypes && profile.preferences.preferredCompanyTypes.length > 0 ? (
                        profile.preferences.preferredCompanyTypes.map((type: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium">{type}</span>
                        ))
                      ) : (
                        <p className="text-gray-900 dark:text-gray-100">Not specified</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {isEditingCompany && (
                <div className="mt-6 flex justify-end">
                  <button onClick={handleSaveCompany} disabled={isSaving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Book className="w-5 h-5 mr-2" />
                Current Skills
              </h3>

              {/* Add new skill */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Skill name"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    className={inputClass}
                  />
                  <select
                    value={newSkill.level}
                    onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                    className={inputClass}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Category"
                    value={newSkill.category}
                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                    className={inputClass}
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: Skill, index) => (
                  <div
                    key={skill._id || index}
                    className="flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium"
                  >
                    <span>{skill.name} ({skill.level})</span>
                    <button
                      onClick={() => {
                        console.log("Clicked delete for", skill._id);
                        handleRemoveSkill(skill._id);
                      }}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Career Goals */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Career Goals
              </h3>

              {/* Add new goal */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Goal title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    className={inputClass}
                  />
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                    className={inputClass}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <button
                    onClick={handleAddGoal}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {profile.careerGoals.map((goal: CareerGoal, index) => (
                  <div key={goal._id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 text-yellow-500 mr-2" />
                      <div>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">{goal.title}</span>
                        {goal.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveGoal(goal._id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;