import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'faqs' })
export class FAQ {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 500 })
  question!: string;

  @Column({ type: 'text' })
  answer!: string;

  @Column({ type: 'varchar', length: 100 })
  category!: string;

  @Column({ type: 'int', default: 0 })
  orderIndex!: number;

  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'boolean', default: true })
  isPublished!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
