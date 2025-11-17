CREATE TYPE "public"."email_provider_type" AS ENUM('gmail');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_email_unique" UNIQUE("email"),
	CONSTRAINT "accounts_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "account_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"email" text NOT NULL,
	"provider_type" "email_provider_type" DEFAULT 'gmail' NOT NULL,
	"google_refresh_token" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_pkd_numbers" (
	"company_id" uuid NOT NULL,
	"pkd_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_pkd_numbers_company_id_pkd_id_pk" PRIMARY KEY("company_id","pkd_id")
);
--> statement-breakpoint
CREATE TABLE "pkd_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pkd_number" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pkd_numbers_pkd_number_unique" UNIQUE("pkd_number")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"krs_number" text NOT NULL,
	"registration_date" timestamp with time zone NOT NULL,
	"email" text,
	"data_json" jsonb,
	"unique_senders_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_krs_number_unique" UNIQUE("krs_number")
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flow_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"account_email_id" uuid NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"account_email_id" uuid,
	"name" text NOT NULL,
	"email_template_html" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flow_pkd_numbers" (
	"flow_id" uuid NOT NULL,
	"pkd_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flow_pkd_numbers_flow_id_pkd_id_pk" PRIMARY KEY("flow_id","pkd_id")
);
--> statement-breakpoint
CREATE TABLE "suppression_list" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_email_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_first_contacts" (
	"account_email_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_first_contacts_account_email_id_recipient_id_pk" PRIMARY KEY("account_email_id","recipient_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_emails" ADD CONSTRAINT "account_emails_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_pkd_numbers" ADD CONSTRAINT "company_pkd_numbers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_pkd_numbers" ADD CONSTRAINT "company_pkd_numbers_pkd_id_pkd_numbers_id_fk" FOREIGN KEY ("pkd_id") REFERENCES "public"."pkd_numbers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_flow_id_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_recipient_id_companies_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_account_email_id_account_emails_id_fk" FOREIGN KEY ("account_email_id") REFERENCES "public"."account_emails"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flows" ADD CONSTRAINT "flows_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flows" ADD CONSTRAINT "flows_account_email_id_account_emails_id_fk" FOREIGN KEY ("account_email_id") REFERENCES "public"."account_emails"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_pkd_numbers" ADD CONSTRAINT "flow_pkd_numbers_flow_id_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_pkd_numbers" ADD CONSTRAINT "flow_pkd_numbers_pkd_id_pkd_numbers_id_fk" FOREIGN KEY ("pkd_id") REFERENCES "public"."pkd_numbers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppression_list" ADD CONSTRAINT "suppression_list_account_email_id_account_emails_id_fk" FOREIGN KEY ("account_email_id") REFERENCES "public"."account_emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppression_list" ADD CONSTRAINT "suppression_list_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_first_contacts" ADD CONSTRAINT "email_first_contacts_account_email_id_account_emails_id_fk" FOREIGN KEY ("account_email_id") REFERENCES "public"."account_emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_first_contacts" ADD CONSTRAINT "email_first_contacts_recipient_id_companies_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_account_emails_email" ON "account_emails" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_account_emails_account_id" ON "account_emails" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_suppression_per_email" ON "suppression_list" USING btree ("account_email_id","company_id");

-- Custom Functions and Triggers
-- FUNCTION: handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
    begin
      insert into public.accounts (id, email)
      values (new.id, new.email);
      return new;
    end;
    $$;

-- FUNCTION: deactivate_flows_on_account_email_deactivation
CREATE OR REPLACE FUNCTION deactivate_flows_on_account_email_deactivation()
RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
AS $$
      begin
        -- Check if isActive changed from true to false (update case)
        if TG_OP = 'UPDATE' and old.is_active = true and new.is_active = false then
          -- Deactivate all flows that use this account email
          update public.flows
          set is_active = false
          where account_email_id = new.id;
        end if;
        
        -- Handle delete case - deactivate flows before deletion
        if TG_OP = 'DELETE' then
          -- Deactivate all flows that use this account email
          update public.flows
          set is_active = false
          where account_email_id = old.id;
          
          return old;
        end if;
        
        return new;
      end;
      $$;

-- FUNCTION: update_updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
AS $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$;

-- FUNCTION: try_register_first_contact
CREATE OR REPLACE FUNCTION try_register_first_contact()
RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
AS $$
    begin
      insert into public.email_first_contacts (account_email_id, recipient_id)
      values (new.account_email_id, new.recipient_id)
      on conflict do nothing;
      return new;
    end;
    $$;

-- FUNCTION: bump_company_unique_senders_count
CREATE OR REPLACE FUNCTION bump_company_unique_senders_count()
RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
AS $$
      begin
        update public.companies
        set unique_senders_count = unique_senders_count + 1
        where id = new.recipient_id;
        return new;
      end;
    $$;

-- TRIGGER: on_accounts_updated
CREATE OR REPLACE TRIGGER on_accounts_updated
BEFORE UPDATE
ON accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- TRIGGER: on_auth_user_created
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT
ON "auth"."users"
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- TRIGGER: on_account_email_deactivated
CREATE OR REPLACE TRIGGER on_account_email_deactivated
BEFORE UPDATE OR DELETE
ON account_emails
FOR EACH ROW
EXECUTE FUNCTION deactivate_flows_on_account_email_deactivation();

-- TRIGGER: on_account_emails_updated
CREATE OR REPLACE TRIGGER on_account_emails_updated
BEFORE UPDATE
ON account_emails
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- TRIGGER: on_company_pkd_numbers_updated
CREATE OR REPLACE TRIGGER on_company_pkd_numbers_updated
BEFORE UPDATE
ON company_pkd_numbers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- TRIGGER: on_pkd_numbers_updated
CREATE OR REPLACE TRIGGER on_pkd_numbers_updated
BEFORE UPDATE
ON pkd_numbers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- TRIGGER: on_companies_updated
CREATE OR REPLACE TRIGGER on_companies_updated
BEFORE UPDATE
ON companies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- TRIGGER: on_email_logs_inserted_register_first
CREATE OR REPLACE TRIGGER on_email_logs_inserted_register_first
AFTER INSERT
ON email_logs
FOR EACH ROW
EXECUTE FUNCTION try_register_first_contact();

-- TRIGGER: on_email_logs_updated
CREATE OR REPLACE TRIGGER on_email_logs_updated
BEFORE UPDATE
ON email_logs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- TRIGGER: on_flows_updated
CREATE OR REPLACE TRIGGER on_flows_updated
BEFORE UPDATE
ON flows
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- TRIGGER: on_flow_pkd_numbers_updated
CREATE OR REPLACE TRIGGER on_flow_pkd_numbers_updated
BEFORE UPDATE
ON flow_pkd_numbers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- TRIGGER: on_suppression_list_updated
CREATE OR REPLACE TRIGGER on_suppression_list_updated
BEFORE UPDATE
ON suppression_list
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- TRIGGER: on_email_first_contacts_inserted
CREATE OR REPLACE TRIGGER on_email_first_contacts_inserted
AFTER INSERT
ON email_first_contacts
FOR EACH ROW
EXECUTE FUNCTION bump_company_unique_senders_count();

-- TRIGGER: on_email_first_contacts_updated
CREATE OR REPLACE TRIGGER on_email_first_contacts_updated
BEFORE UPDATE
ON email_first_contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();