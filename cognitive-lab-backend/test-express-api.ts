// Test Express API directly without Jest overhead
import request from 'supertest';
import App from './src/app';

async function testExpressAPI() {
  console.log('🧪 Testing Express API directly...\n');

  const app = new App();
  const expressApp = app.getApp();

  try {
    // Test 1: Health check
    console.log('Step 1: Testing health endpoint...');
    const healthResponse = await request(expressApp)
      .get('/health')
      .expect(200);

    console.log('✅ Health check passed:', healthResponse.body.status);

    // Test 2: API info
    console.log('\nStep 2: Testing API info...');
    const infoResponse = await request(expressApp)
      .get('/api')
      .expect(200);

    console.log('✅ API info passed:', infoResponse.body.message);

    // Test 3: Recommendations API with timeout
    console.log('\nStep 3: Testing recommendations API (this may take 15-20 seconds)...');
    const recommendResponse = await request(expressApp)
      .post('/api/recommendations')
      .send({
        canvasContext: {
          nearbyContent: ['基础数学'],
        },
      });

    console.log('Recommendations API status:', recommendResponse.status);

    if (recommendResponse.status === 200) {
      console.log('✅ Recommendations API passed!');
      console.log('Session ID:', recommendResponse.body.data.sessionId);
      console.log('Options:', recommendResponse.body.data.options.length, 'options');

      // Test 4: Content generation API
      console.log('\nStep 4: Testing content generation API (this may take 15-20 seconds)...');
      const contentResponse = await request(expressApp)
        .post('/api/content/generate')
        .send({
          sessionId: recommendResponse.body.data.sessionId,
          userInput: '解释一下什么是质数，用一句话',
        });

      console.log('Content generation API status:', contentResponse.status);

      if (contentResponse.status === 200) {
        console.log('✅ Content generation API passed!');
        console.log('Content type:', contentResponse.body.data.content.contentType);
        console.log('Word count:', contentResponse.body.data.metadata.wordCount);
        console.log('\n🎉 All Express API tests successful!');
      } else {
        console.log('❌ Content generation failed:', contentResponse.body);
      }
    } else {
      console.log('❌ Recommendations API failed:', recommendResponse.body);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  process.exit(0);
}

// Run the test
testExpressAPI();