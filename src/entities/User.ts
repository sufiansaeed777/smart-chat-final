import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { UserRole } from "../types/UserRole";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  @Index()
  email!: string;

  @Column({ type: "varchar", nullable: true })
  password!: string | null;

  @Column({ type: "varchar", nullable: true })
  firstName!: string | null;

  @Column({ type: "varchar", nullable: true })
  lastName!: string | null;

  @Column({ type: "boolean", default: false })
  isEmailVerified!: boolean;

  @Column({ type: "varchar", nullable: true })
  emailVerificationToken!: string | null;

  @Column({ type: "varchar", nullable: true })
  passwordResetToken!: string | null;

  @Column({ type: "timestamp", nullable: true })
  passwordResetExpires!: Date | null;

  @Column({ 
    type: "enum", 
    enum: UserRole, 
    default: UserRole.USER 
  })
  role!: UserRole;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "timestamp", nullable: true })
  lastLoginAt!: Date | null;

  @Column({ type: "varchar", nullable: true })
  invitationToken!: string | null;

  @Column({ type: "timestamp", nullable: true })
  tokenExpiry!: Date | null;

  @Column({ type: "uuid", nullable: true })
  invitedBy!: string | null;

  // PHASE 4: Subscription & Billing Fields
  @Column({
    type: "enum",
    enum: ['free', 'starter', 'professional', 'enterprise'],
    default: 'free'
  })
  subscriptionPlan!: 'free' | 'starter' | 'professional' | 'enterprise';

  @Column({
    type: "enum",
    enum: ['active', 'past_due', 'cancelled', 'suspended', 'trialing'],
    nullable: true
  })
  subscriptionStatus?: 'active' | 'past_due' | 'cancelled' | 'suspended' | 'trialing' | null;

  @Column({ type: "varchar", nullable: true })
  stripeCustomerId?: string | null;

  @Column({ type: "varchar", nullable: true })
  stripeSubscriptionId?: string | null;

  @Column({ type: "int", default: 0 })
  messagesUsedThisMonth!: number;

  @Column({ type: "timestamp", nullable: true })
  billingCycleStart?: Date | null;

  @Column({ type: "timestamp", nullable: true })
  billingCycleEnd?: Date | null;

  @Column({ type: "timestamp", nullable: true })
  subscriptionStartedAt?: Date | null;

  @Column({ type: "timestamp", nullable: true })
  subscriptionEndedAt?: Date | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  // Virtual property for full name
  get fullName(): string {
    return `${this.firstName || ""} ${this.lastName || ""}`.trim();
  }
}
