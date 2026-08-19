import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type {
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
} from './schema.ts';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type IntegrationConnection = InferSelectModel<typeof integrationConnections>;
export type NewIntegrationConnection = InferInsertModel<typeof integrationConnections>;
export type Technician = InferSelectModel<typeof technicians>;
export type NewTechnician = InferInsertModel<typeof technicians>;
export type Company = InferSelectModel<typeof companies>;
export type NewCompany = InferInsertModel<typeof companies>;
export type Contact = InferSelectModel<typeof contacts>;
export type NewContact = InferInsertModel<typeof contacts>;
export type Intervention = InferSelectModel<typeof interventions>;
export type NewIntervention = InferInsertModel<typeof interventions>;
export type InterventionTechnician = InferSelectModel<typeof interventionTechnicians>;
export type NewInterventionTechnician = InferInsertModel<typeof interventionTechnicians>;
export type ReviewRequest = InferSelectModel<typeof reviewRequests>;
export type NewReviewRequest = InferInsertModel<typeof reviewRequests>;
export type SyncRun = InferSelectModel<typeof syncRuns>;
export type NewSyncRun = InferInsertModel<typeof syncRuns>;
export type SyncError = InferSelectModel<typeof syncErrors>;
export type NewSyncError = InferInsertModel<typeof syncErrors>;
export type AuditEvent = InferSelectModel<typeof auditEvents>;
export type NewAuditEvent = InferInsertModel<typeof auditEvents>;
export type AppSetting = InferSelectModel<typeof appSettings>;
export type NewAppSetting = InferInsertModel<typeof appSettings>;
