-- ============================================================
-- zafyros — Seed: taxonomía de categorías (v2)
-- Ejecutar DESPUÉS de 001_schema.sql
-- Icono por subcategoría (categories.icon = nombre lucide kebab-case).
-- El admin puede editar/añadir (sub)categorías desde el backend de Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- GRUPOS DE CATEGORÍAS
-- ------------------------------------------------------------
INSERT INTO category_groups (slug, type, icon, color, sort_order) VALUES
  ('food_grocery',   'gasto',          'shopping-cart',   '#84cc16', 10),
  ('housing',        'gasto',          'home',            '#6366f1', 20),
  ('mobility',       'gasto',          'car',             '#8b5cf6', 30),
  ('food_leisure',   'gasto',          'utensils',        '#ec4899', 40),
  ('shopping',       'gasto',          'shopping-bag',    '#f97316', 50),
  ('health_sport',   'gasto',          'heart-pulse',     '#ef4444', 60),
  ('services',       'gasto',          'zap',             '#eab308', 70),
  ('finance_govt',   'gasto',          'landmark',        '#14b8a6', 80),
  ('insurance',      'gasto',          'shield',          '#06b6d4', 90),
  ('other_expenses', 'gasto',          'more-horizontal', '#94a3b8', 100),
  ('income',         'ingreso',        'trending-up',     '#22c55e', 110),
  ('non_computable', 'no_computable',  'arrow-left-right','#64748b', 120);

-- ------------------------------------------------------------
-- Alimentación (food_grocery)
-- ------------------------------------------------------------
INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT id, v.slug, v.icon, v.ord FROM category_groups,
  (VALUES
    ('supermarket',           'shopping-cart', 10),
    ('local_food',            'store',         20),
    ('nutrition_supplements', 'apple',         30)
  ) AS v(slug, icon, ord)
WHERE category_groups.slug = 'food_grocery';

-- ------------------------------------------------------------
-- Vivienda (housing)
-- ------------------------------------------------------------
INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT id, v.slug, v.icon, v.ord FROM category_groups,
  (VALUES
    ('rent_purchase',    'key',         10),
    ('mortgage',         'percent',     20),
    ('home_maintenance', 'wrench',      30),
    ('community_fees',   'users',       40),
    ('domestic_service', 'user',        50),
    ('home_goods',       'sofa',        55),
    ('other_housing',    'circle-help', 60)
  ) AS v(slug, icon, ord)
WHERE category_groups.slug = 'housing';

-- ------------------------------------------------------------
-- Transporte y Vehículos (mobility)
-- ------------------------------------------------------------
INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT id, v.slug, v.icon, v.ord FROM category_groups,
  (VALUES
    ('vehicle_purchase',    'car-front',       10),
    ('transport',           'train',           20),
    ('fuel',                'fuel',            30),
    ('parking_tolls',       'circle-parking',  40),
    ('vehicle_maintenance', 'activity',        50),
    ('vehicle_rental',      'key-round',       60)
  ) AS v(slug, icon, ord)
WHERE category_groups.slug = 'mobility';

-- ------------------------------------------------------------
-- Restauración y Ocio (food_leisure)
-- ------------------------------------------------------------
INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT id, v.slug, v.icon, v.ord FROM category_groups,
  (VALUES
    ('restaurant',       'utensils', 10),
    ('home_delivery',    'bike',     20),
    ('nightlife_drinks', 'beer',     40),
    ('entertainment',    'ticket',   50),
    ('vacations',        'compass',  60),
    ('hotel',            'bed',      70),
    ('lottery',          'dices',    80),
    ('other_leisure',    'smile',    90)
  ) AS v(slug, icon, ord)
WHERE category_groups.slug = 'food_leisure';

-- ------------------------------------------------------------
-- Compras (shopping)
-- ------------------------------------------------------------
INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT id, v.slug, v.icon, v.ord FROM category_groups,
  (VALUES
    ('clothing',         'shirt',        10),
    ('electronics',      'smartphone',   30),
    ('bookstore',        'book-open',    40),
    ('sports_equipment', 'dumbbell',     50),
    ('gifts',            'gift',         60),
    ('children',         'baby',         70),
    ('other_shopping',   'shopping-bag', 80)
  ) AS v(slug, icon, ord)
