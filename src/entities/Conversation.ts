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

  @Column({ type: 'text' })
  message!: string;

  @Column({ 
    type: 'enum', 
    enum: ['user', 'bot'], 
    default: 'user' 
  })
  sender!: 'user' | 'bot';

  @Column({ type: 'text', nullable: true })
  metadata?: string; // For storing additional data like N8N response data

  @Column({ type: 'boolean', default: false })
  isTestMessage!: boolean; // Flag to identify test messages

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
}
