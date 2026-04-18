// Simple test to verify DeepSeek API connection
import { DeepSeekClient } from './src/services/deepseek-client';

async function testDeepSeekConnection() {
  console.log('Testing DeepSeek API connection...');

  const client = new DeepSeekClient();

  try {
    const response = await client.chat({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "API connection successful!" in JSON format: {"result": "message"}' }
      ],
      response_format: { type: 'json_object' }
    });

    console.log('✅ DeepSeek API connection successful!');
    console.log('Response:', response.choices[0].message.content);
    console.log('Usage:', response.usage);

    return response;
  } catch (error) {
    console.error('❌ DeepSeek API connection failed:', error);
    throw error;
  }
}

// Run the test
testDeepSeekConnection()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });