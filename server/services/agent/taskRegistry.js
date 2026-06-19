const roadmapService = require('../career/roadmapService');
const roadmapAdapter = require('../career/roadmapAdapter');
const careerCoachService = require('../career/careerCoachService');
const skillGapService = require('../career/skillGapService');
const resumeService = require('../career/resumeService');
const interviewService = require('../career/interviewService');
const jobMatchService = require('../career/jobMatchService');

const taskRegistry = {
  generate_roadmap: roadmapService,
  adapt_roadmap: roadmapAdapter,
  career_chat: careerCoachService,
  skill_gap: skillGapService,
  resume_review: resumeService,
  interview: interviewService,
  job_match: jobMatchService
};

module.exports = taskRegistry;
