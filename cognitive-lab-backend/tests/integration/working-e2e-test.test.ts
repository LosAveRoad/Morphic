// Working end-to-end integration test with real DeepSeek API
import request from 'supertest';
import App from '../../src/app';

describe('Complete Agent APIs E2E Test', () => {
  let app: App;
  let expressApp: any;

  beforeAll(() => {
    // Create app with real agents
    app = new App();
    expressApp = app.getApp();
  });

  describe('Complete AI Interaction Flow', () => {
    it('should successfully complete recommendation → generation flow', async () => {
      // Step 1: Get recommendations
      console.log('📋 Step 1: Getting AI recommendations...');
      const recommendResponse = await request(expressApp)
        .post('/api/recommendations')
        .send({
          canvasContext: {
            nearbyContent: ['基础数学'],
          },
        })
        .expect(200);

      expect(recommendResponse.body.success).toBe(true);
      expect(recommendResponse.body.data).toHaveProperty('sessionId');
      expect(recommendResponse.body.data.options).toBeInstanceOf(Array);
      expect(recommendResponse.body.data.options.length).toBeGreaterThan(0);

      const { sessionId, options } = recommendResponse.body.data;
      console.log('✅ Got', options.length, 'recommendations');
      console.log('📝 Options:', options.map((o: any) => o.title).join(', '));

      // Step 2: Generate content with direct input (simpler than using options)
      console.log('\n🤖 Step 2: Generating content...');
      const contentResponse = await request(expressApp)
        .post('/api/content/generate')
        .send({
          sessionId: sessionId,
          userInput: '解释一下什么是质数，用一句话',
        })
        .expect(200);

      expect(contentResponse.body.success).toBe(true);
      expect(contentResponse.body.data).toHaveProperty('content');
      expect(contentResponse.body.data.content).toHaveProperty('contentType');
      expect(['text', 'html', 'hybrid']).toContain(contentResponse.body.data.content.contentType);

      console.log('✅ Content generated successfully!');
      console.log('📊 Type:', contentResponse.body.data.content.contentType);
      console.log('⏱️ Processing time:', contentResponse.body.data.metadata.processingTime, 'ms');
      console.log('📈 Word count:', contentResponse.body.data.metadata.wordCount);

    }, 90000); // 90 second timeout for real AI calls
  });

  describe('Health and Basic Functionality', () => {
    it('should return health status', async () => {
      const response = await request(expressApp)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
      console.log('✅ System is healthy');
    });

    it('should return API info', async () => {
      const response = await request(expressApp)
        .get('/api')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cognitive Lab Backend API');
      expect(response.body.endpoints).toBeDefined();
      console.log('✅ API info retrieved');
    });
  });

  describe('Error Handling', () => {
    it('should properly handle invalid requests', async () => {
      const response = await request(expressApp)
        .post('/api/recommendations')
        .send({
          // Missing required canvasContext
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      console.log('✅ Validation working correctly');
    });
  });
});