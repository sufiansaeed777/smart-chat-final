import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User';
import { Bot } from './Bot';

@Entity({ name: 'bot_assignments' })
@Index(['userId', 'botId'], { unique: true }) // Ensure a user can only be assigned to a bot once
export class BotAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'bot_id', type: 'uuid' })
  botId!: string;

  @Column({ name: 'assigned_by', type: 'uuid' })
  assignedBy!: string; // Manager who assigned the bot

  @Column({ name: 'assigned_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt!: Date;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active'
  })
  status!: 'active' | 'inactive';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne('User', 'botAssignments')
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne('Bot', 'assignments')
  @JoinColumn({ name: 'bot_id' })
  bot?: Bot;

  @ManyToOne('User')
  @JoinColumn({ name: 'assigned_by' })
  assignedByUser?: User;
}