WHERE category_groups.slug = 'shopping';

-- ------------------------------------------------------------
-- Salud y Deporte (health_sport)
-- ------------------------------------------------------------
INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT id, v.slug, v.icon, v.ord FROM category_groups,
  (VALUES
    ('medical',        'stethoscope', 10),
    ('pharmacy',       'pill',        20),
    ('optical_dental', 'eye',         30),
    ('sport',          'trophy',      40),
    ('beauty',         'scissors',    50),
    ('other_health',   'heart-pulse', 60)
  ) AS v(slug, icon, ord)
WHERE category_groups.slug = 'health_sport';

-- ------------------------------------------------------------
-- Servicios y Suministros (services)
-- ------------------------------------------------------------
INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT id, v.slug, v.icon, v.ord FROM category_groups,
  (VALUES
    ('electricity',     'zap',      10),
    ('gas',             'flame',    20),
    ('water',           'droplet',  30),
    ('mobile_internet', 'wifi',     40),
    ('streaming',       'tv',       50),
    ('online_services', 'monitor',  60),
    ('security_alarm',  'lock',     70),
    ('other_services',  'settings', 80)
  ) AS v(slug, icon, ord)
WHERE category_groups.slug = 'services';

-- ------------------------------------------------------------
-- Finanzas y Organismos (finance_govt)
-- ------------------------------------------------------------
INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT id, v.slug, v.icon, v.ord FROM category_groups,
  (VALUES
    ('loans',            'credit-card',    10),
    ('bank_charges',     'circle-alert',   20),
    ('taxes',            'file-text',      30),
    ('social_security',  'heart',          40),
    ('advisors_lawyers', 'scale',          50),
    ('fines',            'triangle-alert', 60),
    ('city_hall',        'map-pin',        70),
    ('other_govt',       'building',       80)
  ) AS v(slug, icon, ord)
WHERE category_groups.slug = 'finance_govt';

-- ------------------------------------------------------------
-- Seguros (insurance)
-- ------------------------------------------------------------
INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT id, v.slug, v.icon, v.ord FROM category_groups,
  (VALUES
    ('health_insurance',  'shield-plus', 10),
    ('home_insurance',    'home',        20),
    ('vehicle_insurance', 'car',         30),
    ('life_insurance',    'user-check',  40),
    ('travel_insurance',  'plane',       50),
    ('other_insurance',   'shield',      60)
  ) AS v(slug, icon, ord)
WHERE category_groups.slug = 'insurance';

-- ------------------------------------------------------------
-- Otros Gastos (other_expenses)
-- ------------------------------------------------------------
INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT id, v.slug, v.icon, v.ord FROM category_groups,
  (VALUES
    ('cash',              'banknote',        10),
    ('family_pension',    'heart',           20),
    ('transfers_expense', 'arrow-up-right',  30),
    ('education',         'graduation-cap',  40),
    ('other_expenses',    'more-horizontal', 50)
  ) AS v(slug, icon, ord)
WHERE category_groups.slug = 'other_expenses';

-- ------------------------------------------------------------
-- Ingresos (income)
-- ------------------------------------------------------------
INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT id, v.slug, v.icon, v.ord FROM category_groups,
  (VALUES
    ('salary',           'briefcase',       10),
    ('returns',          'bar-chart-3',     20),
    ('rental_income',    'home',            30),
    ('transfers_income', 'arrow-down-left', 40),
    ('pension',          'award',           50),
    ('dividends',        'percent',         60),
    ('tax_refund',       'file-check',      70),
    ('subsidies',        'landmark',        80),
    ('gifts_received',   'gift',            90),
    ('cash_income',      'banknote',        100),
    ('other_income',     'circle-plus',     110)
  ) AS v(slug, icon, ord)
WHERE category_groups.slug = 'income';

-- ------------------------------------------------------------
-- Variaciones de Capital (non_computable)
-- ------------------------------------------------------------
INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT id, v.slug, v.icon, v.ord FROM category_groups,
  (VALUES
    ('inter_account_transfer', 'arrow-left-right', 10),
    ('investments',            'wallet',           20),
    ('investment_withdrawal',  'trending-down',    30),
    ('card_settlement',        'credit-card',      40)
  ) AS v(slug, icon, ord)
WHERE category_groups.slug = 'non_computable';
