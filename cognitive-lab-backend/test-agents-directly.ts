// Test agents directly without Express overhead
import { OptionsAgent } from './src/agents/options-agent';
import { ContentAgent } from './src/agents/content-agent';
import { SessionManager } from './src/services/session-manager';

async function testAgentsDirectly() {
  console.log('🧪 Testing Agents directly...\n');

  // Create shared session manager
  const sessionManager = new SessionManager();

  const optionsAgent = new OptionsAgent();
  const contentAgent = new ContentAgent(sessionManager);

  try {
    // Step 1: Test OptionsAgent
    console.log('Step 1: Testing OptionsAgent...');
    const recommendRequest = {
      canvasContext: {
        nearbyContent: ['微积分', '函数极限'],
        userHistory: ['数学分析'],
        currentTheme: 'academic',
      },
    };

    console.log('Request:', JSON.stringify(recommendRequest, null, 2));

    const recommendResponse = await optionsAgent.execute(recommendRequest);

    console.log('✅ OptionsAgent response:');
    console.log('  Session ID:', recommendResponse.sessionId);
    console.log('  Options count:', recommendResponse.options.length);
    console.log('  Processing time:', recommendResponse.metadata.processingTime, 'ms');

    // Save session
    sessionManager.createSession(recommendResponse.sessionId, recommendResponse.options);
    console.log('✅ Session saved');

    // Step 2: Test ContentAgent
    console.log('\nStep 2: Testing ContentAgent...');
    const contentRequest = {
      sessionId: recommendResponse.sessionId,
      selectedOptionId: recommendResponse.options[0].optionId,
    };

    console.log('Request:', JSON.stringify(contentRequest, null, 2));

    const contentResponse = await contentAgent.execute(contentRequest);

    console.log('✅ ContentAgent response:');
    console.log('  Content type:', contentResponse.content.contentType);
    console.log('  Word count:', contentResponse.metadata.wordCount);
    console.log('  Processing time:', contentResponse.metadata.processingTime, 'ms');
    console.log('  Confidence:', contentResponse.metadata.confidence);

    console.log('\n🎉 All tests passed! DeepSeek API is working correctly.');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testAgentsDirectly()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });