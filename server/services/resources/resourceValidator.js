function sanitizeResources(resources) {
  if (!Array.isArray(resources)) return [];
  const validTypes = ["course", "article", "video", "book", "documentation"];
  
  const typeMap = { 
    tutorial: "article", 
    dataset: "documentation", 
    platform: "course", 
    guide: "article", 
    tool: "documentation", 
    project: "article", 
    website: "article", 
    repo: "documentation", 
    repository: "documentation", 
    blog: "article", 
    podcast: "video", 
    exercise: "course" 
  };
  
  return resources
    .filter(r => {
      if (!r.title || !r.url) return false;
      try {
        const parsed = new URL(r.url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch (e) {
        return false;
      }
    })
    .map(r => {
      const normalizedType = typeof r.type === 'string' ? r.type.trim().toLowerCase() : '';
      return { 
        ...r, 
        type: validTypes.includes(normalizedType) ? normalizedType : (typeMap[normalizedType] || "article") 
      };
    });
}

module.exports = { sanitizeResources };
