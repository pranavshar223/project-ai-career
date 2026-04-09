const UserSkill = require('../models/UserSkill');

async function getUserSkills(userId) {
  const data = await UserSkill.find({ userId })
    .populate('skillId', 'name category')
    .lean();

  return data.map(s => ({
    skillId: s.skillId._id,
    name: s.skillId.name,
    category: s.skillId.category,
    level: s.proficiencyLevel
  }));
}

module.exports = { getUserSkills };