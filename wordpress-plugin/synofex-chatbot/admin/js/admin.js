/**
 * Synofex Chatbot Admin JavaScript
 * Version: 1.0.0
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        // Token validation
        $('#synofex-validate-token').on('click', function(e) {
            e.preventDefault();

            const $button = $(this);
            const $spinner = $button.find('.spinner');
            const token = $('#synofex_auth_token').val();

            if (!token) {
                alert(synofex_admin.strings.error_empty_token || 'Please enter a token first.');
                return;
            }

            // Disable button and show spinner
            $button.prop('disabled', true);
            $spinner.addClass('is-active');

            // Make AJAX request
            $.ajax({
                url: synofex_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'synofex_validate_token',
                    nonce: synofex_admin.nonce,
                    token: token
                },
                success: function(response) {
                    if (response.success) {
                        // Show success message
                        showNotice(synofex_admin.strings.success, 'success');

                        // Update UI to show valid status
                        $('.synofex-token-status').removeClass('invalid').addClass('valid');

                        // Reload page after 2 seconds to update settings
                        setTimeout(function() {
                            window.location.reload();
                        }, 2000);
                    } else {
                        // Show error message
                        showNotice(response.data || synofex_admin.strings.error, 'error');

                        // Update UI to show invalid status
                        $('.synofex-token-status').removeClass('valid').addClass('invalid');
                    }
                },
                error: function() {
                    showNotice('An error occurred while validating the token.', 'error');
                },
                complete: function() {
                    // Re-enable button and hide spinner
                    $button.prop('disabled', false);
                    $spinner.removeClass('is-active');
                }
            });
        });

        // Settings toggle
        $('.synofex-toggle-section').on('click', function() {
            const target = $(this).data('target');
            $('#' + target).slideToggle();
            $(this).toggleClass('active');
        });

        // Copy shortcode to clipboard
        $('.synofex-copy-shortcode').on('click', function(e) {
            e.preventDefault();

            const shortcode = $(this).data('shortcode');

            // Create temporary textarea
            const $temp = $('<textarea>');
            $('body').append($temp);
            $temp.val(shortcode).select();

            // Copy to clipboard
            document.execCommand('copy');
            $temp.remove();

            // Show feedback
            const $button = $(this);
            const originalText = $button.text();
            $button.text('Copied!');

            setTimeout(function() {
                $button.text(originalText);
            }, 2000);
        });

        // Widget preview
        $('#synofex_widget_position, #synofex_widget_theme').on('change', function() {
            updateWidgetPreview();
        });

        function updateWidgetPreview() {
            const position = $('#synofex_widget_position').val();
            const theme = $('#synofex_widget_theme').val();

            // Update preview iframe if it exists
            const $preview = $('#synofex-widget-preview');
            if ($preview.length) {
                $preview.attr('data-position', position);
                $preview.attr('data-theme', theme);
            }
        }

        // Show notice function
        function showNotice(message, type) {
            const noticeClass = type === 'success' ? 'notice-success' : 'notice-error';
            const $notice = $('<div class="notice ' + noticeClass + ' is-dismissible"><p>' + message + '</p></div>');

            $('.wrap h1').after($notice);

            // Auto dismiss after 5 seconds
            setTimeout(function() {
                $notice.fadeOut(function() {
                    $(this).remove();
                });
            }, 5000);
        }

        // Analytics refresh
        $('#synofex-refresh-analytics').on('click', function(e) {
            e.preventDefault();

            const $button = $(this);
            $button.prop('disabled', true).text('Refreshing...');

            // Fetch analytics data
            $.ajax({
                url: synofex_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'synofex_get_analytics',
                    nonce: synofex_admin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        // Update analytics display
                        updateAnalyticsDisplay(response.data);
                    }
                },
                complete: function() {
                    $button.prop('disabled', false).text('Refresh');
                }
            });
        });

        function updateAnalyticsDisplay(data) {
            $('#total-conversations').text(data.total_conversations || 0);
            $('#messages-today').text(data.messages_today || 0);
            $('#active-sessions').text(data.active_sessions || 0);
            $('#avg-response-time').text(data.avg_response_time || 'N/A');
        }

        // Connection test
        $('#synofex-test-connection').on('click', function(e) {
            e.preventDefault();

            const $button = $(this);
            const $result = $('#connection-test-result');

            $button.prop('disabled', true);
            $result.html('<span class="spinner is-active"></span> Testing connection...');

            $.ajax({
                url: synofex_admin.ajax_url,
                type: 'POST',
                data: {
                    action: 'synofex_test_connection',
                    nonce: synofex_admin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        $result.html('<span style="color: green;">✓ Connection successful!</span>');
                    } else {
                        $result.html('<span style="color: red;">✗ Connection failed: ' + response.data + '</span>');
                    }
                },
                error: function() {
                    $result.html('<span style="color: red;">✗ Connection test failed.</span>');
                },
                complete: function() {
                    $button.prop('disabled', false);
                }
            });
        });

        // Auto-save settings
        let saveTimeout;
        $('.synofex-auto-save').on('change', function() {
            clearTimeout(saveTimeout);

            const $input = $(this);
            const $spinner = $input.siblings('.spinner');

            $spinner.addClass('is-active');

            saveTimeout = setTimeout(function() {
                // Save the setting
                $.ajax({
                    url: synofex_admin.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'synofex_auto_save',
                        nonce: synofex_admin.nonce,
                        field: $input.attr('name'),
                        value: $input.is(':checkbox') ? ($input.is(':checked') ? 1 : 0) : $input.val()
                    },
                    success: function(response) {
                        if (response.success) {
                            $spinner.removeClass('is-active');
                            showNotice('Settings saved automatically.', 'success');
                        }
                    }
                });
            }, 1000);
        });
    });

})(jQuery);