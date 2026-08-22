-- Custom SQL migration file, put your code below! --
INSERT INTO pension_plans (id, name, user)
SELECT lower(hex(randomblob(12))), 'Plan de pensiones', user
FROM (SELECT DISTINCT user FROM pensions WHERE plan_id IS NULL);
--> statement-breakpoint
UPDATE pensions
SET plan_id = (SELECT id FROM pension_plans WHERE pension_plans.user = pensions.user LIMIT 1)
WHERE plan_id IS NULL;