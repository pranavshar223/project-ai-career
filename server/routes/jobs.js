const express = require('express');
const axios = require('axios');
const Job = require('../models/Job');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/jobs/search
// @desc    Search for jobs using external API and return personalized results
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const {
      query = '',
      location = '',
      page = 1,
      limit = 20,
      jobType = '',
      remote = false
    } = req.query;

    const user = await User.findById(req.user._id);
    
    // If no query provided, use user's career goals or skills
    let searchQuery = query;
    if (!searchQuery && user.careerGoals.length > 0) {
      searchQuery = user.careerGoals[0].title;
    } else if (!searchQuery && user.skills.length > 0) {
      searchQuery = user.skills.map(s => s.name).join(' ');
    }

    // Use user's location preference if no location specified
    let searchLocation = location;
    if (!searchLocation && user.preferences?.jobLocation) {
      searchLocation = user.preferences.jobLocation;
    }

    // Fetch jobs from external API
    const jobs = await fetchJobsFromAPI({
      query: searchQuery,
      location: searchLocation,
      page: parseInt(page),
      limit: parseInt(limit),
      jobType,
      remote: remote === 'true'
    });

    // Calculate match scores for each job
    const jobsWithScores = jobs.map(job => ({
      ...job,
      matchScore: calculateMatchScore(job, user)
    }));

    // Sort by match score
    jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      jobs: jobsWithScores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: jobsWithScores.length
      },
      searchParams: {
        query: searchQuery,
        location: searchLocation,
        jobType,
        remote
      }
    });
  } catch (error) {
    console.error('Job search error:', error);
    res.status(500).json({
      message: 'Error searching for jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/jobs/recommendations
// @desc    Get personalized job recommendations
// @access  Private
router.get('/recommendations', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const user = await User.findById(req.user._id);

    // Get recommendations based on user profile
    const recommendations = await getPersonalizedRecommendations(user, parseInt(limit));

    res.json({
      recommendations,
      message: `Found ${recommendations.length} personalized job recommendations`
    });
  } catch (error) {
    console.error('Job recommendations error:', error);
    res.status(500).json({
      message: 'Error fetching job recommendations'
    });
  }
});

// @route   POST /api/jobs/save
// @desc    Save a job for later
// @access  Private
router.post('/save', auth, async (req, res) => {
  try {
    const { jobId, source = 'external' } = req.body;

    if (!jobId) {
      return res.status(400).json({
        message: 'Job ID is required'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Initialize savedJobs array if it doesn't exist
    if (!user.savedJobs) {
      user.savedJobs = [];
    }

    // Check if job is already saved
    const isAlreadySaved = user.savedJobs.some(
      savedJob => savedJob.jobId === jobId && savedJob.source === source
    );

    if (isAlreadySaved) {
      return res.status(400).json({
        message: 'Job is already saved'
      });
    }

    // Add job to saved list
    user.savedJobs.push({
      jobId,
      source,
      savedAt: new Date()
    });

    await user.save();

    res.json({
      message: 'Job saved successfully'
    });
  } catch (error) {
    console.error('Save job error:', error);
    res.status(500).json({
      message: 'Error saving job'
    });
  }
});

// @route   GET /api/jobs/saved
// @desc    Get user's saved jobs
// @access  Private
router.get('/saved', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const savedJobs = user.savedJobs || [];

    // For now, return the saved job IDs
    // In a real implementation, you'd fetch full job details
    res.json({
      savedJobs: savedJobs.map(job => ({
        jobId: job.jobId,
        source: job.source,
        savedAt: job.savedAt
      }))
    });
  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({
      message: 'Error fetching saved jobs'
    });
  }
});

// @route   DELETE /api/jobs/saved/:jobId
// @desc    Remove job from saved list
// @access  Private
router.delete('/saved/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { source = 'external' } = req.query;

    const user = await User.findById(req.user._id);
    
    if (!user.savedJobs) {
      return res.status(404).json({
        message: 'No saved jobs found'
      });
    }

    // Remove job from saved list
    user.savedJobs = user.savedJobs.filter(
      savedJob => !(savedJob.jobId === jobId && savedJob.source === source)
    );

    await user.save();

    res.json({
      message: 'Job removed from saved list'
    });
  } catch (error) {
    console.error('Remove saved job error:', error);
    res.status(500).json({
      message: 'Error removing saved job'
    });
  }
});

