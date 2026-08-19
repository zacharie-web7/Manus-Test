import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { getTableConfig } from 'drizzle-orm/pg-core';
import {
  INTERVENTION_STATUSES,
  REVIEW_REQUEST_STATUSES,
  SYNC_RUN_STATUSES,
  USER_ROLES,
  appSettings,
  auditEvents,
  companies,
  contacts,
  integrationConnections,
  interventions,
  interventionTechnicians,
  reviewRequests,
  syncErrors,
  syncRuns,
  technicians,
  users,
} from '../server/src/db/schema.ts';

const root = path.resolve(import.meta.dirname, '..');
const migrationPath = path.join(root, 'drizzle', '0000_initial_schema.sql');
const journalPath = path.join(root, 'drizzle', 'meta', '_journal.json');

const tables = [
  appSettings,
  auditEvents,
  companies,
  contacts,
  integrationConnections,
  interventionTechnicians,
  interventions,
  reviewRequests,
  syncErrors,
  syncRuns,
  technicians,
  users,
];

function config(table) {
  return getTableConfig(table);
}

function indexByName(table, name) {
  return config(table).indexes.find(item => item.config.name === name);
}

function checkNames(table) {
  return config(table).checks.map(item => item.name);
}

function foreignKeyByColumn(table, columnName) {
  return config(table).foreignKeys.find(item => (
    item.reference().columns.some(column => column.name === columnName)
  ));
}

function columnByName(table, columnName) {
  return config(table).columns.find(column => column.name === columnName);
}

test('le schéma déclare les douze tables métier attendues', () => {
  assert.deepEqual(
    tables.map(table => config(table).name).sort(),
    [
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
      'users',
    ],
  );
});

test('les rôles et statuts applicatifs sont explicitement bornés', () => {
  assert.deepEqual(USER_ROLES, ['admin', 'manager', 'technician']);
  assert.deepEqual(
    INTERVENTION_STATUSES,
    ['unknown', 'planned', 'in_progress', 'completed', 'cancelled'],
  );
  assert.deepEqual(
    REVIEW_REQUEST_STATUSES,
    [
      'pending',
      'scheduled',
      'sent',
      'follow_up_scheduled',
      'review_received',
      'do_not_contact',
      'failed',
    ],
  );
  assert.deepEqual(SYNC_RUN_STATUSES, ['running', 'succeeded', 'partial', 'failed']);
});

test('integration_connections reste générique, désactivable et sans secret', () => {
  const columns = config(integrationConnections).columns;

  assert.deepEqual(
    columns.map(column => column.name),
    ['id', 'provider', 'display_name', 'active', 'created_at', 'updated_at'],
  );
  assert.equal(columnByName(integrationConnections, 'active')?.notNull, true);
  assert.equal(columnByName(integrationConnections, 'active')?.default, true);
  assert.ok(checkNames(integrationConnections).includes(
    'integration_connections_provider_normalized_check',
  ));
  assert.equal(columns.some(column => /secret|token|oauth/i.test(column.name)), false);
});

test('les identifiants externes sont uniques par connexion', () => {
  for (const [table, indexName] of [
    [technicians, 'technicians_connection_external_id_unique'],
    [companies, 'companies_connection_external_id_unique'],
    [contacts, 'contacts_connection_external_id_unique'],
  ]) {
    const externalIndex = indexByName(table, indexName);

    assert.ok(externalIndex?.config.unique);
    assert.deepEqual(
      externalIndex.config.columns.map(column => column.name),
      ['integration_connection_id', 'external_id'],
    );
    assert.ok(externalIndex.config.where);
    assert.equal(
      config(table).indexes.some(item => (
        item.config.unique
        && item.config.columns.length === 1
        && item.config.columns[0]?.name === 'external_id'
      )),
      false,
    );
  }

  const connectedIndex = indexByName(
    interventions,
    'interventions_connection_external_id_unique',
  );
  const unconnectedIndex = indexByName(
    interventions,
    'interventions_unconnected_source_external_id_unique',
  );

  assert.deepEqual(
    connectedIndex?.config.columns.map(column => column.name),
    ['integration_connection_id', 'external_id'],
  );
  assert.deepEqual(
    unconnectedIndex?.config.columns.map(column => column.name),
    ['external_source', 'external_id'],
  );
  assert.ok(connectedIndex?.config.where);
  assert.ok(unconnectedIndex?.config.where);
});

test('un même external_id peut appartenir à deux connexions différentes', () => {
  for (const table of [technicians, companies, contacts, interventions]) {
    assert.equal(
      config(table).indexes.some(item => (
        item.config.unique
        && item.config.columns.length === 1
        && item.config.columns[0]?.name === 'external_id'
      )),
      false,
    );
  }
});

test('une intervention accepte zéro, un ou plusieurs techniciens sans doublon', () => {
  const joinConfig = config(interventionTechnicians);

  assert.deepEqual(
    joinConfig.primaryKeys[0].columns.map(column => column.name),
    ['intervention_id', 'technician_id'],
  );
  assert.equal(joinConfig.foreignKeys.length, 2);
  assert.ok(joinConfig.foreignKeys.every(key => key.onDelete === 'restrict'));
});

