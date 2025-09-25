import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User';
import { Bot } from './Bot';

@Entity('bot_assignments')
@Index(['userId', 'botId'], { unique: true }) // Ensure a user can only be assigned to a bot once
export class BotAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  botId!: string;

  @Column({ type: 'uuid' })
  assignedBy!: string; // Manager who assigned the bot

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt!: Date;

  @Column({ 
    type: 'enum', 
    enum: ['active', 'inactive'], 
    default: 'active' 
  })
  status!: 'active' | 'inactive';

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, user => user.botAssignments)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Bot, bot => bot.assignments)
  @JoinColumn({ name: 'botId' })
  bot?: Bot;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedBy' })
  assignedByUser?: User;
}
