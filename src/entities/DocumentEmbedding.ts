import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Document } from './Document';
import { Bot } from './Bot';

@Entity('document_embeddings')
@Index(['botId', 'documentId'])
export class DocumentEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column({ type: 'uuid' })
  botId: string;

  @ManyToOne(() => Bot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'botId' })
  bot: Bot;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  metadata: string;

  // Vector embedding (1536 dimensions for OpenAI text-embedding-3-small)
  @Column({
    type: 'vector',
    length: 1536,
    nullable: true
  })
  embedding: number[] | null;

  @Column({ type: 'int', default: 0 })
  chunkIndex: number;

  @Column({ type: 'int', default: 0 })
  tokenCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
