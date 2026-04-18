// tests/agents/base-agent.test.ts
import { BaseAgent } from '../../src/agents/base-agent';

// Create a concrete implementation for testing
class TestAgent extends BaseAgent {
  async execute(input: any): Promise<any> {
    return { result: 'test' };
  }
}

describe('BaseAgent', () => {
  let agent: TestAgent;

  beforeEach(() => {
    agent = new TestAgent();
  });

  it('should generate valid session IDs', () => {
    const sessionId = agent['generateSessionId']();
    expect(sessionId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('should build system prompts with variables', () => {
    const template = 'Hello {{name}}, welcome to {{place}}';
    const result = agent['buildSystemPrompt'](template, {
      name: 'Alice',
      place: 'Wonderland',
    });

    expect(result).toBe('Hello Alice, welcome to Wonderland');
  });

  it('should parse valid JSON responses', () => {
    const jsonString = '{"result": "success"}';
    const result = agent['parseJSONResponse'](jsonString, 'test');

    expect(result).toEqual({ result: 'success' });
  });

  it('should throw error for invalid JSON', () => {
    const invalidJson = '{invalid json}';

    expect(() => {
      agent['parseJSONResponse'](invalidJson, 'test');
    }).toThrow('Invalid JSON response');
  });

  it('should validate responses with custom validator', () => {
    const response = { data: 'test' };
    const validator = (obj: any) => obj && typeof obj.data === 'string';

    const result = agent['validateResponse'](response, validator);

    expect(result).toEqual(response);
  });

  it('should throw error for invalid responses', () => {
    const response = { data: 123 };
    const validator = (obj: any) => typeof obj.data === 'string';

    expect(() => {
      agent['validateResponse'](response, validator);
    }).toThrow('validation failed');
  });
});