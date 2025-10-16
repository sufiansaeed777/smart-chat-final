<?php
/**
 * Cache handler for Synofex Chatbot
 *
 * @package SynofexChatbot
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Cache class for Synofex Chatbot
 */
class Synofex_Cache {

    /**
     * Cache prefix
     */
    private $prefix = 'synofex_';

    /**
     * Cache group
     */
    private $group = 'synofex_chatbot';

    /**
     * Constructor
     */
    public function __construct() {
        // Initialize cache if needed
    }

    /**
     * Get cached value
     *
     * @param string $key Cache key
     * @return mixed Cached value or false if not found
     */
    public function get($key) {
        $key = $this->prefix . $key;

        // Try object cache first
        $value = wp_cache_get($key, $this->group);

        if (false !== $value) {
            return $value;
        }

        // Fallback to transients for persistent caching
        $value = get_transient($key);

        if (false !== $value) {
            // Store in object cache for this request
            wp_cache_set($key, $value, $this->group);
            return $value;
        }

        return false;
    }

    /**
     * Set cache value
     *
     * @param string $key Cache key
     * @param mixed $value Value to cache
     * @param int $expiration Expiration time in seconds
     * @return bool Success
     */
    public function set($key, $value, $expiration = 3600) {
        $key = $this->prefix . $key;

        // Store in object cache for immediate access
        wp_cache_set($key, $value, $this->group, $expiration);

        // Store in transients for persistence
        return set_transient($key, $value, $expiration);
    }

    /**
     * Delete cached value
     *
     * @param string $key Cache key
     * @return bool Success
     */
    public function delete($key) {
        $key = $this->prefix . $key;

        // Delete from object cache
        wp_cache_delete($key, $this->group);

        // Delete from transients
        return delete_transient($key);
    }

    /**
     * Clear all cache
     *
     * @return bool Success
     */
    public function flush() {
        // Clear object cache for this group
        wp_cache_flush();

        // Clear all transients with our prefix
        global $wpdb;

        // Use wpdb->prepare() to safely escape LIKE patterns
        $sql = $wpdb->prepare(
            "DELETE FROM {$wpdb->options}
             WHERE option_name LIKE %s
             OR option_name LIKE %s",
            $wpdb->esc_like('_transient_' . $this->prefix) . '%',
            $wpdb->esc_like('_transient_timeout_' . $this->prefix) . '%'
        );

        return $wpdb->query($sql) !== false;
    }

    /**
     * Get multiple values at once
     *
     * @param array $keys Array of cache keys
     * @return array Array of values
     */
    public function get_multi($keys) {
        $values = [];

        foreach ($keys as $key) {
            $values[$key] = $this->get($key);
        }

        return $values;
    }

    /**
     * Set multiple values at once
     *
     * @param array $data Array of key-value pairs
     * @param int $expiration Expiration time in seconds
     * @return bool Success
     */
    public function set_multi($data, $expiration = 3600) {
        $success = true;

        foreach ($data as $key => $value) {
            if (!$this->set($key, $value, $expiration)) {
                $success = false;
            }
        }

        return $success;
    }

    /**
     * Check if cache key exists
     *
     * @param string $key Cache key
     * @return bool
     */
    public function exists($key) {
        return false !== $this->get($key);
    }

    /**
     * Increment numeric value
     *
     * @param string $key Cache key
     * @param int $offset Amount to increment
     * @return int|false New value or false on failure
     */
    public function increment($key, $offset = 1) {
        $value = $this->get($key);

        if (false === $value) {
            $value = 0;
        }

        $value = intval($value) + $offset;

        if ($this->set($key, $value)) {
            return $value;
        }

        return false;
    }

    /**
     * Decrement numeric value
     *
     * @param string $key Cache key
     * @param int $offset Amount to decrement
     * @return int|false New value or false on failure
     */
    public function decrement($key, $offset = 1) {
        return $this->increment($key, -$offset);
    }

    /**
     * Remember value with callback
     *
     * @param string $key Cache key
     * @param callable $callback Callback to generate value
     * @param int $expiration Expiration time in seconds
     * @return mixed Cached or generated value
     */
    public function remember($key, $callback, $expiration = 3600) {
        $value = $this->get($key);

        if (false === $value) {
            $value = call_user_func($callback);
            $this->set($key, $value, $expiration);
        }

        return $value;
    }
}