// Integration test with real DeepSeek API calls
import request from 'supertest';
import App from '../../src/app';

describe('Real DeepSeek API Integration Test', () => {
  let app: App;
  let expressApp: any;

  beforeAll(() => {
    // Create app with real agents (no mocks)
    app = new App();
    expressApp = app.getApp();
  });

  describe('Complete AI Interaction Flow', () => {
    it('should complete full recommendation and generation flow with real AI', async () => {
      // Step 1: Get recommendations
      console.log('Step 1: Getting recommendations...');
      const recommendResponse = await request(expressApp)
        .post('/api/recommendations')
        .send({
          canvasContext: {
            nearbyContent: ['微积分', '函数极限'],
            userHistory: ['数学分析'],
            currentTheme: 'academic',
          },
        })
        .expect(200);

      expect(recommendResponse.body.success).toBe(true);
      expect(recommendResponse.body.data).toHaveProperty('sessionId');
      expect(recommendResponse.body.data).toHaveProperty('options');
      expect(recommendResponse.body.data.options).toBeInstanceOf(Array);
      expect(recommendResponse.body.data.options.length).toBeGreaterThan(0);

      console.log('✅ Got recommendations:', recommendResponse.body.data.options.length, 'options');

      const { sessionId, options } = recommendResponse.body.data;

      // Step 2: Generate content using first option
      console.log('Step 2: Generating content...');
      const contentResponse = await request(expressApp)
        .post('/api/content/generate')
        .send({
          sessionId,
          selectedOptionId: options[0].optionId,
        })
        .expect(200);

      expect(contentResponse.body.success).toBe(true);
      expect(contentResponse.body.data).toHaveProperty('content');
      expect(contentResponse.body.data.content).toHaveProperty('contentType');
      expect(['text', 'html', 'hybrid']).toContain(contentResponse.body.data.content.contentType);
      expect(contentResponse.body.data).toHaveProperty('metadata');

      console.log('✅ Generated content, type:', contentResponse.body.data.content.contentType);
      console.log('✅ Word count:', contentResponse.body.data.metadata.wordCount);
    }, 60000); // 60 second timeout for real AI calls

    it('should handle direct user input flow with real AI', async () => {
      // Step 1: Get recommendations first to get sessionId
      console.log('Step 1: Getting session...');
      const recommendResponse = await request(expressApp)
        .post('/api/recommendations')
        .send({
          canvasContext: {
            nearbyContent: ['量子力学'],
          },
        })
        .expect(200);

      const { sessionId } = recommendResponse.body.data;

      // Step 2: Use direct input
      console.log('Step 2: Generating content from direct input...');
      const contentResponse = await request(expressApp)
        .post('/api/content/generate')
        .send({
          sessionId,
          userInput: '请用简单的语言解释薛定谔方程',
          context: {
            userPreferences: {
              style: 'casual',
              language: 'zh-CN',
            },
          },
        })
        .expect(200);

      expect(contentResponse.body.success).toBe(true);
      expect(contentResponse.body.data.content).toBeDefined();
      expect(contentResponse.body.data.metadata.wordCount).toBeGreaterThan(10);

      console.log('✅ Generated content from direct input');
      console.log('✅ Word count:', contentResponse.body.data.metadata.wordCount);
    }, 60000); // 60 second timeout for real AI calls
  });

  describe('Health and Validation', () => {
    it('should return health status', async () => {
      const response = await request(expressApp)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
    });

    it('should handle invalid requests properly', async () => {
      const response = await request(expressApp)
        .post('/api/recommendations')
        .send({
          // Missing required canvasContext
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});