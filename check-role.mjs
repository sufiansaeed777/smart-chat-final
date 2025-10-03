import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const { Pool } = pg;

async function checkRole() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const result = await pool.query(
      'SELECT id, email, role, "firstName", "lastName" FROM users WHERE email = $1',
      ['sufiansaeeds12@gmail.com']
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('\n✅ User Found:');
      console.log('Email:', user.email);
      console.log('Name:', user.firstName, user.lastName);
      console.log('Current Role:', user.role);
      console.log('\n');

      if (user.role === 'manager') {
        console.log('✅ You already have MANAGER access!');
        console.log('You can create bots, manage teams, see analytics, etc.');
      } else {
        console.log('⚠️  You currently have USER role.');
        console.log('USER role = Limited access (only assigned bots)');
        console.log('MANAGER role = Full access (create bots, manage team, analytics)');
      }
    } else {
      console.log('❌ User not found with email: sufiansaeeds12@gmail.com');
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkRole();
