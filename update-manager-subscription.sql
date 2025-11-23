-- Update manager@manager.com to have Enterprise subscription
UPDATE users
SET
  subscription_plan = 'enterprise',
  subscription_status = 'active',
  subscription_started_at = NOW(),
  billing_cycle_start = NOW(),
  billing_cycle_end = NOW() + INTERVAL '1 month'
WHERE
  email = 'manager@manager.com';
