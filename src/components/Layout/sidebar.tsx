import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock,
  SlidersHorizontal,
  MapPin,
  Search,
} from 'lucide-react';

interface SidebarProps {
  // Chat history sessions passed from Chat page (optional)
  chatSessions?: { id: string; title: string; date: string }[];
  // Job filter state passed from Jobs page (optional)
  jobFilters?: {
    searchQuery: string;
    location: string;
    onSearchChange: (v: string) => void;
    onLocationChange: (v: string) => void;
    onSearch: () => void;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ chatSessions, jobFilters }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
  ];

  const isChat = location.pathname === '/chat';
  const isJobs = location.pathname === '/jobs';

  return (
    <aside
      className={`
        relative flex flex-col h-full bg-white border-r border-gray-200 
        transition-all duration-300 ease-in-out flex-shrink-0
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-4 z-10 flex items-center justify-center w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-500" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-500" />
        )}
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className={`px-3 mb-2 ${collapsed ? 'hidden' : 'block'}`}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
            Navigation
          </p>
        </div>

        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`
                    flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
                    ${collapsed ? 'justify-center' : 'space-x-3'}
                    ${active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ── Chat History Section ── */}
        {isChat && !collapsed && (
          <div className="mt-6 px-3">
            <div className="flex items-center space-x-2 px-2 mb-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Chat History
              </p>
            </div>
            <ul className="space-y-1">
              {chatSessions && chatSessions.length > 0 ? (
                chatSessions.map((session) => (
                  <li key={session.id}>
                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                      <p className="truncate font-medium">{session.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{session.date}</p>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-gray-400 italic">
                  No previous sessions
                </li>
              )}
            </ul>
          </div>
        )}

        {/* ── Job Filters Section ── */}
        {isJobs && !collapsed && jobFilters && (
          <div className="mt-6 px-3">
            <div className="flex items-center space-x-2 px-2 mb-3">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Job Filters
              </p>
            </div>

            <div className="space-y-3">
              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 px-1">
                  Job / Company
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={jobFilters.searchQuery}
                    onChange={(e) => jobFilters.onSearchChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 px-1">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="City, remote..."
                    value={jobFilters.location}
                    onChange={(e) => jobFilters.onLocationChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={jobFilters.onSearch}
                className="w-full flex items-center justify-center space-x-2 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Jobs</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;