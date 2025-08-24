import React from 'react';
import { CheckCircle2, Circle, Clock, Star } from 'lucide-react';
import { RoadmapItem } from '../../types';

interface RoadmapTimelineProps {
  items: RoadmapItem[];
  onToggleComplete: (id: string) => void;
}

const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ items, onToggleComplete }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'skill': return '📚';
      case 'project': return '🚀';
      case 'certification': return '🏆';
      default: return '📋';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Star className="w-5 h-5 text-yellow-500 mr-2" />
          Your Career Roadmap
        </h3>
        <p className="text-sm text-gray-600">Step-by-step path to your goals</p>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className={`relative flex items-start p-4 rounded-lg border transition-all ${
              item.completed 
                ? 'bg-green-50 border-green-200' 
                : 'bg-white border-gray-200 hover:shadow-sm'
            }`}
          >
            <button
              onClick={() => onToggleComplete(item.id)}
              className="flex-shrink-0 mr-4 mt-1"
            >
              {item.completed ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400 hover:text-green-500 transition-colors" />
              )}
            </button>

            <div className="flex-grow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getTypeIcon(item.type)}</span>
                  <h4 className={`font-medium ${
                    item.completed ? 'text-green-800 line-through' : 'text-gray-900'
                  }`}>
                    {item.title}
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {item.duration}
                  </div>
                </div>
              </div>
              
              <p className={`text-sm ${
                item.completed ? 'text-green-700' : 'text-gray-600'
              }`}>
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadmapTimeline;