import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const USER_ROLES = ['admin', 'manager', 'technician'] as const;
export const INTERVENTION_STATUSES = [
  'unknown',
  'planned',
  'in_progress',
  'completed',
  'cancelled',
] as const;
export const REVIEW_REQUEST_STATUSES = [
  'pending',
  'scheduled',
  'sent',
  'follow_up_scheduled',
  'review_received',
  'do_not_contact',
  'failed',
] as const;
export const REVIEW_CHANNELS = ['email', 'sms', 'whatsapp', 'manual'] as const;
export const SYNC_RUN_STATUSES = ['running', 'succeeded', 'partial', 'failed'] as const;

export const userRoleEnum = pgEnum('user_role', USER_ROLES);
export const interventionStatusEnum = pgEnum('intervention_status', INTERVENTION_STATUSES);
export const reviewRequestStatusEnum = pgEnum('review_request_status', REVIEW_REQUEST_STATUSES);
export const reviewChannelEnum = pgEnum('review_channel', REVIEW_CHANNELS);
export const syncRunStatusEnum = pgEnum('sync_run_status', SYNC_RUN_STATUSES);

function timestampColumns() {
  return {
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  };
}

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 320 }).notNull(),
  displayName: text('display_name').notNull(),
  role: userRoleEnum('role').notNull().default('technician'),
  active: boolean('active').notNull().default(true),
  ...timestampColumns(),
}, table => [
  uniqueIndex('users_email_unique').on(table.email),
  check('users_email_normalized_check', sql`${table.email} = lower(trim(${table.email}))`),
  check('users_email_not_blank_check', sql`length(trim(${table.email})) > 0`),
  check('users_display_name_not_blank_check', sql`length(trim(${table.displayName})) > 0`),
]);

export const integrationConnections = pgTable('integration_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull(),
  displayName: text('display_name').notNull(),
  active: boolean('active').notNull().default(true),
  ...timestampColumns(),
}, table => [
  check(
    'integration_connections_provider_normalized_check',
    sql`${table.provider} = lower(trim(${table.provider})) and length(${table.provider}) > 0`,
  ),
  check(
    'integration_connections_display_name_not_blank_check',
    sql`length(trim(${table.displayName})) > 0`,
  ),
]);

export const technicians = pgTable('technicians', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  integrationConnectionId: uuid('integration_connection_id')
    .references(() => integrationConnections.id, { onDelete: 'restrict' }),
  externalId: text('external_id'),
  displayName: text('display_name').notNull(),
  active: boolean('active').notNull().default(true),
  ...timestampColumns(),
}, table => [
  uniqueIndex('technicians_user_id_unique').on(table.userId),
  uniqueIndex('technicians_connection_external_id_unique')
    .on(table.integrationConnectionId, table.externalId)
    .where(sql`${table.integrationConnectionId} is not null and ${table.externalId} is not null`),
  check('technicians_display_name_not_blank_check', sql`length(trim(${table.displayName})) > 0`),
  check(
    'technicians_external_identity_consistency_check',
    sql`(${table.integrationConnectionId} is null and ${table.externalId} is null) or (${table.integrationConnectionId} is not null and ${table.externalId} is not null and length(trim(${table.externalId})) > 0)`,
  ),
]);

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  integrationConnectionId: uuid('integration_connection_id')
    .references(() => integrationConnections.id, { onDelete: 'restrict' }),
  externalId: text('external_id'),
  name: text('name').notNull(),
  active: boolean('active').notNull().default(true),
  ...timestampColumns(),
}, table => [
  uniqueIndex('companies_connection_external_id_unique')
    .on(table.integrationConnectionId, table.externalId)
    .where(sql`${table.integrationConnectionId} is not null and ${table.externalId} is not null`),
  check('companies_name_not_blank_check', sql`length(trim(${table.name})) > 0`),
  check(
    'companies_external_identity_consistency_check',
    sql`(${table.integrationConnectionId} is null and ${table.externalId} is null) or (${table.integrationConnectionId} is not null and ${table.externalId} is not null and length(trim(${table.externalId})) > 0)`,
  ),
]);

export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  integrationConnectionId: uuid('integration_connection_id')
    .references(() => integrationConnections.id, { onDelete: 'restrict' }),
  externalId: text('external_id'),
  name: text('name').notNull(),
  email: varchar('email', { length: 320 }),
  phone: varchar('phone', { length: 50 }),
  language: varchar('language', { length: 16 }),
  active: boolean('active').notNull().default(true),
  reviewOptOut: boolean('review_opt_out').notNull().default(false),
  reviewOptOutAt: timestamp('review_opt_out_at', { withTimezone: true }),
  ...timestampColumns(),
}, table => [
  uniqueIndex('contacts_connection_external_id_unique')
    .on(table.integrationConnectionId, table.externalId)
    .where(sql`${table.integrationConnectionId} is not null and ${table.externalId} is not null`),
  index('contacts_company_id_idx').on(table.companyId),
  check('contacts_name_not_blank_check', sql`length(trim(${table.name})) > 0`),
  check(
    'contacts_external_identity_consistency_check',
    sql`(${table.integrationConnectionId} is null and ${table.externalId} is null) or (${table.integrationConnectionId} is not null and ${table.externalId} is not null and length(trim(${table.externalId})) > 0)`,
  ),
  check(
    'contacts_review_opt_out_consistency_check',
    sql`(${table.reviewOptOut} = false and ${table.reviewOptOutAt} is null) or (${table.reviewOptOut} = true and ${table.reviewOptOutAt} is not null)`,
  ),
]);

