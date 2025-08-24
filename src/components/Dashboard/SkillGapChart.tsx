import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SkillGap } from '../../types';

interface SkillGapChartProps {
  data: SkillGap[];
}

const SkillGapChart: React.FC<SkillGapChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Skill Gap Analysis</h3>
        <p className="text-sm text-gray-600">Your current skills vs. required for your career goal</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="skill" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                `${value}%`, 
                name === 'current' ? 'Current Level' : 'Required Level'
              ]}
            />
            <Legend />
            <Bar dataKey="current" fill="#3B82F6" name="Current Level" radius={[4, 4, 0, 0]} />
            <Bar dataKey="required" fill="#10B981" name="Required Level" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SkillGapChart;