// Helper function to fetch jobs from external API
async function fetchJobsFromAPI(params) {
  try {
    // Check if RapidAPI key is available
    if (!process.env.RAPIDAPI_KEY) {
      console.log('No RapidAPI key found, using mock data');
      return getMockJobs(params);
    }

    // Example using Adzuna API via RapidAPI
    const response = await axios.get('https://api.adzuna.com/v1/api/jobs/us/search/1', {
      params: {
        app_id: process.env.ADZUNA_APP_ID,
        app_key: process.env.ADZUNA_API_KEY,
        what: params.query,
        where: params.location,
        results_per_page: params.limit,
        page: params.page
      },
      timeout: 10000
    });

    return response.data.results.map(job => ({
      id: job.id.toString(),
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      salary: job.salary_min && job.salary_max ? 
        `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}` : null,
      applyUrl: job.redirect_url,
      postedDate: new Date(job.created),
      source: 'adzuna',
      remote: job.location.display_name.toLowerCase().includes('remote'),
      jobType: 'full-time'
    }));
  } catch (error) {
    console.error('External API error:', error.message);
    // Fallback to mock data
    return getMockJobs(params);
  }
}

// Mock job data for development/fallback
function getMockJobs(params) {
  const mockJobs = [
    {
      id: '1',
      title: 'Senior Data Scientist',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      description: 'We are seeking a Senior Data Scientist to join our AI/ML team. You will work on cutting-edge machine learning projects, develop predictive models, and drive data-driven decision making across the organization. Requirements include Python, SQL, machine learning frameworks, and 3+ years of experience.',
      salary: '$120,000 - $160,000',
      applyUrl: 'https://example.com/apply/1',
      postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      source: 'mock',
      remote: false,
      jobType: 'full-time'
    },
    {
      id: '2',
      title: 'Machine Learning Engineer',
      company: 'AI Innovations',
      location: 'Remote',
      description: 'Join our ML engineering team to build and deploy scalable machine learning systems. Experience with Python, TensorFlow, PyTorch, and cloud platforms required. You will work on model deployment, MLOps, and system optimization.',
      salary: '$100,000 - $140,000',
      applyUrl: 'https://example.com/apply/2',
      postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      source: 'mock',
      remote: true,
      jobType: 'full-time'
    },
    {
      id: '3',
      title: 'Frontend Developer',
      company: 'WebTech Solutions',
      location: 'New York, NY',
      description: 'Looking for a skilled Frontend Developer to build responsive web applications using React, TypeScript, and modern CSS frameworks. Experience with state management, testing, and performance optimization preferred.',
      salary: '$80,000 - $110,000',
      applyUrl: 'https://example.com/apply/3',
      postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      source: 'mock',
      remote: false,
      jobType: 'full-time'
    },
    {
      id: '4',
      title: 'Data Analyst',
      company: 'DataDriven Solutions',
      location: 'Chicago, IL',
      description: 'Seeking a detail-oriented Data Analyst to analyze business metrics, create reports, and provide insights to stakeholders. Strong SQL, Excel, and Python skills required. Experience with Tableau or Power BI is a plus.',
      salary: '$70,000 - $90,000',
      applyUrl: 'https://example.com/apply/4',
      postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      source: 'mock',
      remote: false,
      jobType: 'full-time'
    },
    {
      id: '5',
      title: 'Full Stack Developer',
      company: 'StartupTech',
      location: 'Austin, TX',
      description: 'Join our growing startup as a Full Stack Developer. Work with React, Node.js, MongoDB, and AWS. Perfect opportunity to wear multiple hats and make a significant impact on product development.',
      salary: '$85,000 - $115,000',
      applyUrl: 'https://example.com/apply/5',
      postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      source: 'mock',
      remote: true,
      jobType: 'full-time'
    }
  ];

  // Filter based on search parameters
  let filteredJobs = mockJobs;

  if (params.query) {
    const queryLower = params.query.toLowerCase();
    filteredJobs = filteredJobs.filter(job => 
      job.title.toLowerCase().includes(queryLower) ||
      job.description.toLowerCase().includes(queryLower)
    );
  }

  if (params.location) {
    const locationLower = params.location.toLowerCase();
    filteredJobs = filteredJobs.filter(job => 
      job.location.toLowerCase().includes(locationLower)
    );
  }

  if (params.remote) {
    filteredJobs = filteredJobs.filter(job => job.remote);
  }

  return filteredJobs;
}

