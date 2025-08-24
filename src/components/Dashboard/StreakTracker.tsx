import React from 'react';
import { Calendar, Flame, Trophy } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  completedDays: Date[];
}

const StreakTracker: React.FC<StreakTrackerProps> = ({ 
  currentStreak, 
  longestStreak, 
  completedDays 
}) => {
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const isCompleted = completedDays.some(completedDay => 
        isSameDay(completedDay, day)
      );
      
      days.push({
        date: day,
        isCompleted,
        isToday: isSameDay(day, today)
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Flame className="w-5 h-5 text-orange-500 mr-2" />
          Learning Streak
        </h3>
        <p className="text-sm text-gray-600">Keep your momentum going!</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
          <div className="text-sm text-orange-700">Current Streak</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 flex items-center justify-center">
            <Trophy className="w-6 h-6 mr-1" />
            {longestStreak}
          </div>
          <div className="text-sm text-purple-700">Best Streak</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm font-medium text-gray-700">
          <Calendar className="w-4 h-4 mr-2" />
          Last 7 Days
        </div>
        
        <div className="flex justify-between">
          {calendarDays.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-gray-500 mb-1">
                {format(day.date, 'EEE')}
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  day.isCompleted
                    ? 'bg-green-500 text-white'
                    : day.isToday
                    ? 'bg-blue-100 text-blue-600 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {format(day.date, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StreakTracker;