require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

async function createTestBot() {
  console.log('🤖 Creating Test Bot for WordPress Plugin...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    // 1. First, get or create a test user (manager)
    console.log('1️⃣ Checking for manager user...');

    let user;
    const userQuery = `SELECT id, email, role FROM "User" WHERE email = $1`;
    const userResult = await client.query(userQuery, ['manager@manager.com']);

    if (userResult.rows.length > 0) {
      user = userResult.rows[0];
      console.log('✅ Found user:', user.email);
    } else {
      console.log('❌ Manager user not found! Please run check-user.js first');
      process.exit(1);
    }

    // 2. Check if Bot table exists and create a test bot
    console.log('\n2️⃣ Creating test bot...');

    const botId = uuidv4();
    const secretToken = 'test_' + Math.random().toString(36).substring(2, 15);

    // Try to create bot (handle both table naming conventions)
    try {
      const createBotQuery = `
        INSERT INTO "Bot" (
          id,
          "userId",
          name,
          avatar,
          "welcomeMessage",
          placeholder,
          tone,
          language,
          "isActive",
          "primaryColor",
          "widgetPosition",
          "allowedDomains",
          "customInstructions",
          "aiModel",
          "maxTokens",
          temperature,
          "enableFileUpload",
          "enableVoiceInput",
          "requireEmail",
          "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          "isActive" = EXCLUDED."isActive"
        RETURNING id, name
      `;

      const botValues = [
        botId,                                    // id
        user.id,                                  // userId
        'WordPress Test Bot',                     // name
        null,                                     // avatar
        'Hello! I am your AI assistant. How can I help you today?', // welcomeMessage
        'Type your message here...',             // placeholder
        'professional',                           // tone
        'en',                                     // language
        true,                                     // isActive
        '#0066FF',                               // primaryColor
        'bottom-right',                          // widgetPosition
        ['localhost', 'wordpress.local'],       // allowedDomains (array)
        'You are a helpful AI assistant for a WordPress website.', // customInstructions
        'gpt-3.5-turbo',                        // aiModel
        500,                                     // maxTokens
        0.7,                                     // temperature
        false,                                   // enableFileUpload
        false,                                   // enableVoiceInput
        false,                                   // requireEmail
        new Date()                              // createdAt
      ];

      const botResult = await client.query(createBotQuery, botValues);
      console.log('✅ Bot created successfully!');
      console.log('   Bot ID:', botId);
      console.log('   Bot Name:', botResult.rows[0].name);

    } catch (err) {
      // If Bot table doesn't exist, try bots table with correct column names
      console.log('⚠️  Bot table might not exist, checking column names...');

      // First check what columns exist in bots table
      const checkColumnsQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'bots'
        AND table_schema = 'public'
      `;

      const columnsResult = await client.query(checkColumnsQuery);
      const columns = columnsResult.rows.map(row => row.column_name);
      console.log('Found columns in bots table:', columns.join(', '));

      // Use the actual columns that exist in the bots table (with proper case)
      const simpleBotQuery = `
        INSERT INTO bots (
          id,
          name,
          description,
          domain,
          status,
          "createdBy",
          "createdAt",
          "welcomeMessage",
          "systemPrompt",
          model,
          temperature,
          "maxTokens",
          "isPublic",
          "planType"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          status = EXCLUDED.status,
          "welcomeMessage" = EXCLUDED."welcomeMessage"
        RETURNING id, name
      `;

      const result = await client.query(simpleBotQuery, [
        botId,                                    // id
        'WordPress Test Bot',                     // name
        'AI Assistant for WordPress website',     // description
        'localhost',                              // domain
        'active',                                 // status
        user.id,                                  // createdBy
        new Date(),                              // createdAt
        'Hello! I am your AI assistant. How can I help you today?', // welcomeMessage
        'You are a helpful AI assistant for a WordPress website. Be professional and helpful.', // systemPrompt
        'gpt-3.5-turbo',                         // model
        0.7,                                     // temperature
        500,                                     // maxTokens
        false,                                   // isPublic
        'free'                                   // planType
      ]);

      console.log('✅ Bot created in bots table');
      console.log('   Bot ID:', result.rows[0].id);
    }

    // 3. Generate WordPress plugin token
    const wpToken = `${user.id}:${botId}:${secretToken}`;

    console.log('\n3️⃣ WordPress Plugin Configuration:\n');
    console.log('========================================');
    console.log('🔑 AUTH TOKEN (copy this to WordPress):');
    console.log(`   ${wpToken}`);
    console.log('');
    console.log('🌐 API URL:');
    console.log('   http://localhost:3000');
    console.log('========================================');

    // 4. Save token info for reference
    console.log('\n4️⃣ Token Breakdown (for debugging):');
    console.log('   User ID:', user.id);
    console.log('   Bot ID:', botId);
    console.log('   Secret:', secretToken);

    console.log('\n✅ Setup Complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Install WordPress locally (XAMPP/WAMP/Local by Flywheel)');
    console.log('   2. Copy the plugin folder to: wp-content/plugins/synofex-chatbot/');
    console.log('   3. Activate the plugin in WordPress admin');
    console.log('   4. Go to Settings → Synofex Chatbot');
    console.log('   5. Paste the AUTH TOKEN above');
    console.log('   6. Set API URL to: http://localhost:3000');
    console.log('   7. Save settings and visit your site - chat widget should appear!');

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
}

// Check if uuid is installed
try {
  require('uuid');
  createTestBot();
} catch (err) {
  console.log('📦 Installing uuid package...');
  const { execSync } = require('child_process');
  execSync('npm install uuid', { stdio: 'inherit' });
  console.log('✅ Package installed, please run the script again.');
}