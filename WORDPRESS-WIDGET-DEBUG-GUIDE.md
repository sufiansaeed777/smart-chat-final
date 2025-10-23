# WordPress Widget Debugging Guide

**Issue:** Widget not appearing on synofex.com
**Date:** 2025-10-18

---

## 🔍 STEP-BY-STEP DEBUGGING

### **Step 1: Check Browser Console (F12)**

1. **Open synofex.com**
2. **Press F12** (or Right-click → Inspect)
3. **Go to "Console" tab**
4. **Look for RED errors** (ignore warnings in yellow/blue)

**What to look for:**

❌ **Bad Signs (Errors):**
```
❌ jQuery is not defined
❌ synofex_config is not defined
❌ Failed to load resource: .../chat-widget.js
❌ Uncaught ReferenceError: $ is not defined
❌ Uncaught TypeError: Cannot read property...
```

✅ **Good Signs (Success Messages):**
```
✅ Synofex Chat: Initializing...
✅ Synofex Chat: Ready
✅ (No red errors)
```

**Screenshot your console and send it to me!**

---

### **Step 2: Check Network Tab**

1. **Stay in Developer Tools (F12)**
2. **Go to "Network" tab**
3. **Reload page (Ctrl+R)**
4. **Filter by "chat" or "synofex"**

**Check if these files load:**

✅ **Should see:**
```
✅ synofex-chatbot/public/js/chat-widget.js (Status: 200)
✅ synofex-chatbot/public/css/...  (Status: 200)
```

❌ **Bad signs:**
```
❌ chat-widget.js (Status: 404) - File not found
❌ chat-widget.js (Status: 403) - Permission denied
❌ Nothing with "synofex" in name - Plugin not loading at all
```

---

### **Step 3: Check if jQuery is Loaded**

In the Console tab, type:
```javascript
typeof jQuery
```

**Expected Result:**
```
✅ "function" - jQuery is loaded
❌ "undefined" - jQuery NOT loaded (this would break the widget)
```

---

### **Step 4: Check if Config is Loaded**

In the Console tab, type:
```javascript
console.log(window.synofex_config)
```

**Expected Result:**
```
✅ Object with: ajax_url, nonce, bot_id, bot_name, welcome_message
❌ undefined - Config not loaded (plugin not active or script not enqueued)
```

---

### **Step 5: Check if Widget HTML Exists**

In the Console tab, type:
```javascript
document.getElementById('synofex-chatbot-widget')
```

**Expected Result:**
```
✅ <div id="synofex-chatbot-widget" ...> - Widget HTML exists
❌ null - Widget HTML not rendered (plugin not active or should_load_widget() returned false)
```

---

### **Step 6: Manual Widget Show (Test)**

If widget HTML exists but is hidden, try showing it manually:

In the Console tab, type:
```javascript
jQuery('#synofex-chatbot-widget').fadeIn()
```

**If widget appears:** The HTML is there, just the JS didn't initialize
**If nothing happens:** Widget HTML doesn't exist at all

---

## 🎯 COMMON ISSUES & FIXES

### **Issue A: Plugin Not Active**

**Symptom:** No synofex files in Network tab, no widget HTML

**Fix:**
```
1. WordPress Admin → Plugins
2. Find "Synofex AI Chatbot"
3. Click "Activate" if deactivated
```

---

### **Issue B: Token Not Valid**

**Symptom:** Widget HTML doesn't exist

**Reason:** `should_load_widget()` checks if token is valid

**Fix:**
```
1. WordPress Admin → Settings → Synofex Chatbot
2. Check if "Token is valid and chatbot is active" shows
3. If not, re-enter token and click "Validate"
```

---

### **Issue C: jQuery Not Loaded**

**Symptom:** Console shows "jQuery is not defined"

**Fix:**
```php
// In WordPress theme functions.php, ensure jQuery is enqueued:
wp_enqueue_script('jquery');
```

Most themes include jQuery by default, but some don't.

---

### **Issue D: Cache Not Cleared**

**Symptom:** Old version of chat-widget.js loading (doesn't have fixes)

**Fix:**
```
1. Clear WordPress cache:
   - LiteSpeed: "Purge All"
   - WP Rocket: "Clear Cache"
   - Other: Find cache plugin and clear

2. Clear browser cache:
   - Ctrl+Shift+R (hard reload)
   - Or: Ctrl+Shift+Delete → Clear cache

3. Check Network tab for chat-widget.js?ver=1.0.0
   - If version doesn't change after clearing cache, cache not cleared properly
```

---

### **Issue E: Widget Disabled in Settings**

**Symptom:** Token valid, but widget HTML doesn't exist

**Check:**
```
1. WordPress Admin → Settings → Synofex Chatbot
2. Check "Enable chat widget" checkbox is CHECKED
3. Save Settings
```

---

### **Issue F: Old Plugin Still Installed**

**Symptom:** Widget not appearing even after re-uploading

**Fix:**
```
1. WordPress Admin → Plugins
2. Deactivate "Synofex AI Chatbot"
3. Delete "Synofex AI Chatbot"
4. Upload NEW plugin zip (with fixes)
5. Activate
6. Verify settings still there (they should be)
```

---

## 🚀 QUICK DEBUG COMMAND

Run this in browser console to get all debug info at once:

```javascript
console.log('=== SYNOFEX WIDGET DEBUG ===');
console.log('1. jQuery loaded:', typeof jQuery);
console.log('2. Config loaded:', window.synofex_config);
console.log('3. Widget HTML exists:', !!document.getElementById('synofex-chatbot-widget'));
console.log('4. Widget visible:', jQuery('#synofex-chatbot-widget').is(':visible'));
console.log('5. Widget styles:', jQuery('#synofex-chatbot-widget').css('display'));
console.log('=== END DEBUG ===');
```

**Copy the output and send to developer!**

---

## 📋 VERIFICATION CHECKLIST

Before contacting support, verify:

- [ ] Plugin is ACTIVE in WordPress
- [ ] Token shows as VALID in settings
- [ ] "Enable chat widget" is CHECKED
- [ ] Browser cache cleared (Ctrl+Shift+R)
- [ ] WordPress cache cleared
- [ ] Checked browser console for errors
- [ ] Checked Network tab for chat-widget.js
- [ ] jQuery is loaded (typeof jQuery = "function")
- [ ] Widget HTML exists in page source

---

## 🎯 EXPECTED WORKING STATE

When everything works correctly:

**Console:**
```
Synofex Chat: Initializing...
Synofex Chat: Ready
```

**Network Tab:**
```
✅ chat-widget.js (200 OK)
✅ admin.css (200 OK)
```

**Page:**
```
✅ Chat bubble visible in bottom-right corner
✅ Clicking opens chat window
✅ Can send messages
```

**DOM:**
```html
<div id="synofex-chatbot-widget" class="synofex-chatbot-widget synofex-widget-bottom-right synofex-theme-light" style="display: block;">
  <!-- Chat toggle button visible -->
  <!-- Chat window hidden until clicked -->
</div>
```

---

**If none of these steps help, send me:**
1. Screenshot of browser Console (F12 → Console tab)
2. Screenshot of Network tab (filtered by "synofex")
3. Output of the quick debug command above
4. Screenshot of WordPress → Settings → Synofex Chatbot page

