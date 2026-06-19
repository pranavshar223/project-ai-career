const logger = require('../../utils/logger');

// Stub for future APIs (YouTube, Coursera, Udemy)
class ResourceFinder {
  async findCourse(topic) {
    logger.debug(`Searching for courses on topic: ${topic}`);
    // Future implementation: fetch from Udemy/Coursera API
    return [];
  }

  async findVideo(topic) {
    logger.debug(`Searching for videos on topic: ${topic}`);
    // Future implementation: fetch from YouTube API
    return [];
  }

  async enrichResources(roadmapItems) {
    // Future implementation: iterate through AI generated items,
    // if a resource link is broken or generic, replace it with a real link from our APIs.
    return roadmapItems;
  }
}

module.exports = new ResourceFinder();