export const interventions = pgTable('interventions', {
  id: uuid('id').defaultRandom().primaryKey(),
  integrationConnectionId: uuid('integration_connection_id')
    .references(() => integrationConnections.id, { onDelete: 'restrict' }),
  externalSource: varchar('external_source', { length: 50 }).notNull().default('manual'),
  externalId: text('external_id'),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  interventionType: text('intervention_type'),
  status: interventionStatusEnum('status').notNull().default('unknown'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
  ...timestampColumns(),
}, table => [
  uniqueIndex('interventions_connection_external_id_unique')
    .on(table.integrationConnectionId, table.externalId)
    .where(sql`${table.integrationConnectionId} is not null and ${table.externalId} is not null`),
  uniqueIndex('interventions_unconnected_source_external_id_unique')
    .on(table.externalSource, table.externalId)
    .where(sql`${table.integrationConnectionId} is null and ${table.externalId} is not null`),
  index('interventions_company_ended_at_idx').on(table.companyId, table.endedAt),
  index('interventions_status_ended_at_idx').on(table.status, table.endedAt),
  check('interventions_external_source_not_blank_check', sql`length(trim(${table.externalSource})) > 0`),
  check('interventions_external_id_not_blank_check', sql`${table.externalId} is null or length(trim(${table.externalId})) > 0`),
  check(
    'interventions_connected_external_id_check',
    sql`${table.integrationConnectionId} is null or ${table.externalId} is not null`,
  ),
  check('interventions_title_not_blank_check', sql`length(trim(${table.title})) > 0`),
  check(
    'interventions_dates_order_check',
    sql`${table.startedAt} is null or ${table.endedAt} is null or ${table.endedAt} >= ${table.startedAt}`,
  ),
]);

export const interventionTechnicians = pgTable('intervention_technicians', {
  interventionId: uuid('intervention_id')
    .notNull()
    .references(() => interventions.id, { onDelete: 'restrict' }),
  technicianId: uuid('technician_id')
    .notNull()
    .references(() => technicians.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  primaryKey({
    name: 'intervention_technicians_primary_key',
    columns: [table.interventionId, table.technicianId],
  }),
  index('intervention_technicians_technician_id_idx').on(table.technicianId),
]);

export const reviewRequests = pgTable('review_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  interventionId: uuid('intervention_id')
    .notNull()
    .references(() => interventions.id, { onDelete: 'restrict' }),
  contactId: uuid('contact_id')
    .notNull()
    .references(() => contacts.id, { onDelete: 'restrict' }),
  status: reviewRequestStatusEnum('status').notNull().default('pending'),
  plannedAt: timestamp('planned_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  nextFollowUpAt: timestamp('next_follow_up_at', { withTimezone: true }),
  attemptsCount: integer('attempts_count').notNull().default(0),
  followUpCount: integer('follow_up_count').notNull().default(0),
  channel: reviewChannelEnum('channel'),
  reviewReceivedAt: timestamp('review_received_at', { withTimezone: true }),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
  ...timestampColumns(),
}, table => [
  uniqueIndex('review_requests_idempotency_key_unique').on(table.idempotencyKey),
  index('review_requests_intervention_id_idx').on(table.interventionId),
  index('review_requests_status_planned_at_idx').on(table.status, table.plannedAt),
  check('review_requests_attempts_count_check', sql`${table.attemptsCount} >= 0`),
  check('review_requests_follow_up_count_check', sql`${table.followUpCount} >= 0`),
  check('review_requests_idempotency_key_not_blank_check', sql`length(trim(${table.idempotencyKey})) > 0`),
  check('review_requests_idempotency_key_normalized_check', sql`${table.idempotencyKey} = trim(${table.idempotencyKey})`),
]);

export const syncRuns = pgTable('sync_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  integrationConnectionId: uuid('integration_connection_id')
    .references(() => integrationConnections.id, { onDelete: 'restrict' }),
  source: varchar('source', { length: 50 }).notNull(),
  status: syncRunStatusEnum('status').notNull().default('running'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  recordsRead: integer('records_read').notNull().default(0),
  recordsCreated: integer('records_created').notNull().default(0),
  recordsUpdated: integer('records_updated').notNull().default(0),
  recordsFailed: integer('records_failed').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('sync_runs_connection_started_at_idx').on(table.integrationConnectionId, table.startedAt),
  index('sync_runs_source_started_at_idx').on(table.source, table.startedAt),
  check('sync_runs_source_not_blank_check', sql`length(trim(${table.source})) > 0`),
  check('sync_runs_records_read_check', sql`${table.recordsRead} >= 0`),
  check('sync_runs_records_created_check', sql`${table.recordsCreated} >= 0`),
  check('sync_runs_records_updated_check', sql`${table.recordsUpdated} >= 0`),
  check('sync_runs_records_failed_check', sql`${table.recordsFailed} >= 0`),
  check(
    'sync_runs_dates_order_check',
    sql`${table.finishedAt} is null or ${table.finishedAt} >= ${table.startedAt}`,
  ),
]);

export const syncErrors = pgTable('sync_errors', {
  id: uuid('id').defaultRandom().primaryKey(),
  syncRunId: uuid('sync_run_id')
    .notNull()
    .references(() => syncRuns.id, { onDelete: 'restrict' }),
  externalType: text('external_type'),
  externalId: text('external_id'),
  category: varchar('category', { length: 100 }).notNull(),
  safeMessage: text('safe_message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('sync_errors_sync_run_id_idx').on(table.syncRunId),
  check('sync_errors_category_not_blank_check', sql`length(trim(${table.category})) > 0`),
  check('sync_errors_safe_message_not_blank_check', sql`length(trim(${table.safeMessage})) > 0`),
]);

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('audit_events_created_at_idx').on(table.createdAt),
  index('audit_events_event_type_created_at_idx').on(table.eventType, table.createdAt),
  check('audit_events_event_type_not_blank_check', sql`length(trim(${table.eventType})) > 0`),
  check('audit_events_metadata_object_check', sql`jsonb_typeof(${table.metadata}) = 'object'`),
]);

export const appSettings = pgTable('app_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  description: text('description'),
  updatedByUserId: uuid('updated_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  ...timestampColumns(),
}, table => [
  check('app_settings_key_not_blank_check', sql`length(trim(${table.key})) > 0`),
  check('app_settings_key_normalized_check', sql`${table.key} = lower(trim(${table.key}))`),
]);

export const usersRelations = relations(users, ({ one, many }) => ({
  technician: one(technicians),
  auditEvents: many(auditEvents),
  updatedSettings: many(appSettings),
}));

export const integrationConnectionsRelations = relations(integrationConnections, ({ many }) => ({
  technicians: many(technicians),
  companies: many(companies),
  contacts: many(contacts),
  interventions: many(interventions),
  syncRuns: many(syncRuns),
}));

export const techniciansRelations = relations(technicians, ({ one, many }) => ({
  user: one(users, { fields: [technicians.userId], references: [users.id] }),
  integrationConnection: one(integrationConnections, {
    fields: [technicians.integrationConnectionId],
    references: [integrationConnections.id],
  }),
  interventions: many(interventionTechnicians),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  integrationConnection: one(integrationConnections, {
    fields: [companies.integrationConnectionId],
    references: [integrationConnections.id],
  }),
  contacts: many(contacts),
  interventions: many(interventions),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  company: one(companies, { fields: [contacts.companyId], references: [companies.id] }),
  integrationConnection: one(integrationConnections, {
    fields: [contacts.integrationConnectionId],
    references: [integrationConnections.id],
  }),
  interventions: many(interventions),
  reviewRequests: many(reviewRequests),
}));

export const interventionsRelations = relations(interventions, ({ one, many }) => ({
  integrationConnection: one(integrationConnections, {
    fields: [interventions.integrationConnectionId],
    references: [integrationConnections.id],
  }),
  company: one(companies, { fields: [interventions.companyId], references: [companies.id] }),
  contact: one(contacts, { fields: [interventions.contactId], references: [contacts.id] }),
  technicians: many(interventionTechnicians),
  reviewRequests: many(reviewRequests),
}));

export const interventionTechniciansRelations = relations(interventionTechnicians, ({ one }) => ({
  intervention: one(interventions, {
    fields: [interventionTechnicians.interventionId],
    references: [interventions.id],
  }),
  technician: one(technicians, {
    fields: [interventionTechnicians.technicianId],
    references: [technicians.id],
  }),
}));

export const reviewRequestsRelations = relations(reviewRequests, ({ one }) => ({
  intervention: one(interventions, {
    fields: [reviewRequests.interventionId],
    references: [interventions.id],
  }),
  contact: one(contacts, { fields: [reviewRequests.contactId], references: [contacts.id] }),
}));

export const syncRunsRelations = relations(syncRuns, ({ one, many }) => ({
  integrationConnection: one(integrationConnections, {
    fields: [syncRuns.integrationConnectionId],
    references: [integrationConnections.id],
  }),
  errors: many(syncErrors),
}));

export const syncErrorsRelations = relations(syncErrors, ({ one }) => ({
  syncRun: one(syncRuns, { fields: [syncErrors.syncRunId], references: [syncRuns.id] }),
}));

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  actor: one(users, { fields: [auditEvents.actorUserId], references: [users.id] }),
}));

export const appSettingsRelations = relations(appSettings, ({ one }) => ({
  updatedBy: one(users, { fields: [appSettings.updatedByUserId], references: [users.id] }),
}));
