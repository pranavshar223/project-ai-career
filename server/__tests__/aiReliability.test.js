const { parseJsonResponse, extractTextResponse } = require('../services/ai/responseParser');
const careerCoachService = require('../services/career/careerCoachService');
const { validateAndNormalizeRoadmap } = require('../services/career/roadmapValidator');

describe('AI Reliability Fixes', () => {
  
  describe('responseParser.js', () => {
    
    test('Test 1: Markdown JSON Parsing', () => {
      const input = `\`\`\`json\n{\n  "advice": "Practice React"\n}\n\`\`\``;
      const result = parseJsonResponse(input);
      expect(result).toEqual({ advice: 'Practice React' });
    });

    test('Test 2: DeepSeek Thinking Block', () => {
      const input = `<think>\n{ "internal": true }\n</think>\n\n{\n  "advice": "Learn Node.js"\n}`;
      const result = parseJsonResponse(input);
      expect(result).toEqual({ advice: 'Learn Node.js' });
    });

    test('Test 5: Array Response', () => {
      const input = `[\n  {\n    "advice": "Complete DSA fundamentals."\n  }\n]`;
      const result = parseJsonResponse(input);
      expect(result).toEqual({ advice: 'Complete DSA fundamentals.' });
    });

    test('Test 5b: Array Response with Markdown', () => {
      const input = `\`\`\`json\n[\n  {\n    "advice": "Complete DSA fundamentals."\n  }\n]\n\`\`\``;
      const result = parseJsonResponse(input);
      expect(result).toEqual({ advice: 'Complete DSA fundamentals.' });
    });
  });

  describe('careerCoachService.js', () => {
    
    test('Test 3a: Fallback for Missing Advice Field (Fallback to message)', () => {
      // Mock executeApiCall result logic
      const data = { message: "Keep building projects." };
      const formatted = careerCoachService.formatResponse(data.advice || data.content || data.message || data.text || data);
      expect(formatted).toBe("Keep building projects.");
    });

    test('Test 3b: Prevent Raw JSON Leakage (Invalid Schema)', () => {
      const data = { unexpected: "value" };
      const formatted = careerCoachService.formatResponse(data.advice || data.content || data.message || data.text || data);
      expect(formatted).toBe("I couldn't generate a valid coaching response. Please try again.");
    });
    
  });

  describe('roadmapValidator.js', () => {
    
    test('Test 4: Invalid Date Fallback', () => {
      const inputData = {
        title: "Test Roadmap",
        items: [
          {
            weekNumber: 1,
            dueDate: "Next Monday", // Invalid Date
            title: "Task 1"
          }
        ]
      };
      
      const result = validateAndNormalizeRoadmap(inputData, "Goal", 24);
      
      // Should not throw, and dueDate should be a valid Date object
      expect(result.items[0].dueDate).toBeInstanceOf(Date);
      expect(isNaN(result.items[0].dueDate.getTime())).toBe(false);
      
      // It should fallback to the mathematically calculated date (today + 1 week)
      const now = new Date();
      const diff = result.items[0].dueDate.getTime() - now.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      
      // Approximately 7 days
      expect(days).toBeGreaterThan(6.9);
      expect(days).toBeLessThan(7.1);
    });

  });

});
