const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');

async function searchSkills(query, category) {
  const filter = {};

  if (query) {
    filter.name = { $regex: query, $options: 'i' };
  }

  if (category) {
    filter.category = category;
  }

  return await Skill.find(filter).limit(20);
}

async function getTrendingSkills() {
  return await UserSkill.aggregate([
    {
      $group: {
        _id: "$skillId",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "skills",
        localField: "_id",
        foreignField: "_id",
        as: "skill"
      }
    },
    { $unwind: "$skill" },
    {
      $project: {
        _id: 0,
        skillId: "$skill._id",
        name: "$skill.name",
        category: "$skill.category",
        usageCount: "$count"
      }
    }
  ]);
}

module.exports = { searchSkills, getTrendingSkills };