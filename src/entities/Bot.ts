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

  @Column({ name: 'total_conversations', type: 'int', default: 0 })
  totalConversations!: number;

  @Column({ name: 'last_active', type: 'timestamp', nullable: true })
  lastActive?: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string; // Manager who created the bot

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  // Payment related fields
  @Column({ name: 'payment_session_id', type: 'varchar', length: 255, nullable: true })
  paymentSessionId?: string;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: ['pending', 'completed', 'failed', 'refunded'],
    nullable: true
  })
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';

  @Column({ name: 'plan_type', type: 'varchar', length: 50, nullable: true })
  planType?: string;

  @Column({ name: 'refund_id', type: 'varchar', length: 255, nullable: true })
  refundId?: string;

  // AI Configuration
  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic!: boolean;

  @Column({ name: 'welcome_message', type: 'text', nullable: true })
  welcomeMessage?: string;

  @Column({ name: 'system_prompt', type: 'text', nullable: true })
  systemPrompt?: string;

  @Column({ type: 'varchar', length: 100, default: 'gpt-3.5-turbo' })
  model!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.7 })
  temperature!: number;

  @Column({ name: 'max_tokens', type: 'int', default: 1000 })
  maxTokens!: number;

  @Column({ name: 'response_time', type: 'varchar', length: 50, default: 'normal' })
  responseTime!: string;

  @Column({ name: 'auto_save_conversations', type: 'boolean', default: true })
  autoSaveConversations!: boolean;

  @Column({ name: 'enable_analytics', type: 'boolean', default: true })
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
