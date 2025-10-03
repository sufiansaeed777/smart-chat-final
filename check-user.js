require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function checkUser() {
  const email = 'manager@manager.com';
  const testPassword = 'manager123'; // Common test password

  console.log('🔍 Checking user: ' + email + '\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    // Check if user exists
    console.log('1️⃣ Checking if user exists...');

    // First check which table and columns exist
    const tableCheckQuery = `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name IN ('User', 'users')
      ORDER BY table_name, ordinal_position
    `;

    const tableInfo = await client.query(tableCheckQuery);
    console.log('Found tables:', [...new Set(tableInfo.rows.map(r => r.table_name))].join(', '));

    // Try PascalCase first
    let userQuery = `
      SELECT id, email, password, role, "isActive", "isEmailVerified", "createdAt"
      FROM "User"
      WHERE email = $1
    `;

    // Check if User table exists with PascalCase columns
    const hasUserTable = tableInfo.rows.some(r => r.table_name === 'User');
    if (!hasUserTable) {
      // Use snake_case table
      userQuery = `
        SELECT id, email, password, role, "isActive", "isEmailVerified", "createdAt"
        FROM users
        WHERE email = $1
      `;
    }

    const result = await client.query(userQuery, [email]);

    if (result.rows.length === 0) {
      console.log('❌ User not found!\n');
      console.log('Creating test manager user...');

      // Hash the password
      const hashedPassword = await bcrypt.hash(testPassword, 12);

      // Try both table names
      try {
        const createUserQuery = `
          INSERT INTO "User" (email, password, "firstName", "lastName", role, "isActive", "isEmailVerified")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, email, role
        `;

        const newUser = await client.query(createUserQuery, [
          email,
          hashedPassword,
          'Test',
          'Manager',
          'manager',
          true,
          true
        ]);

        console.log('✅ Manager user created successfully!');
        console.log('   Email:', email);
        console.log('   Password:', testPassword);
        console.log('   Role:', newUser.rows[0].role);
      } catch (err) {
        // Try snake_case table
        const createUserQuery2 = `
          INSERT INTO users (email, password, first_name, last_name, role, is_active, is_email_verified)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, email, role
        `;

        const newUser = await client.query(createUserQuery2, [
          email,
          hashedPassword,
          'Test',
          'Manager',
          'manager',
          true,
          true
        ]);

        console.log('✅ Manager user created successfully!');
        console.log('   Email:', email);
        console.log('   Password:', testPassword);
        console.log('   Role:', newUser.rows[0].role);
      }
    } else {
      const user = result.rows[0];
      console.log('✅ User found!');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Active:', user.isActive);
      console.log('   Email Verified:', user.isEmailVerified);
      console.log('   Has Password:', !!user.password);
      console.log('   Created:', new Date(user.createdAt).toLocaleDateString());

      // Check password
      if (user.password) {
        console.log('\n2️⃣ Testing password...');
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log('   Password "' + testPassword + '":', isValid ? '✅ Valid' : '❌ Invalid');

        // Try some common passwords
        const commonPasswords = ['manager', 'password', '123456', 'admin123'];
        for (const pwd of commonPasswords) {
          const valid = await bcrypt.compare(pwd, user.password);
          if (valid) {
            console.log('   Password "' + pwd + '": ✅ Valid (Found working password!)');
            break;
          }
        }
      }

      // Check for issues
      console.log('\n3️⃣ Checking authentication requirements...');
      const issues = [];

      if (!user.isActive) {
        issues.push('❌ User is not active (isActive = false)');
      }
      if (!user.isEmailVerified) {
        issues.push('❌ Email is not verified (isEmailVerified = false)');
      }
      if (!user.password) {
        issues.push('❌ No password set');
      }

      if (issues.length > 0) {
        console.log('Found issues:');
        issues.forEach(issue => console.log('   ' + issue));

        // Fix the issues
        console.log('\n4️⃣ Fixing issues...');
        const hashedPassword = await bcrypt.hash(testPassword, 12);

        try {
          const updateQuery = `
            UPDATE "User"
            SET "isActive" = true,
                "isEmailVerified" = true,
                password = $2
            WHERE email = $1
            RETURNING id, email, "isActive", "isEmailVerified"
          `;
          await client.query(updateQuery, [email, hashedPassword]);
          console.log('✅ Fixed in User table!');
        } catch (err) {
          // Try snake_case table
          const updateQuery2 = `
            UPDATE users
            SET is_active = true,
                is_email_verified = true,
                password = $2
            WHERE email = $1
            RETURNING id, email, is_active, is_email_verified
          `;
          await client.query(updateQuery2, [email, hashedPassword]);
          console.log('✅ Fixed in users table!');
        }

        console.log('\n✅ User has been fixed! You can now login with:');
        console.log('   Email:', email);
        console.log('   Password:', testPassword);
      } else {
        console.log('✅ All authentication requirements are met!');
        console.log('\nYou should be able to login. If not working, try password: "' + testPassword + '"');
      }
    }

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();