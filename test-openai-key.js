require('dotenv').config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function testOpenAIKey() {
  console.log('Testing OpenAI API Key...\n');

  if (!OPENAI_API_KEY) {
    console.log('❌ No OpenAI API key found in .env.local');
    return;
  }

  console.log('Key found:', OPENAI_API_KEY.substring(0, 20) + '...');
  console.log('Testing API connection...\n');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, I am working!" in 5 words or less.'
          }
        ],
        max_tokens: 20
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ API Key is WORKING!');
      console.log('Response from OpenAI:', data.choices[0].message.content);
      console.log('\nAPI Key Status: VALID and ACTIVE');
    } else {
      console.log('❌ API Key is NOT working!');
      console.log('Status:', response.status);
      console.log('Error:', data.error?.message || 'Unknown error');

      if (response.status === 401) {
        console.log('\n⚠️  This key is invalid or expired.');
        console.log('You need to create a new API key at: https://platform.openai.com/api-keys');
      } else if (response.status === 429) {
        console.log('\n⚠️  Rate limit exceeded or quota exceeded.');
        console.log('Check your usage at: https://platform.openai.com/usage');
      } else if (response.status === 403) {
        console.log('\n⚠️  This key doesn\'t have access to GPT models.');
      }
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    console.log('Could not connect to OpenAI API');
  }
}

testOpenAIKey();