import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'video_links' })
export class VideoLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ type: 'varchar', length: 100 })
  category!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnail?: string;

  @Column({ type: 'int', default: 0 })
  duration?: number;

  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'boolean', default: true })
  isPublished!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
