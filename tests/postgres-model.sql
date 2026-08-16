\set ON_ERROR_STOP on

\echo 'Checking the twelve expected tables'

BEGIN;

DO $test$
DECLARE
  expected_tables text[] := ARRAY[
    'app_settings',
    'audit_events',
    'companies',
    'contacts',
    'integration_connections',
    'intervention_technicians',
    'interventions',
    'review_requests',
    'sync_errors',
    'sync_runs',
    'technicians',
    'users'
  ];
  missing_tables text;
BEGIN
  SELECT string_agg(expected.table_name, ', ' ORDER BY expected.table_name)
  INTO missing_tables
  FROM unnest(expected_tables) AS expected(table_name)
  WHERE to_regclass('public.' || quote_ident(expected.table_name)) IS NULL;

  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Missing expected tables: %', missing_tables;
  END IF;
END
$test$;

\echo 'Creating fictitious reference data'

INSERT INTO integration_connections (id, provider, display_name)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'teamleader', 'Connexion fictive A'),
  ('10000000-0000-4000-8000-000000000002', 'teamleader', 'Connexion fictive B');

INSERT INTO companies (id, integration_connection_id, external_id, name)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'shared-company-id',
    'Société fictive A'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'shared-company-id',
    'Société fictive B'
  );

\echo 'Checking external_id scoping by integration connection'

DO $test$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO companies (id, integration_connection_id, external_id, name)
    VALUES (
      '20000000-0000-4000-8000-000000000003',
      '10000000-0000-4000-8000-000000000001',
      'shared-company-id',
      'Doublon fictif'
    );
  EXCEPTION
    WHEN unique_violation THEN -- SQLSTATE 23505
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Expected duplicate external_id in one connection to be rejected';
  END IF;
END
$test$;

INSERT INTO technicians (id, integration_connection_id, external_id, display_name)
VALUES (
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'technician-001',
  'Technicien fictif'
);

INSERT INTO contacts (
  id,
  company_id,
  integration_connection_id,
  external_id,
  name
)
VALUES (
  '40000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'contact-001',
  'Contact fictif'
);

INSERT INTO interventions (
  id,
  integration_connection_id,
  external_source,
  external_id,
  contact_id,
  title,
  status,
  started_at,
  ended_at
)
VALUES (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'teamleader',
  'intervention-001',
  '40000000-0000-4000-8000-000000000001',
  'Intervention fictive',
  'completed',
  '2026-01-10T09:00:00Z',
  '2026-01-10T10:00:00Z'
);

\echo 'Checking the intervention-technician composite primary key'

INSERT INTO intervention_technicians (intervention_id, technician_id)
VALUES (
  '50000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001'
);

DO $test$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO intervention_technicians (intervention_id, technician_id)
    VALUES (
      '50000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001'
    );
  EXCEPTION
    WHEN unique_violation THEN -- SQLSTATE 23505
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Expected duplicate intervention-technician pair to be rejected';
  END IF;
END
$test$;

\echo 'Checking review request idempotency and counters'

INSERT INTO review_requests (id, intervention_id, contact_id, idempotency_key)
VALUES (
  '60000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  'request-001'
);

DO $test$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO review_requests (id, intervention_id, contact_id, idempotency_key)
    VALUES (
      '60000000-0000-4000-8000-000000000002',
      '50000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'request-001'
    );
  EXCEPTION
    WHEN unique_violation THEN -- SQLSTATE 23505
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Expected duplicate idempotency_key to be rejected';
  END IF;
END
$test$;

DO $test$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO review_requests (id, intervention_id, contact_id, idempotency_key)
    VALUES (
      '60000000-0000-4000-8000-000000000003',
      '50000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      ''
    );
  EXCEPTION
    WHEN check_violation THEN -- SQLSTATE 23514
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Expected empty idempotency_key to be rejected';
  END IF;
END
$test$;

