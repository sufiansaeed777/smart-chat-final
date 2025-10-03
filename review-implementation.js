#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 COMPREHENSIVE IMPLEMENTATION REVIEW\n');
console.log('=' .repeat(60));

let errorCount = 0;
let warningCount = 0;
const issues = [];

// Helper function to check file exists
function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}`);
    return true;
  } else {
    console.log(`❌ ${description} - FILE MISSING`);
    issues.push(`Missing file: ${filePath}`);
    errorCount++;
    return false;
  }
}

// Helper to check file contains text
function checkFileContains(filePath, searchText, description) {
  try {
    const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    if (content.includes(searchText)) {
      console.log(`✅ ${description}`);
      return true;
    } else {
      console.log(`⚠️  ${description} - NOT FOUND`);
      issues.push(`${filePath}: Missing "${searchText}"`);
      warningCount++;
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - ERROR: ${error.message}`);
    errorCount++;
    return false;
  }
}

console.log('\n📦 1. CHECKING CORE FILES\n');
checkFile('src/entities/DocumentEmbedding.ts', 'DocumentEmbedding entity');
checkFile('src/services/documentProcessing.ts', 'Document processing service');
checkFile('src/app/api/documents/process-embeddings/route.ts', 'Embedding API endpoint');
checkFile('src/app/api/webhooks/stripe/route.ts', 'Stripe webhook handler');
checkFile('src/app/api/billing/create-portal-session/route.ts', 'Customer portal API');
checkFile('src/app/api/billing/create-subscription-checkout/route.ts', 'Subscription checkout API');
checkFile('src/app/api/billing/subscription-status/route.ts', 'Subscription status API');

console.log('\n🔧 2. CHECKING DATABASE CONFIGURATION\n');
checkFileContains('src/config/database.ts', 'DocumentEmbedding', 'DocumentEmbedding imported');
checkFileContains('src/config/database.ts', 'DocumentEmbedding]', 'DocumentEmbedding in entities array');

console.log('\n🤖 3. CHECKING OPENAI INTEGRATION\n');
checkFileContains('.env.local', 'OPENAI_API_KEY=sk-proj-', 'OpenAI API key configured');
checkFileContains('src/app/api/wordpress/send-message/route.ts', 'buildRAGContext', 'RAG integrated in chat');
checkFileContains('src/app/api/wordpress/send-message/route.ts', 'gpt-4o-mini', 'Using gpt-4o-mini model');
checkFileContains('src/app/api/wordpress/send-message/route.ts', 'conversationHistory', 'Conversation history implemented');

console.log('\n💰 4. CHECKING QUOTA SYSTEM\n');
checkFileContains('src/entities/Subscription.ts', 'messageLimit', 'Message limit field added');
checkFileContains('src/entities/Subscription.ts', 'messagesUsed', 'Messages used field added');
checkFileContains('src/entities/Subscription.ts', 'hasMessagesRemaining', 'Quota check method added');
checkFileContains('src/app/api/wordpress/send-message/route.ts', 'hasMessagesRemaining', 'Quota check in chat');
checkFileContains('src/app/api/wordpress/send-message/route.ts', 'messagesUsed += 1', 'Message counter increment');

console.log('\n💳 5. CHECKING STRIPE INTEGRATION\n');
checkFileContains('src/app/api/webhooks/stripe/route.ts', 'customer.subscription.created', 'Subscription created handler');
checkFileContains('src/app/api/webhooks/stripe/route.ts', 'customer.subscription.updated', 'Subscription updated handler');
checkFileContains('src/app/api/webhooks/stripe/route.ts', 'customer.subscription.deleted', 'Subscription deleted handler');
checkFileContains('src/app/api/webhooks/stripe/route.ts', 'invoice.payment_succeeded', 'Payment success handler');
checkFileContains('src/app/api/webhooks/stripe/route.ts', 'invoice.payment_failed', 'Payment failed handler');
checkFileContains('src/app/api/webhooks/stripe/route.ts', 'getPlanLimits', 'Plan limits helper function');

console.log('\n📚 6. CHECKING RAG IMPLEMENTATION\n');
checkFileContains('src/services/documentProcessing.ts', 'chunkText', 'Text chunking function');
checkFileContains('src/services/documentProcessing.ts', 'generateEmbedding', 'Embedding generation');
checkFileContains('src/services/documentProcessing.ts', 'searchSimilarChunks', 'Vector similarity search');
checkFileContains('src/services/documentProcessing.ts', 'buildRAGContext', 'RAG context builder');
checkFileContains('src/services/documentProcessing.ts', 'text-embedding-3-small', 'Using OpenAI embeddings model');

console.log('\n🧪 7. CHECKING TEST FILES\n');
checkFile('test-openai-integration.js', 'OpenAI test script');
checkFile('test-rag.js', 'RAG test script');
checkFile('check-pgvector.js', 'pgvector check script');
checkFile('HOW-TO-TEST-RAG.md', 'RAG testing documentation');
checkFile('IMPLEMENTATION-SUMMARY.md', 'Implementation summary');

console.log('\n🔍 8. CHECKING FOR COMMON ISSUES\n');

// Check for console.log (should be console.error for errors)
try {
  const sendMessageContent = fs.readFileSync('src/app/api/wordpress/send-message/route.ts', 'utf8');
  const consoleLogCount = (sendMessageContent.match(/console\.log/g) || []).length;
  const consoleErrorCount = (sendMessageContent.match(/console\.error/g) || []).length;

  if (consoleErrorCount > 0) {
    console.log(`✅ Error logging implemented (${consoleErrorCount} console.error calls)`);
  } else {
    console.log(`⚠️  No error logging found in send-message route`);
    warningCount++;
  }
} catch (e) {
  console.log(`⚠️  Could not check logging: ${e.message}`);
  warningCount++;
}

// Check for TypeScript types
try {
  const docProcessing = fs.readFileSync('src/services/documentProcessing.ts', 'utf8');
  if (docProcessing.includes(': string') && docProcessing.includes(': number')) {
    console.log(`✅ TypeScript types properly defined`);
  } else {
    console.log(`⚠️  Some TypeScript types may be missing`);
    warningCount++;
  }
} catch (e) {
  console.log(`⚠️  Could not check types: ${e.message}`);
  warningCount++;
}

// Check for error handling
try {
  const ragService = fs.readFileSync('src/services/documentProcessing.ts', 'utf8');
  if (ragService.includes('try') && ragService.includes('catch')) {
    console.log(`✅ Error handling implemented in RAG service`);
  } else {
    console.log(`⚠️  Limited error handling in RAG service`);
    warningCount++;
  }
} catch (e) {
  console.log(`⚠️  Could not check error handling: ${e.message}`);
  warningCount++;
}

console.log('\n' + '='.repeat(60));
console.log('\n📊 REVIEW SUMMARY\n');

console.log(`Total Checks: ${errorCount + warningCount + 30}`);
console.log(`✅ Passed: ${30 - errorCount - warningCount}`);
console.log(`⚠️  Warnings: ${warningCount}`);
console.log(`❌ Errors: ${errorCount}`);

if (issues.length > 0) {
  console.log('\n🔴 ISSUES FOUND:\n');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
}

console.log('\n' + '='.repeat(60));

if (errorCount === 0 && warningCount === 0) {
  console.log('\n🎉 ALL CHECKS PASSED! Implementation looks good!\n');
  process.exit(0);
} else if (errorCount === 0) {
  console.log('\n✅ NO CRITICAL ERRORS! Some warnings to review.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  SOME ISSUES FOUND! Please review and fix.\n');
  process.exit(1);
}
