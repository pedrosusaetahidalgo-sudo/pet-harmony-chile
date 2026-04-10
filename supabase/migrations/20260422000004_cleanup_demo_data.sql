-- Cleanup demo/test data before production launch
-- Deactivate demo vet profiles (don't delete — may have FK references)
UPDATE service_providers
SET is_active = false, is_visible = false
WHERE LOWER(display_name) LIKE '%test%'
   OR LOWER(display_name) LIKE '%demo%'
   OR LOWER(display_name) LIKE '%prueba%'
   OR license_number LIKE 'DEMO%';

-- Reset review counts for providers with no actual reviews
UPDATE service_providers
SET total_reviews = 0, avg_rating = NULL
WHERE id NOT IN (SELECT DISTINCT provider_id FROM service_reviews WHERE provider_id IS NOT NULL);

-- Clean up any orphaned review data (rating 0 with review count > 0)
UPDATE service_providers
SET total_reviews = (
  SELECT COUNT(*) FROM service_reviews WHERE provider_id = service_providers.id
),
avg_rating = (
  SELECT AVG(rating)::NUMERIC(3,2) FROM service_reviews WHERE provider_id = service_providers.id
)
WHERE total_reviews > 0;
