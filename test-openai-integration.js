require('dotenv').config({ path: '.env.local' });

async function testOpenAI() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  console.log('🔑 Testing OpenAI API Key...\n');
  console.log('API Key present:', !!OPENAI_API_KEY);
  console.log('API Key starts with:', OPENAI_API_KEY?.substring(0, 20) + '...\n');

  if (!OPENAI_API_KEY) {
    console.log('❌ No OpenAI API key found in .env.local');
    return;
  }

  try {
    console.log('📡 Making test request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: 'Say "Hello! I am working correctly!" if you can read this.' }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    console.log('Response status:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ SUCCESS! OpenAI API is working!\n');
      console.log('Model used:', data.model);
      console.log('Response:', data.choices[0].message.content);
      console.log('\nTokens used:');
      console.log('  - Prompt:', data.usage.prompt_tokens);
      console.log('  - Completion:', data.usage.completion_tokens);
      console.log('  - Total:', data.usage.total_tokens);
      console.log('\n✅ Your WordPress chatbot is now ready to use real AI! 🎉');
    } else {
      const errorText = await response.text();
      console.log('\n❌ OpenAI API Error:');
      console.log(errorText);
    }
  } catch (error) {
    console.error('\n❌ Error testing OpenAI:', error.message);
  }
}

testOpenAI();
