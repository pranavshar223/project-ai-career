const { parseJsonResponse, extractTextResponse } = require('../services/ai/responseParser');
const careerCoachService = require('../services/career/careerCoachService');
const { validateAndNormalizeRoadmap } = require('../services/career/roadmapValidator');
const AppError = require('../utils/AppError');

describe('AI Reliability Fixes', () => {

  describe('responseParser.js - parseJsonResponse', () => {
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

    test('Test 5: Array Response Preserved', () => {
      const input = `[\n  {\n    "advice": "Complete DSA fundamentals."\n  }\n]`;
      const result = parseJsonResponse(input);
      expect(result).toEqual([{ advice: 'Complete DSA fundamentals.' }]);
    });

    test('Test 5b: Mixed Object and Array - Object takes precedence', () => {
      const input = `Here is some text:\n{\n  "advice": "Object advice"\n}\nAnd here is an array:\n[\n  {"advice": "Array advice"}\n]`;
      const result = parseJsonResponse(input);
      expect(result).toEqual({ advice: 'Object advice' });
    });

    test('Error Path: Empty response throws AI_PARSE_ERROR', () => {
      expect(() => parseJsonResponse('')).toThrow(AppError);
      try {
        parseJsonResponse(null);
      } catch (err) {
        expect(err.message).toBe('Empty response from AI');
      }
    });

    test('Error Path: Non-JSON free text throws AI_PARSE_ERROR', () => {
      expect(() => parseJsonResponse('Hello world, no brackets here')).toThrow(AppError);
      try {
        parseJsonResponse('Hello world');
      } catch (err) {
        expect(err.message).toBe('AI returned non-JSON response');
      }
    });

    test('Error Path: Invalid JSON within extracted block', () => {
      expect(() => parseJsonResponse('Some text { "broken": "json", } more text')).toThrow(AppError);
      try {
        parseJsonResponse('Some text { "broken": "json", } more text');
      } catch (err) {
        expect(err.message).toBe('Extracted JSON block is invalid');
      }
    });

    test('Empty array response returns []', () => {
      expect(parseJsonResponse('[]')).toEqual([]);
    });
  });

  describe('responseParser.js - extractTextResponse', () => {
    test('Strips single <think> block', () => {
      const input = `<think>Internal thoughts</think>This is the actual response.`;
      expect(extractTextResponse(input)).toBe('This is the actual response.');
    });

    test('Strips multiple <think> blocks globally', () => {
      const input = `<think>One</think>Hello <think>Two</think>World`;
      expect(extractTextResponse(input)).toBe('Hello World');
    });

    test('Normalizes 3+ newlines to two newlines', () => {
      const input = `Line 1\n\n\n\nLine 2\n\n\nLine 3`;
      expect(extractTextResponse(input)).toBe('Line 1\n\nLine 2\n\nLine 3');
    });

    test('Safely handles null/undefined/empty string', () => {
      expect(extractTextResponse(null)).toBe('');
      expect(extractTextResponse(undefined)).toBe('');
      expect(extractTextResponse('')).toBe('');
    });
  });

  describe('careerCoachService.js', () => {
    
    describe('formatResponse', () => {
      test('normalizes plain string input by trimming whitespace', () => {
        const input = `\n\n   Keep building projects.  \n\n`;
        const formatted = careerCoachService.formatResponse(input);
        expect(formatted).toBe('Keep building projects.');
      });

      test('handles non-string object by logging warning and returning fallback message', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const input = { unexpected: 'value' };
        const formatted = careerCoachService.formatResponse(input);

        expect(warnSpy).toHaveBeenCalled();
        expect(formatted).toBe("I couldn't generate a valid coaching response. Please try again.");

        warnSpy.mockRestore();
      });

      test('treats null, undefined and arrays as invalid and returns fallback message', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const invalidInputs = [null, undefined, ['unexpected'], []];

        for (const value of invalidInputs) {
          const formatted = careerCoachService.formatResponse(value);
          expect(formatted).toBe("I couldn't generate a valid coaching response. Please try again.");
        }

        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
      });
    });

  });

  describe('roadmapValidator.js', () => {
    
    afterEach(() => {
      jest.useRealTimers();
    });

    test('Test 4: Invalid Date Fallback', () => {
      const fixedNow = new Date('2025-01-01T00:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(fixedNow);

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
      const fallbackDueDate = new Date(result.items[0].dueDate);
      const expectedFallback = new Date(fixedNow.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      expect(fallbackDueDate.toISOString()).toBe(expectedFallback.toISOString());
    });

    test('Test 5: Preserve Valid ISO Due Date', () => {
      const fixedNow = new Date('2025-01-01T00:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(fixedNow);

      const validDueDate = '2025-02-01T12:00:00.000Z';
      const inputData = {
        title: 'Test Roadmap',
        items: [
          {
            weekNumber: 1,
            dueDate: validDueDate,
            title: 'Task 1',
          },
        ],
      };

      const result = validateAndNormalizeRoadmap(inputData, "Goal", 24);
      const resultingDueDate = result.items[0].dueDate;

      expect(new Date(resultingDueDate).toISOString()).toBe(validDueDate);
    });

  });

});
