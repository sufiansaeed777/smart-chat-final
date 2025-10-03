require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function debugPassword() {
  const email = 'manager@manager.com';
  const expectedPassword = 'manager'; // The password you say is in Supabase

  console.log('🔍 Debugging password issue for: ' + email);
  console.log('   Expected password: ' + expectedPassword + '\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    // Get the user and their password hash
    console.log('1️⃣ Fetching user from database...');

    // Try both table formats
    let result;
    try {
      result = await client.query(
        'SELECT id, email, password, role, "isActive", "isEmailVerified" FROM "User" WHERE email = $1',
        [email]
      );
    } catch (e) {
      result = await client.query(
        'SELECT id, email, password, role, "isActive", "isEmailVerified" FROM users WHERE email = $1',
        [email]
      );
    }

    if (result.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }

    const user = result.rows[0];
    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Active:', user.isActive);
    console.log('   Email Verified:', user.isEmailVerified);
    console.log('   Has Password:', !!user.password);

    if (!user.password) {
      console.log('\n❌ No password is set in the database!');
      console.log('   The password field is NULL or empty.');

      // Set the password
      console.log('\n2️⃣ Setting password to "manager"...');
      const hashedPassword = await bcrypt.hash(expectedPassword, 12);

      try {
        await client.query(
          'UPDATE "User" SET password = $1 WHERE email = $2',
          [hashedPassword, email]
        );
      } catch (e) {
        await client.query(
          'UPDATE users SET password = $1 WHERE email = $2',
          [hashedPassword, email]
        );
      }

      console.log('✅ Password has been set to "manager"');
      console.log('   You can now login!');

    } else {
      console.log('\n2️⃣ Password hash from database:');
      console.log('   Hash:', user.password.substring(0, 20) + '...');
      console.log('   Hash length:', user.password.length);

      // Check if it's a bcrypt hash
      const isBcryptHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
      console.log('   Is bcrypt hash:', isBcryptHash ? 'Yes' : 'No');

      if (user.password === expectedPassword) {
        console.log('\n❌ PROBLEM FOUND: Password is stored as plain text!');
        console.log('   Database has: "' + user.password + '" (not hashed)');
        console.log('   This needs to be hashed for authentication to work.');

        // Fix it by hashing the password
        console.log('\n3️⃣ Fixing: Hashing the password...');
        const hashedPassword = await bcrypt.hash(expectedPassword, 12);

        try {
          await client.query(
            'UPDATE "User" SET password = $1 WHERE email = $2',
            [hashedPassword, email]
          );
        } catch (e) {
          await client.query(
            'UPDATE users SET password = $1 WHERE email = $2',
            [hashedPassword, email]
          );
        }

        console.log('✅ Password has been properly hashed!');
        console.log('   You can now login with password: "' + expectedPassword + '"');

      } else if (isBcryptHash) {
        console.log('\n3️⃣ Testing password against hash...');

        // Test the expected password
        const isValid = await bcrypt.compare(expectedPassword, user.password);
        console.log('   Password "' + expectedPassword + '":', isValid ? '✅ MATCHES' : '❌ DOES NOT MATCH');

        if (!isValid) {
          // The hash doesn't match "manager", so let's update it
          console.log('\n4️⃣ The stored hash does not match "manager"');
          console.log('   Updating password to "manager"...');

          const newHashedPassword = await bcrypt.hash(expectedPassword, 12);

          try {
            await client.query(
              'UPDATE "User" SET password = $1 WHERE email = $2',
              [newHashedPassword, email]
            );
          } catch (e) {
            await client.query(
              'UPDATE users SET password = $1 WHERE email = $2',
              [newHashedPassword, email]
            );
          }

          console.log('✅ Password has been updated to "manager"');
          console.log('   You can now login!');
        } else {
          console.log('\n✅ Password is correctly set and hashed!');
          console.log('   Authentication should work with:');
          console.log('   Email: ' + email);
          console.log('   Password: ' + expectedPassword);
        }
      } else {
        console.log('\n❌ Unknown password format in database');
        console.log('   Setting new password...');

        const hashedPassword = await bcrypt.hash(expectedPassword, 12);

        try {
          await client.query(
            'UPDATE "User" SET password = $1 WHERE email = $2',
            [hashedPassword, email]
          );
        } catch (e) {
          await client.query(
            'UPDATE users SET password = $1 WHERE email = $2',
            [hashedPassword, email]
          );
        }

        console.log('✅ Password has been set to "manager"');
      }
    }

    // Final check - ensure all auth requirements are met
    console.log('\n5️⃣ Final authentication requirements check:');
    const issues = [];

    if (!user.isActive) {
      issues.push('User is not active');
    }
    if (!user.isEmailVerified) {
      issues.push('Email is not verified');
    }

    if (issues.length > 0) {
      console.log('❌ Found issues that need fixing:');
      issues.forEach(issue => console.log('   - ' + issue));

      console.log('\n   Fixing issues...');
      try {
        await client.query(
          'UPDATE "User" SET "isActive" = true, "isEmailVerified" = true WHERE email = $1',
          [email]
        );
      } catch (e) {
        await client.query(
          'UPDATE users SET "isActive" = true, "isEmailVerified" = true WHERE email = $1',
          [email]
        );
      }
      console.log('✅ Issues fixed!');
    } else {
      console.log('✅ All requirements are met');
    }

    console.log('\n🎉 SUMMARY:');
    console.log('   Email: ' + email);
    console.log('   Password: ' + expectedPassword);
    console.log('   Status: Ready to login!');

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugPassword();