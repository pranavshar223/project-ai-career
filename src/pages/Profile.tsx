import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Calendar, Book, Award, Target, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    },
    skills: [],
    careerGoals: [],
    preferences: {
      jobLocation: '',
      jobType: 'full-time',
      remoteWork: true,
      salaryRange: { min: 0, max: 0 }
    },
    streak: {
      current: 0,
      longest: 0,
      completedDays: []
    },
    createdAt: new Date(),
  });

  useEffect(() => {
    loadProfile();
  }, [token]);

  const loadProfile = async () => {
    if (!token) return;
    
    setIsLoading(true);
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
          },
          skills: response.data.profile.skills || [],
          careerGoals: response.data.profile.careerGoals || [],
          preferences: response.data.profile.preferences || {
            jobLocation: '',
            jobType: 'full-time',
            remoteWork: true,
            salaryRange: { min: 0, max: 0 }
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
      setIsLoading(false);
    }
  };

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

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) return;
    
    try {
      await axios.post('/users/skills', newSkill, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewSkill({ name: '', level: 'beginner', category: 'general' });
      loadProfile(); // Reload to get updated data
    } catch (error) {
      console.error('Error adding skill:', error);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      await axios.delete(`/users/skills/${skillId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      loadProfile(); // Reload to get updated data
    } catch (error) {
      console.error('Error removing skill:', error);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.title.trim()) return;
    
    try {
      await axios.post('/users/goals', newGoal, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewGoal({ title: '', description: '', priority: 'medium' });
      loadProfile(); // Reload to get updated data
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const handleRemoveGoal = async (goalId: string) => {
    try {
      await axios.delete(`/users/goals/${goalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      loadProfile(); // Reload to get updated data
    } catch (error) {
      console.error('Error removing goal:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your personal information and career preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 bg-blue-600 text-white rounded-full text-2xl font-bold mx-auto mb-4">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
              <p className="text-gray-600 mb-4">{profile.email}</p>
              <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                profile.background === 'student' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {profile.background === 'student' ? 'Student' : 'Professional'}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm">Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Book className="w-4 h-4 mr-2" />
                <span className="text-sm">{profile.profile.experience} experience</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Target className="w-4 h-4 mr-2" />
                <span className="text-sm">{profile.streak.current} day streak</span>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{profile.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.profile.location}
                      onChange={(e) => setProfile({
                        ...profile, 
                        profile: { ...profile.profile, location: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.profile.location || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  {isEditing ? (
                    <select
                      value={profile.profile.experience}
                      onChange={(e) => setProfile({
                        ...profile, 
                        profile: { ...profile.profile, experience: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="0-1 years">0-1 years</option>
                      <option value="2 years">2 years</option>
                      <option value="3-5 years">3-5 years</option>
                      <option value="5+ years">5+ years</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{profile.profile.experience}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                {isEditing ? (
                  <textarea
                    value={profile.profile.bio}
                    onChange={(e) => setProfile({
                      ...profile, 
                      profile: { ...profile.profile, bio: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile.profile.bio || 'No bio added yet'}</p>
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

            {/* Skills */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Book className="w-5 h-5 mr-2" />
                Current Skills
              </h3>
              
              {/* Add new skill */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Skill name"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={newSkill.level}
                    onChange={(e) => setNewSkill({...newSkill, level: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Category"
                    value={newSkill.category}
                    onChange={(e) => setNewSkill({...newSkill, category: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                {profile.skills.map((skill: any, index) => (
                  <div
                    key={skill._id || index}
                    className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    <span>{skill.name} ({skill.level})</span>
                    <button
                      onClick={() => handleRemoveSkill(skill._id)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Career Goals */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Career Goals
              </h3>
              
              {/* Add new goal */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Goal title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal({...newGoal, priority: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                {profile.careerGoals.map((goal: any, index) => (
                  <div key={goal._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 text-yellow-500 mr-2" />
                      <div>
                        <span className="text-gray-900 font-medium">{goal.title}</span>
                        {goal.description && (
                          <p className="text-sm text-gray-600">{goal.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveGoal(goal._id)}
                      className="text-red-600 hover:text-red-800"
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