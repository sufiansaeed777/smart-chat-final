import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity({ name: 'bots' })
export class Bot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255 })
  domain!: string;

  @Column({ 
    type: 'enum', 
    enum: ['active', 'paused', 'inactive'], 
    default: 'active' 
  })
  status!: 'active' | 'paused' | 'inactive';

  @Column({ type: 'int', default: 0 })
  totalConversations!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastActive?: Date;

  @Column({ type: 'uuid' })
  createdBy!: string; // Manager who created the bot

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  // Payment related fields
  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentSessionId?: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'failed', 'refunded'],
    nullable: true
  })
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';

  @Column({ type: 'varchar', length: 50, nullable: true })
  planType?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refundId?: string;

  // AI Configuration
  @Column({ type: 'boolean', default: false })
  isPublic!: boolean;

  @Column({ type: 'text', nullable: true })
  welcomeMessage?: string;

  @Column({ type: 'text', nullable: true })
  systemPrompt?: string;

  @Column({ type: 'varchar', length: 100, default: 'gpt-3.5-turbo' })
  model!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.7 })
  temperature!: number;

  @Column({ type: 'int', default: 1000 })
  maxTokens!: number;

  @Column({ type: 'varchar', length: 50, default: 'normal' })
  responseTime!: string;

  @Column({ type: 'boolean', default: true })
  autoSaveConversations!: boolean;

  @Column({ type: 'boolean', default: true })
  enableAnalytics!: boolean;

  // n8n Training Status
  @Column({
    name: 'training_status',
    type: 'enum',
    enum: ['untrained', 'training', 'trained', 'training_failed'],
    default: 'untrained'
  })
  trainingStatus!: 'untrained' | 'training' | 'trained' | 'training_failed';

  @Column({ name: 'last_trained_at', type: 'timestamp', nullable: true })
  lastTrainedAt?: Date;

  @Column({ name: 'n8n_webhook_url', type: 'varchar', length: 500, nullable: true })
  n8nWebhookUrl?: string; // Unique webhook URL for this bot's chat

  @Column({ name: 'training_log', type: 'text', nullable: true })
  trainingLog?: string; // JSON log of training attempts

  // Relations
  @OneToMany('BotAssignment', 'bot')
  assignments?: any[];

  @OneToMany('BotDocument', 'bot')
  botDocuments?: any[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
