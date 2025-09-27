import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from "typeorm";
import { UserRole } from "../types/UserRole";
import { BotAssignment } from "./BotAssignment";
import { Conversation } from "./Conversation";

@Entity("users")
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

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  // Relations
  @OneToMany('BotAssignment', 'user')
  botAssignments?: BotAssignment[];

  @OneToMany('Conversation', 'user')
  conversations?: Conversation[];

  // Virtual property for full name
  get fullName(): string {
    return `${this.firstName || ""} ${this.lastName || ""}`.trim();
  }
}