DO $test$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO review_requests (id, intervention_id, contact_id, idempotency_key)
    VALUES (
      '60000000-0000-4000-8000-000000000004',
      '50000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '   '
    );
  EXCEPTION
    WHEN check_violation THEN -- SQLSTATE 23514
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Expected whitespace-only idempotency_key to be rejected';
  END IF;
END
$test$;

DO $test$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO review_requests (
      id,
      intervention_id,
      contact_id,
      idempotency_key,
      attempts_count
    )
    VALUES (
      '60000000-0000-4000-8000-000000000005',
      '50000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'request-negative-counter',
      -1
    );
  EXCEPTION
    WHEN check_violation THEN -- SQLSTATE 23514
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Expected negative review attempts_count to be rejected';
  END IF;
END
$test$;

DO $test$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO sync_runs (id, source, records_read)
    VALUES (
      '70000000-0000-4000-8000-000000000001',
      'fictitious-source',
      -1
    );
  EXCEPTION
    WHEN check_violation THEN -- SQLSTATE 23514
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Expected negative sync records_read to be rejected';
  END IF;
END
$test$;

\echo 'Checking intervention dates'

DO $test$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO interventions (
      id,
      external_source,
      external_id,
      title,
      started_at,
      ended_at
    )
    VALUES (
      '50000000-0000-4000-8000-000000000002',
      'manual',
      'invalid-dates',
      'Intervention fictive invalide',
      '2026-01-10T10:00:00Z',
      '2026-01-10T09:00:00Z'
    );
  EXCEPTION
    WHEN check_violation THEN -- SQLSTATE 23514
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Expected ended_at before started_at to be rejected';
  END IF;
END
$test$;

\echo 'Checking normalized user emails'

DO $test$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO users (id, email, display_name)
    VALUES (
      '80000000-0000-4000-8000-000000000001',
      ' Not.Normalized@Example.Test ',
      'Utilisateur fictif'
    );
  EXCEPTION
    WHEN check_violation THEN -- SQLSTATE 23514
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Expected non-normalized email to be rejected';
  END IF;
END
$test$;

\echo 'Checking review opt-out consistency'

DO $test$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO contacts (id, name, review_opt_out, review_opt_out_at)
    VALUES (
      '40000000-0000-4000-8000-000000000002',
      'Opt-out fictif invalide A',
      false,
      '2026-01-10T10:00:00Z'
    );
  EXCEPTION
    WHEN check_violation THEN -- SQLSTATE 23514
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Expected false opt-out with a date to be rejected';
  END IF;
END
$test$;

DO $test$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    INSERT INTO contacts (id, name, review_opt_out, review_opt_out_at)
    VALUES (
      '40000000-0000-4000-8000-000000000003',
      'Opt-out fictif invalide B',
      true,
      NULL
    );
  EXCEPTION
    WHEN check_violation THEN -- SQLSTATE 23514
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Expected true opt-out without a date to be rejected';
  END IF;
END
$test$;

INSERT INTO contacts (id, name, review_opt_out, review_opt_out_at)
VALUES (
  '40000000-0000-4000-8000-000000000004',
  'Opt-out fictif valide',
  true,
  '2026-01-10T10:00:00Z'
);

\echo 'Checking RESTRICT deletion behavior'

DO $test$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    DELETE FROM integration_connections
    WHERE id = '10000000-0000-4000-8000-000000000001';
  EXCEPTION
    WHEN foreign_key_violation THEN -- SQLSTATE 23503
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Expected referenced integration connection deletion to be rejected';
  END IF;
END
$test$;

DO $test$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    DELETE FROM interventions
    WHERE id = '50000000-0000-4000-8000-000000000001';
  EXCEPTION
    WHEN foreign_key_violation THEN -- SQLSTATE 23503
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Expected referenced intervention deletion to be rejected';
  END IF;
END
$test$;

ROLLBACK;

\echo 'All PostgreSQL migration and constraint checks passed'
