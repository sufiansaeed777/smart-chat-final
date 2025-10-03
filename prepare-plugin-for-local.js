const fs = require('fs');
const path = require('path');

console.log('Preparing WordPress plugin for LocalWP...\n');

// Update the plugin's API URL configuration
const pluginConfigPath = path.join(__dirname, 'wordpress-plugin', 'synofex-chatbot', 'includes', 'class-api-client.php');

if (fs.existsSync(pluginConfigPath)) {
  let content = fs.readFileSync(pluginConfigPath, 'utf8');

  // Check current API URL
  const currentUrlMatch = content.match(/private \$api_url = ['"]([^'"]+)['"]/);
  if (currentUrlMatch) {
    console.log('Current API URL:', currentUrlMatch[1]);
  }

  // For LocalWP, we need to use your computer's IP address or localhost
  // LocalWP sites can access localhost:3000
  const newApiUrl = 'http://localhost:3000';

  // Update the API URL
  content = content.replace(
    /private \$api_url = ['"][^'"]+['"]/,
    `private $api_url = '${newApiUrl}'`
  );

  fs.writeFileSync(pluginConfigPath, content);
  console.log('Updated API URL to:', newApiUrl);
  console.log('\n✅ Plugin is ready for LocalWP!');

  console.log('\nIMPORTANT NOTES:');
  console.log('1. Your Next.js app must be running (npm run dev)');
  console.log('2. LocalWP WordPress site will connect to: http://localhost:3000');
  console.log('3. Use the token from your Integrations page');

} else {
  console.log('❌ Plugin file not found at:', pluginConfigPath);
}

console.log('\n📦 The plugin is located at:');
console.log(path.join(__dirname, 'wordpress-plugin', 'synofex-chatbot'));
console.log('\nYou can also download it from: http://localhost:3000/dashboard/integrations');