CREATE TYPE "public"."intervention_status" AS ENUM('unknown', 'planned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."review_channel" AS ENUM('email', 'sms', 'whatsapp', 'manual');--> statement-breakpoint
CREATE TYPE "public"."review_request_status" AS ENUM('pending', 'scheduled', 'sent', 'follow_up_scheduled', 'review_received', 'do_not_contact', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sync_run_status" AS ENUM('running', 'succeeded', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'technician');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_key_not_blank_check" CHECK (length(trim("app_settings"."key")) > 0),
	CONSTRAINT "app_settings_key_normalized_check" CHECK ("app_settings"."key" = lower(trim("app_settings"."key")))
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"entity_type" varchar(100),
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_events_event_type_not_blank_check" CHECK (length(trim("audit_events"."event_type")) > 0),
	CONSTRAINT "audit_events_metadata_object_check" CHECK (jsonb_typeof("audit_events"."metadata") = 'object')
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_connection_id" uuid,
	"external_id" text,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_name_not_blank_check" CHECK (length(trim("companies"."name")) > 0),
	CONSTRAINT "companies_external_identity_consistency_check" CHECK (("companies"."integration_connection_id" is null and "companies"."external_id" is null) or ("companies"."integration_connection_id" is not null and "companies"."external_id" is not null and length(trim("companies"."external_id")) > 0))
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"integration_connection_id" uuid,
	"external_id" text,
	"name" text NOT NULL,
	"email" varchar(320),
	"phone" varchar(50),
	"language" varchar(16),
	"active" boolean DEFAULT true NOT NULL,
	"review_opt_out" boolean DEFAULT false NOT NULL,
	"review_opt_out_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contacts_name_not_blank_check" CHECK (length(trim("contacts"."name")) > 0),
	CONSTRAINT "contacts_external_identity_consistency_check" CHECK (("contacts"."integration_connection_id" is null and "contacts"."external_id" is null) or ("contacts"."integration_connection_id" is not null and "contacts"."external_id" is not null and length(trim("contacts"."external_id")) > 0)),
	CONSTRAINT "contacts_review_opt_out_consistency_check" CHECK (("contacts"."review_opt_out" = false and "contacts"."review_opt_out_at" is null) or ("contacts"."review_opt_out" = true and "contacts"."review_opt_out_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "integration_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(50) NOT NULL,
	"display_name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integration_connections_provider_normalized_check" CHECK ("integration_connections"."provider" = lower(trim("integration_connections"."provider")) and length("integration_connections"."provider") > 0),
	CONSTRAINT "integration_connections_display_name_not_blank_check" CHECK (length(trim("integration_connections"."display_name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "intervention_technicians" (
	"intervention_id" uuid NOT NULL,
	"technician_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "intervention_technicians_primary_key" PRIMARY KEY("intervention_id","technician_id")
);
--> statement-breakpoint
CREATE TABLE "interventions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_connection_id" uuid,
	"external_source" varchar(50) DEFAULT 'manual' NOT NULL,
	"external_id" text,
	"company_id" uuid,
	"contact_id" uuid,
	"title" text NOT NULL,
	"intervention_type" text,
	"status" "intervention_status" DEFAULT 'unknown' NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"source_updated_at" timestamp with time zone,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interventions_external_source_not_blank_check" CHECK (length(trim("interventions"."external_source")) > 0),
	CONSTRAINT "interventions_external_id_not_blank_check" CHECK ("interventions"."external_id" is null or length(trim("interventions"."external_id")) > 0),
	CONSTRAINT "interventions_connected_external_id_check" CHECK ("interventions"."integration_connection_id" is null or "interventions"."external_id" is not null),
	CONSTRAINT "interventions_title_not_blank_check" CHECK (length(trim("interventions"."title")) > 0),
	CONSTRAINT "interventions_dates_order_check" CHECK ("interventions"."started_at" is null or "interventions"."ended_at" is null or "interventions"."ended_at" >= "interventions"."started_at")
);
--> statement-breakpoint
CREATE TABLE "review_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intervention_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"status" "review_request_status" DEFAULT 'pending' NOT NULL,
	"planned_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"next_follow_up_at" timestamp with time zone,
	"attempts_count" integer DEFAULT 0 NOT NULL,
	"follow_up_count" integer DEFAULT 0 NOT NULL,
	"channel" "review_channel",
	"review_received_at" timestamp with time zone,
	"idempotency_key" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_requests_attempts_count_check" CHECK ("review_requests"."attempts_count" >= 0),
	CONSTRAINT "review_requests_follow_up_count_check" CHECK ("review_requests"."follow_up_count" >= 0),
	CONSTRAINT "review_requests_idempotency_key_not_blank_check" CHECK (length(trim("review_requests"."idempotency_key")) > 0),
	CONSTRAINT "review_requests_idempotency_key_normalized_check" CHECK ("review_requests"."idempotency_key" = trim("review_requests"."idempotency_key"))
);
--> statement-breakpoint
CREATE TABLE "sync_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sync_run_id" uuid NOT NULL,
	"external_type" text,
	"external_id" text,
	"category" varchar(100) NOT NULL,
	"safe_message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sync_errors_category_not_blank_check" CHECK (length(trim("sync_errors"."category")) > 0),
	CONSTRAINT "sync_errors_safe_message_not_blank_check" CHECK (length(trim("sync_errors"."safe_message")) > 0)
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_connection_id" uuid,
	"source" varchar(50) NOT NULL,
	"status" "sync_run_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"records_read" integer DEFAULT 0 NOT NULL,
	"records_created" integer DEFAULT 0 NOT NULL,
	"records_updated" integer DEFAULT 0 NOT NULL,
	"records_failed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sync_runs_source_not_blank_check" CHECK (length(trim("sync_runs"."source")) > 0),
	CONSTRAINT "sync_runs_records_read_check" CHECK ("sync_runs"."records_read" >= 0),
	CONSTRAINT "sync_runs_records_created_check" CHECK ("sync_runs"."records_created" >= 0),
	CONSTRAINT "sync_runs_records_updated_check" CHECK ("sync_runs"."records_updated" >= 0),
	CONSTRAINT "sync_runs_records_failed_check" CHECK ("sync_runs"."records_failed" >= 0),
	CONSTRAINT "sync_runs_dates_order_check" CHECK ("sync_runs"."finished_at" is null or "sync_runs"."finished_at" >= "sync_runs"."started_at")
);
--> statement-breakpoint
CREATE TABLE "technicians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"integration_connection_id" uuid,
	"external_id" text,
	"display_name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "technicians_display_name_not_blank_check" CHECK (length(trim("technicians"."display_name")) > 0),
	CONSTRAINT "technicians_external_identity_consistency_check" CHECK (("technicians"."integration_connection_id" is null and "technicians"."external_id" is null) or ("technicians"."integration_connection_id" is not null and "technicians"."external_id" is not null and length(trim("technicians"."external_id")) > 0))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" text NOT NULL,
	"role" "user_role" DEFAULT 'technician' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_normalized_check" CHECK ("users"."email" = lower(trim("users"."email"))),
	CONSTRAINT "users_email_not_blank_check" CHECK (length(trim("users"."email")) > 0),
	CONSTRAINT "users_display_name_not_blank_check" CHECK (length(trim("users"."display_name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_integration_connection_id_integration_connections_id_fk" FOREIGN KEY ("integration_connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_integration_connection_id_integration_connections_id_fk" FOREIGN KEY ("integration_connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention_technicians" ADD CONSTRAINT "intervention_technicians_intervention_id_interventions_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention_technicians" ADD CONSTRAINT "intervention_technicians_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_integration_connection_id_integration_connections_id_fk" FOREIGN KEY ("integration_connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_intervention_id_interventions_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_errors" ADD CONSTRAINT "sync_errors_sync_run_id_sync_runs_id_fk" FOREIGN KEY ("sync_run_id") REFERENCES "public"."sync_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_integration_connection_id_integration_connections_id_fk" FOREIGN KEY ("integration_connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_integration_connection_id_integration_connections_id_fk" FOREIGN KEY ("integration_connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_created_at_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_events_event_type_created_at_idx" ON "audit_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_connection_external_id_unique" ON "companies" USING btree ("integration_connection_id","external_id") WHERE "companies"."integration_connection_id" is not null and "companies"."external_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_connection_external_id_unique" ON "contacts" USING btree ("integration_connection_id","external_id") WHERE "contacts"."integration_connection_id" is not null and "contacts"."external_id" is not null;--> statement-breakpoint
CREATE INDEX "contacts_company_id_idx" ON "contacts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "intervention_technicians_technician_id_idx" ON "intervention_technicians" USING btree ("technician_id");--> statement-breakpoint
CREATE UNIQUE INDEX "interventions_connection_external_id_unique" ON "interventions" USING btree ("integration_connection_id","external_id") WHERE "interventions"."integration_connection_id" is not null and "interventions"."external_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "interventions_unconnected_source_external_id_unique" ON "interventions" USING btree ("external_source","external_id") WHERE "interventions"."integration_connection_id" is null and "interventions"."external_id" is not null;--> statement-breakpoint
CREATE INDEX "interventions_company_ended_at_idx" ON "interventions" USING btree ("company_id","ended_at");--> statement-breakpoint
CREATE INDEX "interventions_status_ended_at_idx" ON "interventions" USING btree ("status","ended_at");--> statement-breakpoint
CREATE UNIQUE INDEX "review_requests_idempotency_key_unique" ON "review_requests" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "review_requests_intervention_id_idx" ON "review_requests" USING btree ("intervention_id");--> statement-breakpoint
CREATE INDEX "review_requests_status_planned_at_idx" ON "review_requests" USING btree ("status","planned_at");--> statement-breakpoint
CREATE INDEX "sync_errors_sync_run_id_idx" ON "sync_errors" USING btree ("sync_run_id");--> statement-breakpoint
CREATE INDEX "sync_runs_connection_started_at_idx" ON "sync_runs" USING btree ("integration_connection_id","started_at");--> statement-breakpoint
CREATE INDEX "sync_runs_source_started_at_idx" ON "sync_runs" USING btree ("source","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "technicians_user_id_unique" ON "technicians" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "technicians_connection_external_id_unique" ON "technicians" USING btree ("integration_connection_id","external_id") WHERE "technicians"."integration_connection_id" is not null and "technicians"."external_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");