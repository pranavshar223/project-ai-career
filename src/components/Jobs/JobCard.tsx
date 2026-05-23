import React from 'react';
import { ExternalLink, MapPin, DollarSign, Calendar, Star } from 'lucide-react';
import { Job } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{job.title}</h3>
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">{job.company}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchScoreColor(job.matchScore)}`}>
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-1" />
            {job.matchScore}% match
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          {job.location}
        </div>
        {job.salary && (
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            {job.salary}
          </div>
        )}
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {formatDistanceToNow(job.posted, { addSuffix: true })}
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
        {job.description}
      </p>

      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
            Remote Friendly
          </span>
          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
            Full-time
          </span>
        </div>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Apply Now
          <ExternalLink className="w-4 h-4 ml-2" />
        </a>
      </div>
    </div>
  );
};

export default JobCard;