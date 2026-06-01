import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { Search, BookOpen, Video, FileText, Wrench, Map, ExternalLink, Bookmark, Sparkles, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Mock Data
type Category = 'All' | 'AI Suggested' | 'Courses' | 'Articles' | 'Tools' | 'Roadmaps';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: Category;
  url: string;
  icon: React.ElementType<{ className?: string }>;
  tags: string[];
  isAiSuggested?: boolean;
  isNewAdd?: boolean;
}

// API Response Types
interface ApiResource {
  _id?: string;
  title: string;
  url: string;
  type?: string;
}

interface ApiRoadmapItem {
  title: string;
  phase?: string;
  resources?: ApiResource[];
}

interface ApiRoadmap {
  items?: ApiRoadmapItem[];
}

const MOCK_RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'Machine Learning Specialization',
    description: 'Foundational AI/ML course by Andrew Ng covering supervised learning, unsupervised learning, and best practices.',
    category: 'Courses',
    url: '#',
    icon: Video,
    tags: ['Machine Learning', 'Beginner', 'Python'],
    isAiSuggested: true
  },
  {
    id: '2',
    title: 'Hugging Face Transformers',
    description: 'State-of-the-art Machine Learning for PyTorch, TensorFlow, and JAX. The go-to tool for NLP.',
    category: 'Tools',
    url: '#',
    icon: Wrench,
    tags: ['NLP', 'Open Source', 'Libraries']
  },
  {
    id: '3',
    title: 'Attention Is All You Need',
    description: 'The seminal paper introducing the Transformer architecture, the foundation of modern LLMs.',
    category: 'Articles',
    url: '#',
    icon: FileText,
    tags: ['Research', 'Transformers', 'Deep Learning']
  },
  {
    id: '4',
    title: 'AI Engineer Roadmap',
    description: 'A comprehensive step-by-step guide to becoming an AI Engineer, from basics to deployment.',
    category: 'Roadmaps',
    url: '#',
    icon: Map,
    tags: ['Career', 'Guide', 'Full Stack']
  },
  {
    id: '5',
    title: 'Practical Deep Learning for Coders',
    description: 'fast.ai\'s incredibly practical, top-down approach to deep learning using PyTorch.',
    category: 'Courses',
    url: '#',
    icon: Video,
    tags: ['Deep Learning', 'PyTorch', 'Practical']
  },
  {
    id: '6',
    title: 'LangChain Documentation',
    description: 'Framework for developing applications powered by language models. Essential for modern AI dev.',
    category: 'Tools',
    url: '#',
    icon: Wrench,
    tags: ['LLMs', 'Framework', 'Agents'],
    isAiSuggested: true
  }
];

const CATEGORIES: Category[] = ['All', 'AI Suggested', 'Courses', 'Articles', 'Tools', 'Roadmaps'];

const Resources: React.FC = () => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  
  const [dbResources, setDbResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      if (!token) {
        setDbResources([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await axios.get('/roadmaps', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const roadmaps: ApiRoadmap[] = res.data.roadmaps || [];
        // Roadmaps are likely sorted newest first. Reverse to process oldest first.
        const sortedRoadmaps = [...roadmaps].reverse(); 
        
        const seenUrls = new Set<string>();
        const fetchedResources: Resource[] = [];
        
        sortedRoadmaps.forEach((roadmap, index) => {
          const isLatestRoadmap = index === sortedRoadmaps.length - 1;
          // Mark as "New Add" if there is more than 1 roadmap and this is from the latest one
          const markAsNewAdd = sortedRoadmaps.length > 1 && isLatestRoadmap;

          if (roadmap.items) {
            roadmap.items.forEach((item) => {
              if (item.resources) {
                item.resources.forEach((r) => {
                  if (!seenUrls.has(r.url)) {
                    seenUrls.add(r.url);
                    
                    let Icon = ExternalLink;
                    if (r.type === 'video' || r.type === 'course') Icon = Video;
                    if (r.type === 'documentation' || r.type === 'book') Icon = BookOpen;

                    fetchedResources.push({
                      id: r._id || `db-${Date.now()}-${Math.random()}`,
                      title: r.title,
                      description: `Suggested for: ${item.title}`,
                      category: 'AI Suggested',
                      url: r.url,
                      icon: Icon,
                      tags: [item.phase || 'General', r.type || 'Resource'],
                      isAiSuggested: true,
                      isNewAdd: markAsNewAdd
                    });
                  }
                });
              }
            });
          }
        });
        
        // Reverse again so the newest resources are at the top
        setDbResources(fetchedResources.reverse());
      } catch (error) {
        console.error('Error fetching roadmap resources:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoadmaps();
  }, [token]);

  const allResources = useMemo(() => {
    return [...dbResources, ...MOCK_RESOURCES];
  }, [dbResources]);

  const filteredResources = useMemo(() => {
    return allResources.filter(resource => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (resource.title?.toLowerCase() ?? '').includes(searchLower) || 
                            (resource.description?.toLowerCase() ?? '').includes(searchLower) ||
                            (resource.tags || []).some(tag => (tag?.toLowerCase() ?? '').includes(searchLower));
      
      const matchesCategory = activeCategory === 'All' || 
                              (activeCategory === 'AI Suggested' && resource.isAiSuggested) || 
                              resource.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [allResources, searchQuery, activeCategory]);

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              Career Resources
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">
              Curated materials, tools, and guides to accelerate your journey in Artificial Intelligence.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources, tags, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-500 animate-spin" />
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => {
              const Icon = resource.icon;
              const isSaved = savedIds.has(resource.id);

              return (
                <div 
                  key={resource.id}
                  className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="p-6 flex-1 flex flex-col relative z-0">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        {resource.isNewAdd && (
                          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border border-green-200 dark:border-green-800">
                            <Plus className="w-3.5 h-3.5" />
                            New Add
                          </div>
                        )}
                        {resource.isAiSuggested && (
                          <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border border-purple-200 dark:border-purple-800">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI Pick
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => toggleSave(resource.id)}
                        aria-label={isSaved ? "Remove from saved resources" : "Save resource"}
                        className={`p-2 rounded-full transition-colors flex-shrink-0 ${isSaved ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      >
                        <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-500">
                        {resource.category}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                      {resource.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 flex-1">
                      {resource.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                      {resource.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {(() => {
                      let isValid = false;
                      try {
                        const parsed = new URL(resource.url);
                        isValid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
                      } catch (error) {
                        // Ignore invalid URL format
                      }
                      
                      return isValid ? (
                        <a 
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-xl transition-colors border border-gray-200 dark:border-gray-700 group-hover:border-blue-500/30 group-hover:dark:border-blue-500/30"
                        >
                          View Resource
                          <ExternalLink className="w-4 h-4 ml-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 cursor-not-allowed">
                          Link Unavailable
                        </span>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No resources found</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              We couldn't find any resources matching your search or filter. Try using different keywords.
            </p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
              className="mt-6 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Resources;
