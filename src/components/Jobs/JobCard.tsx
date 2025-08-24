import React from 'react';
import { ExternalLink, MapPin, DollarSign, Calendar, Star } from 'lucide-react';
import { Job } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
          <p className="text-gray-700 font-medium mb-2">{job.company}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchScoreColor(job.matchScore)}`}>
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-1" />
            {job.matchScore}% match
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
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

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {job.description}
      </p>

      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            Remote Friendly
          </span>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
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