// Calculate match score between job and user profile
function calculateMatchScore(job, user) {
  let score = 0;
  let factors = {
    skillMatch: 0,
    locationMatch: 0,
    experienceMatch: 0,
    salaryMatch: 0
  };

  // Skill matching (40% weight)
  if (user.skills && user.skills.length > 0) {
    const userSkills = user.skills.map(s => s.name.toLowerCase());
    const jobText = (job.title + ' ' + job.description).toLowerCase();
    
    const matchingSkills = userSkills.filter(skill => 
      jobText.includes(skill)
    );
    
    factors.skillMatch = (matchingSkills.length / userSkills.length) * 100;
    score += factors.skillMatch * 0.4;
  }

  // Location matching (20% weight)
  if (user.preferences?.jobLocation) {
    const userLocation = user.preferences.jobLocation.toLowerCase();
    const jobLocation = job.location.toLowerCase();
    
    if (jobLocation.includes(userLocation) || jobLocation.includes('remote')) {
      factors.locationMatch = 100;
      score += 100 * 0.2;
    } else {
      factors.locationMatch = 0;
    }
  } else {
    factors.locationMatch = 50; // Neutral if no preference
    score += 50 * 0.2;
  }

  // Experience matching (20% weight)
  const jobTitle = job.title.toLowerCase();
  if (user.profile?.experience) {
    const experience = user.profile.experience;
    
    if (jobTitle.includes('senior') || jobTitle.includes('lead')) {
      factors.experienceMatch = experience.includes('5+') ? 100 : 30;
    } else if (jobTitle.includes('junior') || jobTitle.includes('entry')) {
      factors.experienceMatch = experience.includes('0-1') || experience.includes('2') ? 100 : 70;
    } else {
      factors.experienceMatch = 70; // Mid-level
    }
    
    score += factors.experienceMatch * 0.2;
  }

  // Salary matching (20% weight)
  if (job.salary && user.preferences?.salaryRange) {
    // This is a simplified salary matching logic
    factors.salaryMatch = 75; // Assume reasonable match
    score += factors.salaryMatch * 0.2;
  } else {
    factors.salaryMatch = 50; // Neutral if no salary info
    score += 50 * 0.2;
  }

  return Math.min(Math.round(score), 100);
}

// Get personalized job recommendations
async function getPersonalizedRecommendations(user, limit) {
  try {
    // Build search queries based on user profile
    const searchQueries = [];
    
    // Add career goals as search terms
    if (user.careerGoals && user.careerGoals.length > 0) {
      searchQueries.push(...user.careerGoals.map(goal => goal.title));
    }
    
    // Add top skills as search terms
    if (user.skills && user.skills.length > 0) {
      const topSkills = user.skills
        .filter(skill => skill.level !== 'beginner')
        .slice(0, 3)
        .map(skill => skill.name);
      searchQueries.push(...topSkills);
    }

    // If no specific queries, use generic terms based on background
    if (searchQueries.length === 0) {
      if (user.background === 'student') {
        searchQueries.push('entry level', 'junior', 'intern');
      } else {
        searchQueries.push('developer', 'analyst', 'engineer');
      }
    }

    // Fetch jobs for each query
    const allJobs = [];
    for (const query of searchQueries.slice(0, 3)) { // Limit to 3 queries
      const jobs = await fetchJobsFromAPI({
        query,
        location: user.preferences?.jobLocation || '',
        page: 1,
        limit: 5,
        remote: user.preferences?.remoteWork || false
      });
      allJobs.push(...jobs);
    }

    // Remove duplicates and calculate match scores
    const uniqueJobs = allJobs.filter((job, index, self) => 
      index === self.findIndex(j => j.id === job.id)
    );

    const jobsWithScores = uniqueJobs.map(job => ({
      ...job,
      matchScore: calculateMatchScore(job, user)
    }));

    // Sort by match score and return top results
    return jobsWithScores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return [];
  }
}

module.exports = router;