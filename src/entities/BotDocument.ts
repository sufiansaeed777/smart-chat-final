import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Bot } from './Bot';
import { Document } from './Document';

@Entity({ name: 'bot_documents' })
@Index(['botId', 'documentId'], { unique: true }) // Ensure unique bot-document pairs
export class BotDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  botId!: string;

  @Column({ type: 'uuid' })
  documentId!: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne('Bot', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'botId' })
  bot!: Bot;

  @ManyToOne('Document', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document!: Document;

  @CreateDateColumn()
  createdAt!: Date;
}