test('review_opt_out est persistant et cohérent sur le contact', () => {
  const optOut = columnByName(contacts, 'review_opt_out');
  const optOutAt = columnByName(contacts, 'review_opt_out_at');

  assert.equal(optOut?.notNull, true);
  assert.equal(optOut?.hasDefault, true);
  assert.equal(optOut?.default, false);
  assert.equal(optOutAt?.notNull, false);
  assert.ok(checkNames(contacts).includes('contacts_review_opt_out_consistency_check'));
  assert.ok(REVIEW_REQUEST_STATUSES.includes('do_not_contact'));
});

test('created_at et updated_at sont initialisés sans trigger implicite', () => {
  for (const table of [
    users,
    integrationConnections,
    technicians,
    companies,
    contacts,
    interventions,
    reviewRequests,
    appSettings,
  ]) {
    const createdAt = columnByName(table, 'created_at');
    const updatedAt = columnByName(table, 'updated_at');

    assert.equal(createdAt?.notNull, true);
    assert.equal(createdAt?.hasDefault, true);
    assert.equal(updatedAt?.notNull, true);
    assert.equal(updatedAt?.hasDefault, true);
  }

  for (const table of [interventionTechnicians, syncRuns, syncErrors, auditEvents]) {
    assert.equal(columnByName(table, 'created_at')?.notNull, true);
    assert.equal(columnByName(table, 'created_at')?.hasDefault, true);
    assert.equal(columnByName(table, 'updated_at'), undefined);
  }
});

test('email, clé de réglage et clé d’idempotence sont normalisés', () => {
  assert.ok(checkNames(users).includes('users_email_normalized_check'));
  assert.ok(checkNames(users).includes('users_email_not_blank_check'));
  assert.ok(checkNames(appSettings).includes('app_settings_key_normalized_check'));
  assert.ok(checkNames(appSettings).includes('app_settings_key_not_blank_check'));
  assert.ok(checkNames(reviewRequests).includes(
    'review_requests_idempotency_key_normalized_check',
  ));
  assert.ok(checkNames(reviewRequests).includes(
    'review_requests_idempotency_key_not_blank_check',
  ));
});

test('idempotency_key reste obligatoire et unique', () => {
  const idempotencyKey = columnByName(reviewRequests, 'idempotency_key');
  const idempotencyIndex = indexByName(
    reviewRequests,
    'review_requests_idempotency_key_unique',
  );

  assert.equal(idempotencyKey?.notNull, true);
  assert.ok(idempotencyIndex?.config.unique);
  assert.deepEqual(
    idempotencyIndex.config.columns.map(column => column.name),
    ['idempotency_key'],
  );
});

test('les contraintes de dates et le stockage timestamptz sont présents dans la migration', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(sql, /CONSTRAINT "interventions_dates_order_check"/);
  assert.match(sql, /CONSTRAINT "sync_runs_dates_order_check"/);
  assert.match(sql, /"ended_at" timestamp with time zone/);
  assert.match(sql, /"review_opt_out_at" timestamp with time zone/);
  assert.match(sql, /"planned_at" timestamp with time zone/);
  assert.doesNotMatch(sql, /timestamp without time zone/);
});

test('les suppressions préservent les connexions et l’historique métier', () => {
  for (const table of [technicians, companies, contacts, interventions, syncRuns]) {
    assert.equal(
      foreignKeyByColumn(table, 'integration_connection_id')?.onDelete,
      'restrict',
    );
  }

  assert.equal(foreignKeyByColumn(technicians, 'user_id')?.onDelete, 'set null');
  assert.equal(foreignKeyByColumn(contacts, 'company_id')?.onDelete, 'set null');
  assert.equal(foreignKeyByColumn(interventions, 'company_id')?.onDelete, 'set null');
  assert.equal(foreignKeyByColumn(interventions, 'contact_id')?.onDelete, 'set null');
  assert.equal(foreignKeyByColumn(reviewRequests, 'intervention_id')?.onDelete, 'restrict');
  assert.equal(foreignKeyByColumn(reviewRequests, 'contact_id')?.onDelete, 'restrict');
  assert.equal(foreignKeyByColumn(syncErrors, 'sync_run_id')?.onDelete, 'restrict');
});

test('la migration initiale correspond aux douze tables du schéma', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  const createdTables = [...sql.matchAll(/CREATE TABLE "([^"]+)"/g)].map(match => match[1]);

  assert.equal(journal.dialect, 'postgresql');
  assert.deepEqual(journal.entries.map(entry => entry.tag), ['0000_initial_schema']);
  assert.deepEqual(createdTables.sort(), tables.map(table => config(table).name).sort());
  assert.match(sql, /CREATE UNIQUE INDEX "technicians_connection_external_id_unique"[\s\S]+WHERE/);
  assert.match(sql, /CONSTRAINT "contacts_review_opt_out_consistency_check"/);
  assert.match(sql, /CONSTRAINT "users_email_normalized_check"/);
  assert.match(sql, /CONSTRAINT "app_settings_key_normalized_check"/);
  assert.match(sql, /CONSTRAINT "review_requests_idempotency_key_normalized_check"/);
  assert.doesNotMatch(sql, /external_teamleader_id/);
  assert.doesNotMatch(sql, /\bDROP\s+(TABLE|TYPE|SCHEMA|DATABASE)\b/i);
  assert.doesNotMatch(sql, /CLIENT_SECRET|ACCESS_TOKEN|REFRESH_TOKEN/i);
});
