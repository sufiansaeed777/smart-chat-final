import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";

// Get repository function to ensure connection is initialized
const getUserRepository = () => {
  if (!AppDataSource.isInitialized) {
    throw new Error("Database connection not initialized. Call initializeDatabase() first.");
  }
  return AppDataSource.getRepository("users");
};

export class UserService {
  // Create new user (signup)
  static async createUser(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    try {
      const userRepository = getUserRepository();
      
      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user using ORM
      const user = userRepository.create({
        ...userData,
        password: hashedPassword,
      });

      return await userRepository.save(user);
    } catch (error) {
      throw error;
    }
  }

  // Authenticate user (login)
  static async authenticateUser(email: string, password: string): Promise<User> {
    try {
      const userRepository = getUserRepository();
      
      const user = await userRepository.findOne({
        where: { email },
      });

      if (!user) {
        throw new Error("Invalid email or password");
      }

      if (!user.isActive) {
        throw new Error("Account is deactivated");
      }

      const isPasswordValid = user.password ? await bcrypt.compare(password, user.password) : false;
      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      // Update last login
      user.lastLoginAt = new Date();
      await userRepository.save(user);

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(id: string): Promise<User | null> {
    try {
      const userRepository = getUserRepository();
      return await userRepository.findOne({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const userRepository = getUserRepository();
      return await userRepository.findOne({
        where: { email },
      });
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    try {
      const userRepository = getUserRepository();
      
      const user = await userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Don't allow password update through this method
      delete updateData.password;

      Object.assign(user, updateData);
      return await userRepository.save(user);
    } catch (error) {
      throw error;
    }
  }

  // Change password
  static async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const userRepository = getUserRepository();
      
      const user = await userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const isCurrentPasswordValid = user.password ? await bcrypt.compare(
        currentPassword,
        user.password
      ) : false;
      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedNewPassword;
      await userRepository.save(user);
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  static async deleteUser(id: string): Promise<void> {
    try {
      const userRepository = getUserRepository();
      
      const user = await userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new Error("User not found");
      }

      await userRepository.remove(user);
    } catch (error) {
      throw error;
    }
  }
}
