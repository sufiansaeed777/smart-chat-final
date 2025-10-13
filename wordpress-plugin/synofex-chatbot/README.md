# Synofex AI Chatbot for WordPress

## Description

Synofex AI Chatbot is a powerful WordPress plugin that integrates an AI-powered chatbot into your website. It provides advanced features including document training, multi-language support, and human handoff capabilities.

## Requirements

- WordPress 6.0 or higher
- PHP 8.1 or higher
- Active Synofex account with valid API token

## Installation

### Method 1: Upload via WordPress Admin

1. Download the plugin ZIP file from your Synofex dashboard
2. In WordPress admin, go to **Plugins > Add New**
3. Click **Upload Plugin**
4. Choose the ZIP file and click **Install Now**
5. After installation, click **Activate Plugin**

### Method 2: Manual Installation

1. Download and extract the plugin ZIP file
2. Upload the `synofex-chatbot` folder to `/wp-content/plugins/` directory
3. Go to **Plugins** in WordPress admin
4. Find "Synofex AI Chatbot" and click **Activate**

## Configuration

### Initial Setup

1. After activation, go to **Synofex Chatbot** in the WordPress admin menu
2. Enter your **Authentication Token** from the Synofex dashboard
3. Verify that your domain is properly bound to the token
4. Click **Save Settings**

### Widget Settings

- **Enable chat widget**: Toggle to show/hide the chatbot on your site
- **Widget Position**: Choose between bottom-right or bottom-left
- **Widget Theme**: Select light or dark theme

## Troubleshooting

### "Failed to write file to disk" Error

This error typically occurs due to file permission issues. To resolve:

1. **Check File Permissions**:
   - Ensure `/wp-content/uploads/` directory has write permissions (755 or 775)
   - The web server user (www-data, apache, or nginx) should own the uploads directory

2. **Check PHP Settings**:
   - Verify `upload_max_filesize` in php.ini is sufficient
   - Check `post_max_size` is larger than the plugin size
   - Ensure `file_uploads` is set to `On`

3. **Check Disk Space**:
   - Verify your server has sufficient disk space
   - Check the temp directory has available space

4. **Fix Permissions via SSH/FTP**:
   ```bash
   # Set correct ownership (replace www-data with your web server user)
   sudo chown -R www-data:www-data /path/to/wordpress/wp-content/uploads

   # Set correct permissions
   sudo chmod -R 755 /path/to/wordpress/wp-content/uploads
   ```

5. **Alternative Solution**:
   - Extract the plugin ZIP file locally
   - Upload the extracted folder via FTP to `/wp-content/plugins/`
   - Activate the plugin from WordPress admin

### Token Validation Failed

- Ensure your domain matches the one configured in Synofex dashboard
- Verify the token hasn't expired
- Check that your site URL includes the correct protocol (http/https)

### Widget Not Showing

- Verify the token is validated successfully
- Check that the widget is enabled in settings
- Clear your browser cache and WordPress cache
- Check browser console for JavaScript errors

## Shortcode Usage

You can manually place the chatbot using the shortcode:

```
[synofex_chatbot position="bottom-right" theme="light"]
```

Parameters:
- `position`: "bottom-right" or "bottom-left"
- `theme`: "light" or "dark"

## API Endpoints

The plugin creates the following REST API endpoint:
- `/wp-json/synofex/v1/webhook` - For receiving webhook notifications

## Hooks and Filters

### Actions
- `synofex_chatbot_loaded` - Fired when the chatbot is fully loaded
- `synofex_message_sent` - Fired when a message is sent
- `synofex_message_received` - Fired when a response is received

### Filters
- `synofex_widget_config` - Modify widget configuration
- `synofex_api_timeout` - Change API request timeout (default: 30 seconds)

## Support

For support, please visit:
- Documentation: https://synofex.com/docs
- Support Portal: https://support.synofex.com
- Email: support@synofex.com

## Changelog

### Version 1.0.0
- Initial release
- Basic chat functionality
- Token-based authentication
- Customizable widget position and theme
- Admin dashboard with settings
- Shortcode support

## License

GPL v2 or later

---

© 2024 Synofex (SMC-Private) Limited. All rights reserved.