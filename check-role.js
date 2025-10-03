const { AppDataSource } = require('./src/config/database');
const { User } = require('./src/entities/User');

async function checkRole() {
  try {
    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email: 'sufiansaeeds12@gmail.com' }
    });

    if (user) {
      console.log('\n✅ User Found:');
      console.log('Email:', user.email);
      console.log('Name:', user.firstName, user.lastName);
      console.log('Current Role:', user.role);
      console.log('\n');

      if (user.role === 'manager') {
        console.log('✅ You already have MANAGER access!');
      } else {
        console.log('⚠️  You currently have USER access.');
        console.log('Do you want to upgrade to MANAGER? (This will give you full access)');
      }
    } else {
      console.log('❌ User not found with email: sufiansaeeds12@gmail.com');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkRole();
