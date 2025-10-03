// DNS Fix for Supabase connection issues
const dns = require('dns');

// Override DNS resolution for Supabase domains
const originalLookup = dns.lookup;

dns.lookup = function(hostname, options, callback) {
  // Handle different function signatures
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  // Map Supabase hostnames to their IPs
  const hostMap = {
    'aws-1-ap-southeast-1.pooler.supabase.com': '13.213.241.248',
    'db.aucvnpwyrbefzfiqnrvd.supabase.co': '13.213.241.248' // Using pooler IP as fallback
  };

  if (hostMap[hostname]) {
    console.log(`[DNS Fix] Resolving ${hostname} to ${hostMap[hostname]}`);
    return callback(null, hostMap[hostname], 4);
  }

  // Fall back to original DNS lookup for other hosts
  return originalLookup.call(this, hostname, options, callback);
};

console.log('[DNS Fix] Supabase DNS override loaded');

module.exports = dns;