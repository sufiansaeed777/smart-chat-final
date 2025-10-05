import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity({ name: 'subscriptions' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  managerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'managerId' })
  manager?: User;

  @Column({ type: 'varchar', length: 100 })
  planName!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trial';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency!: string;

  @Column({ type: 'varchar', length: 20 })
  billingCycle!: 'monthly' | 'yearly';

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ type: 'date' })
  nextBillingDate!: Date;

  @Column({ type: 'int', default: 0 })
  usersCount!: number;

  @Column({ type: 'int', default: 0 })
  botsCount!: number;

  @Column({ type: 'int', default: 0 })
  maxUsers!: number;

  @Column({ type: 'int', default: 0 })
  maxBots!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeSubscriptionId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeCustomerId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
