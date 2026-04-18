// Simple test with shorter content to avoid token limits
import { OptionsAgent } from './src/agents/options-agent';
import { ContentAgent } from './src/agents/content-agent';
import { SessionManager } from './src/services/session-manager';

async function testSimpleFlow() {
  console.log('🧪 Testing Simple AI Flow...\n');

  // Create shared session manager
  const sessionManager = new SessionManager();
  const optionsAgent = new OptionsAgent();
  const contentAgent = new ContentAgent(sessionManager);

  try {
    // Step 1: Test OptionsAgent with simple context
    console.log('Step 1: Getting recommendations for simple math...');
    const recommendRequest = {
      canvasContext: {
        nearbyContent: ['基础数学'],
      },
    };

    const recommendResponse = await optionsAgent.execute(recommendRequest);

    console.log('✅ Recommendations received:');
    console.log('  Session ID:', recommendResponse.sessionId);
    console.log('  Options:', recommendResponse.options.map(opt => opt.title).join(', '));

    // Save session
    sessionManager.createSession(recommendResponse.sessionId, recommendResponse.options);
    console.log('✅ Session saved');

    // Step 2: Test ContentAgent with direct input (simple request)
    console.log('\nStep 2: Generating simple content...');
    const contentRequest = {
      sessionId: recommendResponse.sessionId,
      userInput: '解释一下什么是质数，用一句话',
    };

    const contentResponse = await contentAgent.execute(contentRequest);

    console.log('✅ Content generated:');
    console.log('  Type:', contentResponse.content.contentType);
    console.log('  Content preview:', contentResponse.content.text?.plainText?.substring(0, 100) || 'N/A');
    console.log('  Word count:', contentResponse.metadata.wordCount);
    console.log('  Processing time:', contentResponse.metadata.processingTime, 'ms');

    console.log('\n🎉 Simple flow test successful!');
    console.log('💰 Your DeepSeek API should show usage of approximately:', 800 + 200 + ' tokens');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testSimpleFlow()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });