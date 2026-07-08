-- ============================================================
-- FinTrack — Migración 008: Taxonomía v2
-- - Icono por subcategoría (categories.icon, nombre lucide kebab-case).
-- - Nuevo grupo "Alimentación" separado de "Restauración y Ocio".
-- - Se mueven "supermarket" (→ Alimentación) y "vehicle_purchase" (→ Transporte).
-- - Nuevas subcategorías: local_food, nutrition_supplements, home_delivery,
--   cafe_breakfast, nightlife_drinks, dividends, investment_withdrawal.
-- - Reordenación de grupos según la UI.
--
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de las migraciones previas.
-- Idempotente: se puede re-ejecutar sin duplicar filas ni perder datos.
-- El admin puede seguir editando/añadiendo (sub)categorías directamente en la
-- tabla `categories`/`category_groups` desde el backend de Supabase; la app
-- resuelve el icono dinámicamente por su nombre lucide, sin cambios de código.
-- ============================================================

-- 1) Columna de icono por subcategoría.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;

-- 2) Nuevo grupo "Alimentación" (Groceries).
INSERT INTO category_groups (slug, type, icon, color, sort_order) VALUES
  ('food_grocery', 'gasto', 'shopping-cart', '#84cc16', 10)
ON CONFLICT (slug) DO UPDATE
  SET type = EXCLUDED.type, icon = EXCLUDED.icon,
      color = EXCLUDED.color, sort_order = EXCLUDED.sort_order;

-- 3) Reordenar grupos existentes según el nuevo orden de UI.
UPDATE category_groups SET sort_order = 20  WHERE slug = 'housing';
UPDATE category_groups SET sort_order = 30  WHERE slug = 'mobility';
UPDATE category_groups SET sort_order = 40  WHERE slug = 'food_leisure';
UPDATE category_groups SET sort_order = 50  WHERE slug = 'shopping';
UPDATE category_groups SET sort_order = 60  WHERE slug = 'health_sport';
UPDATE category_groups SET sort_order = 70  WHERE slug = 'services';
UPDATE category_groups SET sort_order = 80  WHERE slug = 'finance_govt';
UPDATE category_groups SET sort_order = 90  WHERE slug = 'insurance';
UPDATE category_groups SET sort_order = 100 WHERE slug = 'other_expenses';
UPDATE category_groups SET sort_order = 110 WHERE slug = 'income';
UPDATE category_groups SET sort_order = 120 WHERE slug = 'non_computable';

-- 4) Insertar nuevas subcategorías (group_id resuelto por slug de grupo).
INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT g.id, v.slug, v.icon, v.ord
FROM category_groups g
JOIN (VALUES
  ('food_grocery',   'local_food',            'store',         20),
  ('food_grocery',   'nutrition_supplements', 'apple',         30),
  ('food_leisure',   'home_delivery',         'bike',          20),
  ('food_leisure',   'cafe_breakfast',        'coffee',        30),
  ('food_leisure',   'nightlife_drinks',      'beer',          40),
  ('income',         'dividends',             'percent',       60),
  ('non_computable', 'investment_withdrawal', 'trending-down', 30)
) AS v(group_slug, slug, icon, ord) ON g.slug = v.group_slug
ON CONFLICT (slug) DO UPDATE
  SET group_id = EXCLUDED.group_id, icon = EXCLUDED.icon,
      sort_order = EXCLUDED.sort_order;

-- 5) Mover subcategorías existentes a su nuevo grupo.
UPDATE categories SET group_id = (SELECT id FROM category_groups WHERE slug = 'food_grocery')
  WHERE slug = 'supermarket';
UPDATE categories SET group_id = (SELECT id FROM category_groups WHERE slug = 'mobility')
  WHERE slug = 'vehicle_purchase';

-- 6) Backfill de iconos + reorden de subcategorías (fuente única de verdad).
UPDATE categories AS c SET icon = v.icon, sort_order = v.ord
FROM (VALUES
  -- Ingresos
  ('salary','briefcase',10), ('returns','bar-chart-3',20), ('rental_income','home',30),
  ('transfers_income','arrow-down-left',40), ('pension','award',50), ('dividends','percent',60),
  ('tax_refund','file-check',70), ('subsidies','landmark',80), ('gifts_received','gift',90),
  ('cash_income','banknote',100), ('other_income','circle-plus',110),
  -- Alimentación
  ('supermarket','shopping-cart',10), ('local_food','store',20), ('nutrition_supplements','apple',30),
  -- Vivienda
  ('rent_purchase','key',10), ('mortgage','percent',20), ('home_maintenance','wrench',30),
  ('community_fees','users',40), ('domestic_service','user',50), ('other_housing','circle-help',60),
  -- Transporte y Vehículos
  ('vehicle_purchase','car-front',10), ('transport','train',20), ('fuel','fuel',30),
  ('parking_tolls','circle-parking',40), ('vehicle_maintenance','activity',50), ('vehicle_rental','key-round',60),
  -- Restauración y Ocio
  ('restaurant','utensils',10), ('home_delivery','bike',20), ('cafe_breakfast','coffee',30),
  ('nightlife_drinks','beer',40), ('entertainment','ticket',50), ('vacations','compass',60),
  ('hotel','bed',70), ('lottery','dices',80), ('other_leisure','smile',90),
  -- Compras
  ('clothing','shirt',10), ('home_goods','sofa',20), ('electronics','smartphone',30),
  ('bookstore','book-open',40), ('sports_equipment','dumbbell',50), ('gifts','gift',60),
  ('children','baby',70), ('other_shopping','shopping-bag',80),
  -- Salud y Deporte
  ('medical','stethoscope',10), ('pharmacy','pill',20), ('optical_dental','eye',30),
  ('sport','trophy',40), ('beauty','scissors',50), ('other_health','heart-pulse',60),
  ('health_insurance_med','heart-pulse',70),
  -- Servicios y Suministros
  ('electricity','zap',10), ('gas','flame',20), ('water','droplet',30),
  ('mobile_internet','wifi',40), ('streaming','tv',50), ('online_services','monitor',60),
  ('security_alarm','lock',70), ('other_services','settings',80),
  -- Finanzas y Organismos
  ('loans','credit-card',10), ('bank_charges','circle-alert',20), ('taxes','file-text',30),
  ('social_security','heart',40), ('advisors_lawyers','scale',50), ('fines','triangle-alert',60),
  ('city_hall','map-pin',70), ('other_govt','building',80),
  -- Seguros
  ('health_insurance','shield-plus',10), ('home_insurance','home',20), ('vehicle_insurance','car',30),
  ('life_insurance','user-check',40), ('travel_insurance','plane',50), ('other_insurance','shield',60),
  -- Otros Gastos
  ('cash','banknote',10), ('family_pension','heart',20), ('transfers_expense','arrow-up-right',30),
  ('education','graduation-cap',40), ('other_expenses','more-horizontal',50),
  -- Variaciones de Capital
  ('inter_account_transfer','arrow-left-right',10), ('investments','wallet',20),
  ('investment_withdrawal','trending-down',30)
) AS v(slug, icon, ord)
WHERE c.slug = v.slug;
