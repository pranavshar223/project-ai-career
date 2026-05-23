import React, { useState } from 'react';
import {
  CheckCircle2, Circle, Clock, Star, AlertCircle,
  RefreshCw, ChevronDown, ChevronUp, ExternalLink, Sparkles
} from 'lucide-react';

interface Resource {
  title: string;
  url: string;
  type: string;
  _id?: string;
}

interface RoadmapItem {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  type: string;
  phase?: string;
  weekNumber?: number;
  dueDate?: string;
  status?: string;
  completed: boolean;
  completedAt?: string;
  priority: string;
  duration?: string;
  estimatedHours?: number;
  skills?: string[];
  resources?: Resource[];
  isAdapted?: boolean;
  adaptedReason?: string;
}

interface RoadmapTimelineProps {
  items: RoadmapItem[];
  onToggleComplete: (id: string) => void;
}

const PHASES = ['foundation', 'development', 'advanced', 'professional'];

const PHASE_STYLES: Record<string, { bg: string; border: string; label: string; color: string }> = {
  foundation:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-200 dark:border-blue-800',   label: 'Foundation',   color: 'text-blue-700 dark:text-blue-400'   },
  development:  { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', label: 'Development',  color: 'text-purple-700 dark:text-purple-400' },
  advanced:     { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', label: 'Advanced',     color: 'text-orange-700 dark:text-orange-400' },
  professional: { bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-800',  label: 'Professional', color: 'text-green-700 dark:text-green-400'  },
};

const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ items, onToggleComplete }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const getId = (item: RoadmapItem) => (item.id || item._id || '') as string;

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':   return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low':    return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:       return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusStyle = (item: RoadmapItem) => {
    if (item.completed || item.status === 'completed')
      return { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: <CheckCircle2 className="w-5 h-5 text-green-500" /> };
    if (item.status === 'missed')
      return { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: <AlertCircle className="w-5 h-5 text-red-500" /> };
    if (item.status === 'in_progress')
      return { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: <RefreshCw className="w-5 h-5 text-blue-500" /> };
    return { bg: 'bg-white dark:bg-gray-900', border: 'border-gray-200 dark:border-gray-700', icon: <Circle className="w-5 h-5 text-gray-400 hover:text-green-500 transition-colors" /> };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'skill':         return '📚';
      case 'project':       return '🚀';
      case 'certification': return '🏆';
      case 'course':        return '🎓';
      default:              return '📋';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':         return '🎬';
      case 'course':        return '🎓';
      case 'documentation': return '📄';
      case 'book':          return '📖';
      default:              return '🔗';
    }
  };

  const isDueSoon = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const isOverdue = (item: RoadmapItem) => {
    if (item.completed || item.status === 'completed') return false;
    if (!item.dueDate) return false;
    return new Date(item.dueDate) < new Date();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group items by phase
  const groupedByPhase = PHASES.reduce((acc, phase) => {
    const phaseItems = items.filter(i => (i.phase || 'foundation') === phase);
    if (phaseItems.length > 0) acc[phase] = phaseItems;
    return acc;
  }, {} as Record<string, RoadmapItem[]>);

  // Items with no phase go to foundation
  const ungrouped = items.filter(i => !i.phase);
  if (ungrouped.length > 0) {
    groupedByPhase['foundation'] = [...(groupedByPhase['foundation'] || []), ...ungrouped];
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Star className="w-5 h-5 text-yellow-500 mr-2" />
          Your Career Roadmap
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Step-by-step path to your goals</p>
      </div>

      {/* Phase Sections */}
      <div className="space-y-8">
        {PHASES.filter(p => groupedByPhase[p]).map(phase => {
          const style = PHASE_STYLES[phase];
          const phaseItems = groupedByPhase[phase];
          const phaseDone = phaseItems.filter(i => i.completed).length;

          return (
            <div key={phase}>
              {/* Phase Header */}
              <div className={`flex items-center justify-between px-4 py-2 rounded-lg ${style.bg} ${style.border} border mb-3`}>
                <span className={`text-sm font-semibold uppercase tracking-wide ${style.color}`}>
                  {style.label} Phase
                </span>
                <span className={`text-xs ${style.color}`}>
                  {phaseDone}/{phaseItems.length} completed
                </span>
              </div>

              {/* Phase Items */}
              <div className="space-y-3 ml-2">
                {phaseItems
                  .sort((a, b) => (a.weekNumber || a.order || 0) - (b.weekNumber || b.order || 0))
                  .map((item) => {
                    const id = getId(item);
                    const isExpanded = expandedItems.has(id);
                    const statusStyle = getStatusStyle(item);
                    const overdue = isOverdue(item);
                    const dueSoon = isDueSoon(item.dueDate);

                    return (
                      <div
                        key={id}
                        className={`rounded-lg border transition-all ${statusStyle.bg} ${statusStyle.border} ${
                          item.isAdapted ? 'ring-2 ring-blue-300 dark:ring-blue-700 ring-offset-1 dark:ring-offset-gray-900' : ''
                        }`}
                      >
                        {/* AI Adapted Badge */}
                        {item.isAdapted && (
                          <div className="flex items-center gap-1 px-4 pt-2">
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              AI Adapted — {item.adaptedReason === 'missed_previous' ? 'catch-up task' : 'follow-up task'}
                            </span>
                          </div>
                        )}

                        <div className="flex items-start p-4">
                          {/* Toggle Button */}
                          <button
                            onClick={() => onToggleComplete(id)}
                            className="flex-shrink-0 mr-3 mt-0.5"
                            disabled={item.status === 'missed'}
                            title={item.status === 'missed' ? 'Task missed' : 'Toggle complete'}
                          >
                            {statusStyle.icon}
                          </button>

                          {/* Content */}
                          <div className="flex-grow min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base">{getTypeIcon(item.type)}</span>
                                <h4 className={`font-medium text-sm ${
                                  item.completed ? 'text-green-800 dark:text-green-400 line-through' :
                                  item.status === 'missed' ? 'text-red-800 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                  {item.title}
                                </h4>
                                {item.weekNumber && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500">Week {item.weekNumber}</span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityStyle(item.priority)}`}>
                                  {item.priority}
                                </span>
                              </div>
                            </div>

                            {/* Meta row */}
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                              {item.duration && (
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {item.duration}
                                </div>
                              )}
                              {item.estimatedHours && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">~{item.estimatedHours}h</span>
                              )}
                              {item.dueDate && (
                                <span className={`text-xs font-medium ${
                                  overdue ? 'text-red-600 dark:text-red-400' :
                                  dueSoon ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {overdue ? '⚠ Overdue: ' : dueSoon ? '⏰ Due soon: ' : 'Due: '}
                                  {formatDate(item.dueDate)}
                                </span>
                              )}
                              {item.completedAt && (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  ✓ Completed {formatDate(item.completedAt)}
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            <p className={`text-xs leading-relaxed ${
                              item.completed ? 'text-green-700 dark:text-green-400' :
                              item.status === 'missed' ? 'text-red-700 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {item.description}
                            </p>

                            {/* Skills */}
                            {item.skills && item.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.skills.map((skill, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Resources toggle */}
                            {item.resources && item.resources.length > 0 && (
                              <div className="mt-3">
                                <button
                                  onClick={() => toggleExpand(id)}
                                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                >
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  {isExpanded ? 'Hide' : 'Show'} {item.resources.length} resource{item.resources.length > 1 ? 's' : ''}
                                </button>

                                {isExpanded && (
                                  <div className="mt-2 space-y-1.5">
                                    {item.resources.map((resource, i) => (
                                      <a
                                        key={resource._id || i}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                                      >
                                        <span className="text-sm">{getResourceIcon(resource.type)}</span>
                                        <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 flex-grow truncate">
                                          {resource.title}
                                        </span>
                                        <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No roadmap items yet. Generate your roadmap to get started!</p>
        </div>
      )}
    </div>
  );
};

export default RoadmapTimeline;
