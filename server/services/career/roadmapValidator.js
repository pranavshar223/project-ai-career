const AppError = require('../../utils/AppError');
const { sanitizeResources } = require('../resources/resourceValidator');

function validateAndNormalizeRoadmap(data, careerGoal, totalWeeks) {
  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'AI returned invalid roadmap structure', 400);
  }

  const today = new Date();

  const normalizedItems = data.items.map((item, index) => {
    const weekNum = item.weekNumber || (index + 1);
    const dueDate = item.dueDate
      ? new Date(item.dueDate)
      : new Date(today.getTime() + weekNum * 7 * 24 * 60 * 60 * 1000);

    return {
      title: item.title || `Step ${index + 1}`,
      description: item.description || item.title || '',
      type: ['skill', 'project', 'certification', 'course'].includes(item.type)
        ? item.type : 'skill',
      phase: ['foundation', 'development', 'advanced', 'professional'].includes(item.phase)
        ? item.phase : 'foundation',
      weekNumber: weekNum,
      dueDate: dueDate,
      scheduledStartDate: new Date(today.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
      completed: false,
      duration: item.duration || '1 week',
      priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
      order: item.order ?? index + 1,
      skills: Array.isArray(item.skills) ? item.skills : [],
      estimatedHours: item.estimatedHours || 0,
      resources: sanitizeResources(item.resources),
      isAdapted: false,
      adaptedReason: null
    };
  });

  return {
    title: data.title || `${careerGoal} Career Roadmap`,
    description: data.description || '',
    difficulty: ['beginner', 'intermediate', 'advanced'].includes(data.difficulty)
      ? data.difficulty : 'intermediate',
    totalEstimatedDuration: data.totalEstimatedDuration || '6-months',
    items: normalizedItems
  };
}

module.exports = { validateAndNormalizeRoadmap };
