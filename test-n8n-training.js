/**
 * Test n8n Training Functionality
 * This script tests if n8n can properly receive and process training data
 */

// Use native fetch (available in Node.js 18+)

// Test configuration
const N8N_WEBHOOK_URL = 'https://synofexai.app.n8n.cloud/webhook/c724f29c-cc20-4409-90c2-d4a494ad3e41';
const TEST_DOCUMENT = {
  botId: 'test-bot-123',
  botName: 'Test Bot',
  documentId: 'test-doc-456',
  documentName: 'test-document.txt',
  documentContent: 'This is a test document content. It contains information about testing the n8n training workflow. The document should be processed, chunked, and embedded properly.',
  documentType: 'text/plain',
  action: 'train'
};

async function testN8nTraining() {
  console.log('🧪 Testing n8n Training Workflow');
  console.log('================================\n');

  console.log('📦 Test Data:');
  console.log(JSON.stringify(TEST_DOCUMENT, null, 2));
  console.log('\n📡 Sending to n8n webhook...\n');

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_DOCUMENT),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type:`, response.headers.get('content-type'));

    const responseText = await response.text();
    console.log(`\n📝 Raw Response Body:`);
    console.log(responseText || '(empty response)');

    // Try to parse as JSON
    if (responseText) {
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('\n✅ Parsed JSON Response:');
        console.log(JSON.stringify(jsonResponse, null, 2));

        if (jsonResponse.success) {
          console.log('\n🎉 SUCCESS: n8n training workflow is working!');
        } else {
          console.log('\n⚠️ WARNING: n8n responded but indicated failure');
          console.log('Message:', jsonResponse.message || 'No message provided');
        }
      } catch (parseError) {
        console.log('\n⚠️ Response is not valid JSON');
        console.log('This might indicate the n8n workflow is not configured for training');
      }
    } else {
      console.log('\n❌ ERROR: Empty response from n8n');
      console.log('This usually means the workflow doesn\'t handle training requests');
      console.log('\n🔧 SOLUTION:');
      console.log('1. Open n8n workflow');
      console.log('2. Add a Switch node after the Webhook node');
      console.log('3. Check for action === "train"');
      console.log('4. Add training logic branch:');
      console.log('   - Parse document content');
      console.log('   - Chunk text (use Code node)');
      console.log('   - Generate embeddings (OpenAI node with text-embedding-3-large)');
      console.log('   - Store in PostgreSQL with pgvector');
      console.log('5. Return success response');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('Could not connect to n8n webhook');
    }
  }
}

// Test with different document types
async function testMultipleDocTypes() {
  console.log('\n\n🧪 Testing Multiple Document Types');
  console.log('===================================\n');

  const testDocs = [
    {
      ...TEST_DOCUMENT,
      documentName: 'test.txt',
      documentType: 'text/plain',
      documentContent: 'Plain text content for testing.'
    },
    {
      ...TEST_DOCUMENT,
      documentName: 'test.pdf',
      documentType: 'application/pdf',
      documentContent: 'Extracted PDF text content. This would be the actual text extracted from a PDF file.'
    },
    {
      ...TEST_DOCUMENT,
      documentName: 'test.docx',
      documentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      documentContent: 'Extracted Word document content. This represents text extracted from a Word file.'
    }
  ];

  for (const doc of testDocs) {
    console.log(`\n📄 Testing ${doc.documentName} (${doc.documentType})`);

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(doc),
      });

      const responseText = await response.text();

      if (response.ok && responseText) {
        console.log(`  ✅ ${doc.documentName}: Received response`);
      } else if (response.ok && !responseText) {
        console.log(`  ⚠️ ${doc.documentName}: Empty response (workflow needs training branch)`);
      } else {
        console.log(`  ❌ ${doc.documentName}: Failed with status ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ ${doc.documentName}: Error - ${error.message}`);
    }
  }
}

// Run tests
async function runAllTests() {
  await testN8nTraining();
  await testMultipleDocTypes();

  console.log('\n\n📊 Test Summary');
  console.log('===============');
  console.log('If you see empty responses, the n8n workflow needs to be updated to handle training.');
  console.log('The chat functionality might work, but training is not implemented in the workflow.');
  console.log('\nNext steps:');
  console.log('1. Contact n8n team or workflow owner');
  console.log('2. Request adding training branch to workflow');
  console.log('3. Ensure it processes: parse → chunk → embed → store');
}

runAllTests().catch(console.error);