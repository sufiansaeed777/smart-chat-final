import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'billing_plans' })
export class BillingPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyPrice!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  yearlyPrice!: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency!: string;

  @Column({ type: 'int' })
  maxUsers!: number;

  @Column({ type: 'int' })
  maxBots!: number;

  @Column({ type: 'int', default: 0 })
  maxConversationsPerMonth!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'json', nullable: true })
  features?: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePriceIdMonthly?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePriceIdYearly?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
