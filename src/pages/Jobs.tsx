import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase } from 'lucide-react';
import JobCard from '../components/Jobs/JobCard';
import { Job } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface JobsProps {
  searchQuery?: string;
  location?: string;
  triggerSearch?: number; // increments when sidebar Search button is clicked
}

const Jobs: React.FC<JobsProps> = ({
  searchQuery = '',
  location = '',
  triggerSearch = 0,
}) => {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recommendations on mount
  useEffect(() => {
    loadJobs();
  }, [token]);

  // Trigger search when sidebar button is pressed
  useEffect(() => {
    if (triggerSearch > 0) handleSearch();
  }, [triggerSearch]);

  const loadJobs = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await axios.get('/jobs/recommendations', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10 },
      });
      if (response.data.recommendations) {
        setJobs(
          response.data.recommendations.map((job: any) => ({
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            salary: job.salary,
            description: job.description,
            url: job.applyUrl || '#',
            posted: new Date(job.postedDate || job.posted),
            matchScore: job.matchScore || 75,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await axios.get('/jobs/search', {
        headers: { Authorization: `Bearer ${token}` },
        params: { query: searchQuery, location, limit: 20 },
      });
      if (response.data.jobs) {
        setJobs(
          response.data.jobs.map((job: any) => ({
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            salary: job.salary,
            description: job.description,
            url: job.applyUrl || '#',
            posted: new Date(job.postedDate || job.posted),
            matchScore: job.matchScore || 75,
          }))
        );
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      searchQuery === '' ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation =
      location === '' ||
      job.location.toLowerCase().includes(location.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Recommendations</h1>
          <p className="text-gray-600 mt-2">
            Personalized job opportunities based on your skills and career goals
          </p>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center text-gray-600">
            <Briefcase className="w-5 h-5 mr-2" />
            <span>{filteredJobs.length} jobs found</span>
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option>Sort by Match Score</option>
            <option>Sort by Date Posted</option>
            <option>Sort by Salary</option>
          </select>
        </div>

        {/* Job Listings */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {!isLoading && filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or check back later for new opportunities.
            </p>
            <button
              onClick={loadJobs}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Load Recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;