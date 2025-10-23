# WordPress Plugin Fix - Deployment Instructions

## Issues Fixed

The following JavaScript errors have been resolved:

1. **scrollHeight Error**: `Cannot read properties of undefined (reading 'scrollHeight')`
   - Fixed in: `public/js/chat-widget.js:262-269`
   - Added null check before accessing DOM element

2. **markMessagesAsRead Error**: `this.markMessagesAsRead is not a function`
   - Fixed in: `public/js/chat-widget.js:380-386`
   - Added missing function definition
   - Added safety check in `openChat` function (line 120-122)

3. **Send Button & Enter Key Not Working**
   - Fixed: All event listeners are properly configured
   - Form submission handler added (line 80-83)
   - Send button click handler (line 74-77)
   - Enter key handler (line 66-71)

## Version Update

Plugin version updated from **1.0.0** to **1.0.1** to force cache refresh.

## Deployment Steps

### Option 1: Replace Plugin Files (Recommended)

1. **Backup Current Plugin**
   - In WordPress admin, go to Plugins > Installed Plugins
   - Locate "Synofex AI Chatbot"
   - Take a note of your current settings

2. **Deactivate and Delete**
   - Deactivate the plugin
   - Delete the plugin (your settings should be preserved in the database)

3. **Upload New Version**
   - Zip the entire folder: `smart-chat-main/wordpress-plugin/synofex-chatbot/`
   - In WordPress admin, go to Plugins > Add New > Upload Plugin
   - Upload the zip file
   - Click "Install Now"

4. **Activate Plugin**
   - Activate the plugin
   - Verify your settings are still in place
   - Test the chatbot

### Option 2: Manual File Replacement via FTP/cPanel

1. **Connect to Your Server**
   - Use FTP client or cPanel File Manager

2. **Navigate to Plugin Directory**
   - Path: `/wp-content/plugins/synofex-chatbot/`

3. **Replace Files**
   - Replace `synofex-chatbot.php` (version number updated)
   - Replace `public/js/chat-widget.js` (fixes applied)

4. **Clear Caches**
   - Clear WordPress cache (if using caching plugin)
   - Clear browser cache
   - In WordPress admin: Go to Settings > Synofex Chatbot and save settings (this will regenerate transients)

### Option 3: Quick Cache Clear (If you have SSH access)

```bash
# Navigate to WordPress directory
cd /path/to/wordpress

# Clear WordPress transients
wp transient delete --all

# Clear object cache if using Redis/Memcached
wp cache flush
```

## Post-Deployment Verification

1. **Check Browser Console**
   - Open your WordPress site
   - Press F12 to open Developer Tools
   - Go to Console tab
   - Verify NO errors appear when chatbot loads

2. **Test Chatbot Functionality**
   - Click the chat toggle button (should open)
   - Try typing a message
   - Press Enter key (should send message)
   - Click send button (should send message)
   - Click close button (should close chat)

3. **Verify Version**
   - In browser console, you should see: `chat-widget.js?ver=1.0.1`
   - If you still see `ver=1.0.0`, clear browser cache (Ctrl+Shift+Delete)

## Troubleshooting

### If errors persist after deployment:

1. **Hard Refresh Browser**
   - Chrome/Firefox: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
   - Or clear browser cache completely

2. **Check Plugin Activation**
   - Ensure plugin is activated in WordPress admin

3. **Verify Token Configuration**
   - Go to WordPress Admin > Synofex Chatbot
   - Ensure authentication token is configured and valid

4. **Check WordPress Caching Plugins**
   - If using WP Super Cache, W3 Total Cache, etc., clear all caches
   - Consider temporarily disabling caching plugin for testing

5. **Browser Developer Tools**
   - Check Network tab to see if chat-widget.js is loading with version 1.0.1
   - Look for any 404 errors for missing files

## Technical Details

### Files Modified:
- `synofex-chatbot.php` - Version updated to 1.0.1
- `public/js/chat-widget.js` - Already contains all fixes from previous commit

### What Changed in JavaScript:

```javascript
// BEFORE (causing error):
scrollToBottom: function() {
    const messagesContainer = $('#synofex-chat-messages');
    messagesContainer.scrollTop(messagesContainer[0].scrollHeight); // Error if element doesn't exist
}

// AFTER (fixed):
scrollToBottom: function() {
    const messagesContainer = $('#synofex-chat-messages');
    if (messagesContainer.length && messagesContainer[0]) { // Added null check
        messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
    }
}
```

## Support

If issues persist after following these steps, please check:
- WordPress error logs: `/wp-content/debug.log`
- Server error logs
- Browser console for detailed error messages

Contact: support@synofex.com
