import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User';
import { Bot } from './Bot';

@Entity({ name: 'conversations' })
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  botId!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  // OLD SCHEMA: Single message per row (for backward compatibility)
  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({
    type: 'enum',
    enum: ['user', 'bot'],
    nullable: true
  })
  sender?: 'user' | 'bot';

  // NEW SCHEMA: Session identifier for grouping messages (Human Handoff)
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  sessionId?: string;

  // Guest/Visitor information
  @Column({ type: 'varchar', length: 255, nullable: true })
  guestName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  guestId?: string;

  // Handoff fields
  @Column({
    type: 'enum',
    enum: ['AI', 'Human'],
    default: 'AI'
  })
  mode!: 'AI' | 'Human';

  @Column({
    type: 'enum',
    enum: ['active', 'waiting', 'idle', 'completed'],
    default: 'active'
  })
  @Index()
  status!: 'active' | 'waiting' | 'idle' | 'completed';

  // Agent assignment
  @Column({ type: 'uuid', nullable: true })
  @Index()
  assignedAgentId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedAgentName?: string;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt?: Date;

  // Messages stored as JSON array
  @Column({ type: 'jsonb', default: '[]' })
  messages!: Array<{
    id: string;
    sender: 'visitor' | 'agent' | 'bot';
    text: string;
    timestamp: string;
  }>;

  // Timestamps
  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  // Additional metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isTestMessage!: boolean;

  // Content Moderation / Flagging
  @Column({ name: 'is_flagged', type: 'boolean', default: false })
  @Index()
  isFlagged!: boolean;

  @Column({ name: 'flag_reason', type: 'text', nullable: true })
  flagReason?: string;

  @Column({ name: 'flagged_by', type: 'uuid', nullable: true })
  flaggedBy?: string;

  @Column({ name: 'flagged_at', type: 'timestamp', nullable: true })
  flaggedAt?: Date;

  @Column({
    name: 'review_status',
    type: 'enum',
    enum: ['pending', 'approved', 'rejected', 'resolved'],
    nullable: true
  })
  @Index()
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'resolved';

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne('User', 'conversations')
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne('Bot', 'conversations')
  @JoinColumn({ name: 'botId' })
  bot?: Bot;

  @ManyToOne('User')
  @JoinColumn({ name: 'assignedAgentId' })
  assignedAgent?: User;
}
