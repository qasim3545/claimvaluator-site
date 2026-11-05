import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_template" AS ENUM('default', 'wide', 'home', 'tools', 'states', 'laws', 'laws-table', 'directory', 'blog', 'form');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_template" AS ENUM('default', 'wide', 'home', 'tools', 'states', 'laws', 'laws-table', 'directory', 'blog', 'form');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_tools_category" AS ENUM('accident', 'injuries', 'money', 'offers', 'deadlines', 'insurance', 'benefits', 'employment', 'insurers', 'mass-torts', 'property');
  CREATE TYPE "public"."enum_tools_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__tools_v_version_category" AS ENUM('accident', 'injuries', 'money', 'offers', 'deadlines', 'insurance', 'benefits', 'employment', 'insurers', 'mass-torts', 'property');
  CREATE TYPE "public"."enum__tools_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_states_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__states_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_state_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__state_pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_lawyers_practice_areas" AS ENUM('Personal injury', 'Car accidents', 'Truck accidents', 'Motorcycle accidents', 'Pedestrian and bicycle accidents', 'Premises liability', 'Dog bites', 'Medical malpractice', 'Nursing home abuse', 'Product liability', 'Wrongful death', 'Workers'' compensation', 'Social Security disability', 'Long-term disability', 'Employment law', 'Insurance disputes', 'Civil rights', 'Mass torts', 'Maritime injury', 'Aviation accidents');
  CREATE TYPE "public"."enum_lawyers_verified" AS ENUM('registry', 'admin', 'unverified');
  CREATE TYPE "public"."enum_lawyers_source" AS ENUM('ny-registry', 'submission', 'admin');
  CREATE TYPE "public"."enum_lawyers_indexing" AS ENUM('index', 'noindex');
  CREATE TYPE "public"."enum_lawyers_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lawyers_v_version_practice_areas" AS ENUM('Personal injury', 'Car accidents', 'Truck accidents', 'Motorcycle accidents', 'Pedestrian and bicycle accidents', 'Premises liability', 'Dog bites', 'Medical malpractice', 'Nursing home abuse', 'Product liability', 'Wrongful death', 'Workers'' compensation', 'Social Security disability', 'Long-term disability', 'Employment law', 'Insurance disputes', 'Civil rights', 'Mass torts', 'Maritime injury', 'Aviation accidents');
  CREATE TYPE "public"."enum__lawyers_v_version_verified" AS ENUM('registry', 'admin', 'unverified');
  CREATE TYPE "public"."enum__lawyers_v_version_source" AS ENUM('ny-registry', 'submission', 'admin');
  CREATE TYPE "public"."enum__lawyers_v_version_indexing" AS ENUM('index', 'noindex');
  CREATE TYPE "public"."enum__lawyers_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_settlements_claim_status" AS ENUM('open', 'closed', 'paid');
  CREATE TYPE "public"."enum_settlements_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__settlements_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_leads_kind" AS ENUM('case-review', 'contact', 'attorney-partner', 'listing-update');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'author');
  CREATE TYPE "public"."enum_redirects_to_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_redirects_type" AS ENUM('301', '302');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('media');
  CREATE TYPE "public"."enum_header_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_footer_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TABLE "pages_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "pages_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "pages_breadcrumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"doc_id" integer,
  	"url" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"legacy_html" varchar,
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"meta_canonical" varchar,
  	"meta_noindex" boolean DEFAULT false,
  	"meta_schema_override" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"template" "enum_pages_template" DEFAULT 'default',
  	"author_id" integer,
  	"review_line" varchar DEFAULT 'Fact-checked by the ClaimValuator Editorial Team',
  	"reviewed_at" timestamp(3) with time zone,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"parent_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_pages_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_version_breadcrumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"doc_id" integer,
  	"url" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_legacy_html" varchar,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"version_meta_canonical" varchar,
  	"version_meta_noindex" boolean DEFAULT false,
  	"version_meta_schema_override" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_template" "enum__pages_v_version_template" DEFAULT 'default',
  	"version_author_id" integer,
  	"version_review_line" varchar DEFAULT 'Fact-checked by the ClaimValuator Editorial Team',
  	"version_reviewed_at" timestamp(3) with time zone,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_parent_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "posts_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "posts_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "posts_populated_authors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"hero_image_id" integer,
  	"content" jsonb,
  	"inline_image_id" integer,
  	"legacy_html" varchar,
  	"reviewer_name" varchar,
  	"reviewer_title" varchar,
  	"reviewer_url" varchar,
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"meta_canonical" varchar,
  	"meta_noindex" boolean DEFAULT false,
  	"meta_schema_override" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"review_line" varchar DEFAULT 'Fact-checked by the ClaimValuator Editorial Team',
  	"reviewed_at" timestamp(3) with time zone,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer,
  	"categories_id" integer,
  	"tools_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "_posts_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v_version_populated_authors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"name" varchar
  );
  
  CREATE TABLE "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_hero_image_id" integer,
  	"version_content" jsonb,
  	"version_inline_image_id" integer,
  	"version_legacy_html" varchar,
  	"version_reviewer_name" varchar,
  	"version_reviewer_title" varchar,
  	"version_reviewer_url" varchar,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"version_meta_canonical" varchar,
  	"version_meta_noindex" boolean DEFAULT false,
  	"version_meta_schema_override" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_review_line" varchar DEFAULT 'Fact-checked by the ClaimValuator Editorial Team',
  	"version_reviewed_at" timestamp(3) with time zone,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer,
  	"categories_id" integer,
  	"tools_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "tools_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "tools_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "tools" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"legacy_html" varchar,
  	"short" varchar,
  	"card" varchar,
  	"category" "enum_tools_category",
  	"engine_type" varchar,
  	"variant" varchar,
  	"uses_states" boolean DEFAULT false,
  	"state_pages" boolean DEFAULT false,
  	"icon" varchar,
  	"fields_override" jsonb,
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"meta_canonical" varchar,
  	"meta_noindex" boolean DEFAULT false,
  	"meta_schema_override" jsonb,
  	"slug" varchar,
  	"author_id" integer,
  	"review_line" varchar DEFAULT 'Fact-checked by the ClaimValuator Editorial Team',
  	"reviewed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_tools_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "tools_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tools_id" integer
  );
  
  CREATE TABLE "_tools_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_tools_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_tools_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_legacy_html" varchar,
  	"version_short" varchar,
  	"version_card" varchar,
  	"version_category" "enum__tools_v_version_category",
  	"version_engine_type" varchar,
  	"version_variant" varchar,
  	"version_uses_states" boolean DEFAULT false,
  	"version_state_pages" boolean DEFAULT false,
  	"version_icon" varchar,
  	"version_fields_override" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"version_meta_canonical" varchar,
  	"version_meta_noindex" boolean DEFAULT false,
  	"version_meta_schema_override" jsonb,
  	"version_slug" varchar,
  	"version_author_id" integer,
  	"version_review_line" varchar DEFAULT 'Fact-checked by the ClaimValuator Editorial Team',
  	"version_reviewed_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__tools_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_tools_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tools_id" integer
  );
  
  CREATE TABLE "states_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "states_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "states" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"name" varchar,
  	"abbr" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"legacy_html" varchar,
  	"rules" jsonb,
  	"facts_html" varchar,
  	"rules_html" varchar,
  	"generated_faq" jsonb,
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"meta_canonical" varchar,
  	"meta_noindex" boolean DEFAULT false,
  	"meta_schema_override" jsonb,
  	"slug" varchar,
  	"author_id" integer,
  	"review_line" varchar DEFAULT 'Fact-checked by the ClaimValuator Editorial Team',
  	"reviewed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_states_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_states_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_states_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_states_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_name" varchar,
  	"version_abbr" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_legacy_html" varchar,
  	"version_rules" jsonb,
  	"version_facts_html" varchar,
  	"version_rules_html" varchar,
  	"version_generated_faq" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"version_meta_canonical" varchar,
  	"version_meta_noindex" boolean DEFAULT false,
  	"version_meta_schema_override" jsonb,
  	"version_slug" varchar,
  	"version_author_id" integer,
  	"version_review_line" varchar DEFAULT 'Fact-checked by the ClaimValuator Editorial Team',
  	"version_reviewed_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__states_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "state_pages_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "state_pages_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "state_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tool_id" integer,
  	"state_id" integer,
  	"excerpt" varchar,
  	"content" jsonb,
  	"legacy_html" varchar,
  	"state_section" jsonb,
  	"facts_html" varchar,
  	"rules_html" varchar,
  	"generated_faq" jsonb,
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"meta_canonical" varchar,
  	"meta_noindex" boolean DEFAULT false,
  	"meta_schema_override" jsonb,
  	"path" varchar,
  	"author_id" integer,
  	"review_line" varchar DEFAULT 'Fact-checked by the ClaimValuator Editorial Team',
  	"reviewed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_state_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_state_pages_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_state_pages_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_state_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_tool_id" integer,
  	"version_state_id" integer,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_legacy_html" varchar,
  	"version_state_section" jsonb,
  	"version_facts_html" varchar,
  	"version_rules_html" varchar,
  	"version_generated_faq" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"version_meta_canonical" varchar,
  	"version_meta_noindex" boolean DEFAULT false,
  	"version_meta_schema_override" jsonb,
  	"version_path" varchar,
  	"version_author_id" integer,
  	"version_review_line" varchar DEFAULT 'Fact-checked by the ClaimValuator Editorial Team',
  	"version_reviewed_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__state_pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "lawyers_practice_areas" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_lawyers_practice_areas",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "lawyers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"first" varchar,
  	"middle" varchar,
  	"last" varchar,
  	"suffix" varchar,
  	"job_title" varchar,
  	"firm" varchar,
  	"city" varchar,
  	"state_id" integer,
  	"excerpt" varchar,
  	"content" jsonb,
  	"legacy_html" varchar,
  	"year" numeric,
  	"jd" numeric,
  	"school" varchar,
  	"reg_no" varchar,
  	"reg_status" varchar,
  	"website" varchar,
  	"public_email" varchar,
  	"public_phone" varchar,
  	"image" varchar,
  	"verified" "enum_lawyers_verified" DEFAULT 'unverified',
  	"source" "enum_lawyers_source",
  	"source_label" varchar,
  	"source_url" varchar,
  	"source_checked" varchar,
  	"indexing" "enum_lawyers_indexing" DEFAULT 'noindex',
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"meta_canonical" varchar,
  	"meta_noindex" boolean DEFAULT false,
  	"meta_schema_override" jsonb,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_lawyers_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "lawyers_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_lawyers_v_version_practice_areas" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__lawyers_v_version_practice_areas",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_lawyers_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_first" varchar,
  	"version_middle" varchar,
  	"version_last" varchar,
  	"version_suffix" varchar,
  	"version_job_title" varchar,
  	"version_firm" varchar,
  	"version_city" varchar,
  	"version_state_id" integer,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_legacy_html" varchar,
  	"version_year" numeric,
  	"version_jd" numeric,
  	"version_school" varchar,
  	"version_reg_no" varchar,
  	"version_reg_status" varchar,
  	"version_website" varchar,
  	"version_public_email" varchar,
  	"version_public_phone" varchar,
  	"version_image" varchar,
  	"version_verified" "enum__lawyers_v_version_verified" DEFAULT 'unverified',
  	"version_source" "enum__lawyers_v_version_source",
  	"version_source_label" varchar,
  	"version_source_url" varchar,
  	"version_source_checked" varchar,
  	"version_indexing" "enum__lawyers_v_version_indexing" DEFAULT 'noindex',
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"version_meta_canonical" varchar,
  	"version_meta_noindex" boolean DEFAULT false,
  	"version_meta_schema_override" jsonb,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__lawyers_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_lawyers_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "settlements_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "settlements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"status" "enum_settlements_claim_status" DEFAULT 'open',
  	"deadline" timestamp(3) with time zone,
  	"claim_url" varchar,
  	"fund" varchar,
  	"who_qualifies" varchar,
  	"payout" varchar,
  	"content" jsonb,
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"meta_canonical" varchar,
  	"meta_noindex" boolean DEFAULT false,
  	"meta_schema_override" jsonb,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_settlements_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_settlements_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_settlements_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_status" "enum_settlements_claim_status" DEFAULT 'open',
  	"version_deadline" timestamp(3) with time zone,
  	"version_claim_url" varchar,
  	"version_fund" varchar,
  	"version_who_qualifies" varchar,
  	"version_payout" varchar,
  	"version_content" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"version_meta_canonical" varchar,
  	"version_meta_noindex" boolean DEFAULT false,
  	"version_meta_schema_override" jsonb,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__settlements_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_leads_kind" DEFAULT 'case-review',
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"state" varchar,
  	"message" varchar,
  	"page" varchar,
  	"consent" boolean DEFAULT false NOT NULL,
  	"website" varchar,
  	"handled" boolean DEFAULT false,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" jsonb,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_wide_url" varchar,
  	"sizes_wide_width" numeric,
  	"sizes_wide_height" numeric,
  	"sizes_wide_mime_type" varchar,
  	"sizes_wide_filesize" numeric,
  	"sizes_wide_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "categories_breadcrumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"doc_id" integer,
  	"url" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"parent_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"slug" varchar,
  	"job_title" varchar,
  	"bio" varchar,
  	"photo_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to_type" "enum_redirects_to_type" DEFAULT 'reference',
  	"to_url" varchar,
  	"type" "enum_redirects_type" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "redirects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer,
  	"tools_id" integer,
  	"states_id" integer,
  	"state_pages_id" integer,
  	"lawyers_id" integer
  );
  
  CREATE TABLE "search_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"relation_to" varchar,
  	"category_i_d" varchar,
  	"title" varchar
  );
  
  CREATE TABLE "search" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"priority" numeric,
  	"slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "search_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer,
  	"tools_id" integer,
  	"states_id" integer
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_folders_folder_type" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_payload_folders_folder_type",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload_folders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer,
  	"tools_id" integer,
  	"states_id" integer,
  	"state_pages_id" integer,
  	"lawyers_id" integer,
  	"settlements_id" integer,
  	"leads_id" integer,
  	"media_id" integer,
  	"categories_id" integer,
  	"users_id" integer,
  	"redirects_id" integer,
  	"search_id" integer,
  	"payload_folders_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "header_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_header_nav_items_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL
  );
  
  CREATE TABLE "header" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "header_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer,
  	"tools_id" integer,
  	"states_id" integer
  );
  
  CREATE TABLE "footer_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_footer_nav_items_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL
  );
  
  CREATE TABLE "footer" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "footer_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer,
  	"tools_id" integer,
  	"states_id" integer
  );
  
  CREATE TABLE "site_settings_same_as" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'ClaimValuator',
  	"tagline" varchar DEFAULT 'Free injury claim and settlement calculators built on each state’s rules',
  	"leads_enabled" boolean DEFAULT true,
  	"lead_email" varchar,
  	"cta_path" varchar DEFAULT '/free-case-review/',
  	"disclosure" varchar DEFAULT 'Paid attorney referral. We may be paid when you contact a participating firm. ClaimValuator is not a law firm.',
  	"ga4_id" varchar,
  	"clarity_id" varchar,
  	"ads_enabled" boolean DEFAULT false,
  	"ads_head_html" varchar,
  	"org_name" varchar DEFAULT 'ClaimValuator',
  	"org_logo_id" integer,
  	"disclaimer" varchar DEFAULT 'ClaimValuator is not a law firm and does not give legal advice. Estimates are not a prediction of any outcome or a settlement offer.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pages_faqs" ADD CONSTRAINT "pages_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_sources" ADD CONSTRAINT "pages_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_breadcrumbs" ADD CONSTRAINT "pages_breadcrumbs_doc_id_pages_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_breadcrumbs" ADD CONSTRAINT "pages_breadcrumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_version_faqs" ADD CONSTRAINT "_pages_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_sources" ADD CONSTRAINT "_pages_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_breadcrumbs" ADD CONSTRAINT "_pages_v_version_breadcrumbs_doc_id_pages_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_version_breadcrumbs" ADD CONSTRAINT "_pages_v_version_breadcrumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_parent_id_pages_id_fk" FOREIGN KEY ("version_parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_faqs" ADD CONSTRAINT "posts_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_sources" ADD CONSTRAINT "posts_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_populated_authors" ADD CONSTRAINT "posts_populated_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_inline_image_id_media_id_fk" FOREIGN KEY ("inline_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_tools_fk" FOREIGN KEY ("tools_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_faqs" ADD CONSTRAINT "_posts_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_sources" ADD CONSTRAINT "_posts_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_populated_authors" ADD CONSTRAINT "_posts_v_version_populated_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_inline_image_id_media_id_fk" FOREIGN KEY ("version_inline_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_tools_fk" FOREIGN KEY ("tools_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tools_faqs" ADD CONSTRAINT "tools_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tools_sources" ADD CONSTRAINT "tools_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tools" ADD CONSTRAINT "tools_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tools" ADD CONSTRAINT "tools_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tools_rels" ADD CONSTRAINT "tools_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tools_rels" ADD CONSTRAINT "tools_rels_tools_fk" FOREIGN KEY ("tools_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tools_v_version_faqs" ADD CONSTRAINT "_tools_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_tools_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tools_v_version_sources" ADD CONSTRAINT "_tools_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_tools_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tools_v" ADD CONSTRAINT "_tools_v_parent_id_tools_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tools"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_tools_v" ADD CONSTRAINT "_tools_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_tools_v" ADD CONSTRAINT "_tools_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_tools_v_rels" ADD CONSTRAINT "_tools_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_tools_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tools_v_rels" ADD CONSTRAINT "_tools_v_rels_tools_fk" FOREIGN KEY ("tools_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "states_faqs" ADD CONSTRAINT "states_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "states_sources" ADD CONSTRAINT "states_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "states" ADD CONSTRAINT "states_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "states" ADD CONSTRAINT "states_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_states_v_version_faqs" ADD CONSTRAINT "_states_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_states_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_states_v_version_sources" ADD CONSTRAINT "_states_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_states_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_states_v" ADD CONSTRAINT "_states_v_parent_id_states_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."states"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_states_v" ADD CONSTRAINT "_states_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_states_v" ADD CONSTRAINT "_states_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "state_pages_faqs" ADD CONSTRAINT "state_pages_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."state_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "state_pages_sources" ADD CONSTRAINT "state_pages_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."state_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "state_pages" ADD CONSTRAINT "state_pages_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "state_pages" ADD CONSTRAINT "state_pages_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "state_pages" ADD CONSTRAINT "state_pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "state_pages" ADD CONSTRAINT "state_pages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_state_pages_v_version_faqs" ADD CONSTRAINT "_state_pages_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_state_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_state_pages_v_version_sources" ADD CONSTRAINT "_state_pages_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_state_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_state_pages_v" ADD CONSTRAINT "_state_pages_v_parent_id_state_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."state_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_state_pages_v" ADD CONSTRAINT "_state_pages_v_version_tool_id_tools_id_fk" FOREIGN KEY ("version_tool_id") REFERENCES "public"."tools"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_state_pages_v" ADD CONSTRAINT "_state_pages_v_version_state_id_states_id_fk" FOREIGN KEY ("version_state_id") REFERENCES "public"."states"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_state_pages_v" ADD CONSTRAINT "_state_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_state_pages_v" ADD CONSTRAINT "_state_pages_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lawyers_practice_areas" ADD CONSTRAINT "lawyers_practice_areas_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lawyers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lawyers" ADD CONSTRAINT "lawyers_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lawyers" ADD CONSTRAINT "lawyers_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lawyers_texts" ADD CONSTRAINT "lawyers_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lawyers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lawyers_v_version_practice_areas" ADD CONSTRAINT "_lawyers_v_version_practice_areas_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_lawyers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lawyers_v" ADD CONSTRAINT "_lawyers_v_parent_id_lawyers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lawyers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lawyers_v" ADD CONSTRAINT "_lawyers_v_version_state_id_states_id_fk" FOREIGN KEY ("version_state_id") REFERENCES "public"."states"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lawyers_v" ADD CONSTRAINT "_lawyers_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lawyers_v_texts" ADD CONSTRAINT "_lawyers_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_lawyers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settlements_sources" ADD CONSTRAINT "settlements_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settlements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settlements" ADD CONSTRAINT "settlements_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_settlements_v_version_sources" ADD CONSTRAINT "_settlements_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_settlements_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_settlements_v" ADD CONSTRAINT "_settlements_v_parent_id_settlements_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."settlements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_settlements_v" ADD CONSTRAINT "_settlements_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_breadcrumbs" ADD CONSTRAINT "categories_breadcrumbs_doc_id_categories_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_breadcrumbs" ADD CONSTRAINT "categories_breadcrumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_links" ADD CONSTRAINT "users_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_tools_fk" FOREIGN KEY ("tools_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_states_fk" FOREIGN KEY ("states_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_state_pages_fk" FOREIGN KEY ("state_pages_id") REFERENCES "public"."state_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_lawyers_fk" FOREIGN KEY ("lawyers_id") REFERENCES "public"."lawyers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_categories" ADD CONSTRAINT "search_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search" ADD CONSTRAINT "search_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_tools_fk" FOREIGN KEY ("tools_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_states_fk" FOREIGN KEY ("states_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders_folder_type" ADD CONSTRAINT "payload_folders_folder_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tools_fk" FOREIGN KEY ("tools_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_states_fk" FOREIGN KEY ("states_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_state_pages_fk" FOREIGN KEY ("state_pages_id") REFERENCES "public"."state_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lawyers_fk" FOREIGN KEY ("lawyers_id") REFERENCES "public"."lawyers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_settlements_fk" FOREIGN KEY ("settlements_id") REFERENCES "public"."settlements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_fk" FOREIGN KEY ("search_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_items" ADD CONSTRAINT "header_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_tools_fk" FOREIGN KEY ("tools_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_states_fk" FOREIGN KEY ("states_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_items" ADD CONSTRAINT "footer_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_tools_fk" FOREIGN KEY ("tools_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_states_fk" FOREIGN KEY ("states_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_same_as" ADD CONSTRAINT "site_settings_same_as_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_org_logo_id_media_id_fk" FOREIGN KEY ("org_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_faqs_order_idx" ON "pages_faqs" USING btree ("_order");
  CREATE INDEX "pages_faqs_parent_id_idx" ON "pages_faqs" USING btree ("_parent_id");
  CREATE INDEX "pages_sources_order_idx" ON "pages_sources" USING btree ("_order");
  CREATE INDEX "pages_sources_parent_id_idx" ON "pages_sources" USING btree ("_parent_id");
  CREATE INDEX "pages_breadcrumbs_order_idx" ON "pages_breadcrumbs" USING btree ("_order");
  CREATE INDEX "pages_breadcrumbs_parent_id_idx" ON "pages_breadcrumbs" USING btree ("_parent_id");
  CREATE INDEX "pages_breadcrumbs_doc_idx" ON "pages_breadcrumbs" USING btree ("doc_id");
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages" USING btree ("meta_image_id");
  CREATE INDEX "pages_author_idx" ON "pages" USING btree ("author_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_parent_idx" ON "pages" USING btree ("parent_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "_pages_v_version_faqs_order_idx" ON "_pages_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_pages_v_version_faqs_parent_id_idx" ON "_pages_v_version_faqs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_sources_order_idx" ON "_pages_v_version_sources" USING btree ("_order");
  CREATE INDEX "_pages_v_version_sources_parent_id_idx" ON "_pages_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_breadcrumbs_order_idx" ON "_pages_v_version_breadcrumbs" USING btree ("_order");
  CREATE INDEX "_pages_v_version_breadcrumbs_parent_id_idx" ON "_pages_v_version_breadcrumbs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_breadcrumbs_doc_idx" ON "_pages_v_version_breadcrumbs" USING btree ("doc_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_pages_v_version_version_author_idx" ON "_pages_v" USING btree ("version_author_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_parent_idx" ON "_pages_v" USING btree ("version_parent_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE INDEX "posts_faqs_order_idx" ON "posts_faqs" USING btree ("_order");
  CREATE INDEX "posts_faqs_parent_id_idx" ON "posts_faqs" USING btree ("_parent_id");
  CREATE INDEX "posts_sources_order_idx" ON "posts_sources" USING btree ("_order");
  CREATE INDEX "posts_sources_parent_id_idx" ON "posts_sources" USING btree ("_parent_id");
  CREATE INDEX "posts_populated_authors_order_idx" ON "posts_populated_authors" USING btree ("_order");
  CREATE INDEX "posts_populated_authors_parent_id_idx" ON "posts_populated_authors" USING btree ("_parent_id");
  CREATE INDEX "posts_hero_image_idx" ON "posts" USING btree ("hero_image_id");
  CREATE INDEX "posts_inline_image_idx" ON "posts" USING btree ("inline_image_id");
  CREATE INDEX "posts_meta_meta_image_idx" ON "posts" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_posts_id_idx" ON "posts_rels" USING btree ("posts_id");
  CREATE INDEX "posts_rels_categories_id_idx" ON "posts_rels" USING btree ("categories_id");
  CREATE INDEX "posts_rels_tools_id_idx" ON "posts_rels" USING btree ("tools_id");
  CREATE INDEX "posts_rels_users_id_idx" ON "posts_rels" USING btree ("users_id");
  CREATE INDEX "_posts_v_version_faqs_order_idx" ON "_posts_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_posts_v_version_faqs_parent_id_idx" ON "_posts_v_version_faqs" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_sources_order_idx" ON "_posts_v_version_sources" USING btree ("_order");
  CREATE INDEX "_posts_v_version_sources_parent_id_idx" ON "_posts_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_populated_authors_order_idx" ON "_posts_v_version_populated_authors" USING btree ("_order");
  CREATE INDEX "_posts_v_version_populated_authors_parent_id_idx" ON "_posts_v_version_populated_authors" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_hero_image_idx" ON "_posts_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_posts_v_version_version_inline_image_idx" ON "_posts_v" USING btree ("version_inline_image_id");
  CREATE INDEX "_posts_v_version_meta_version_meta_image_idx" ON "_posts_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX "_posts_v_autosave_idx" ON "_posts_v" USING btree ("autosave");
  CREATE INDEX "_posts_v_rels_order_idx" ON "_posts_v_rels" USING btree ("order");
  CREATE INDEX "_posts_v_rels_parent_idx" ON "_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_posts_v_rels_path_idx" ON "_posts_v_rels" USING btree ("path");
  CREATE INDEX "_posts_v_rels_posts_id_idx" ON "_posts_v_rels" USING btree ("posts_id");
  CREATE INDEX "_posts_v_rels_categories_id_idx" ON "_posts_v_rels" USING btree ("categories_id");
  CREATE INDEX "_posts_v_rels_tools_id_idx" ON "_posts_v_rels" USING btree ("tools_id");
  CREATE INDEX "_posts_v_rels_users_id_idx" ON "_posts_v_rels" USING btree ("users_id");
  CREATE INDEX "tools_faqs_order_idx" ON "tools_faqs" USING btree ("_order");
  CREATE INDEX "tools_faqs_parent_id_idx" ON "tools_faqs" USING btree ("_parent_id");
  CREATE INDEX "tools_sources_order_idx" ON "tools_sources" USING btree ("_order");
  CREATE INDEX "tools_sources_parent_id_idx" ON "tools_sources" USING btree ("_parent_id");
  CREATE INDEX "tools_meta_meta_image_idx" ON "tools" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "tools_slug_idx" ON "tools" USING btree ("slug");
  CREATE INDEX "tools_author_idx" ON "tools" USING btree ("author_id");
  CREATE INDEX "tools_updated_at_idx" ON "tools" USING btree ("updated_at");
  CREATE INDEX "tools_created_at_idx" ON "tools" USING btree ("created_at");
  CREATE INDEX "tools__status_idx" ON "tools" USING btree ("_status");
  CREATE INDEX "tools_rels_order_idx" ON "tools_rels" USING btree ("order");
  CREATE INDEX "tools_rels_parent_idx" ON "tools_rels" USING btree ("parent_id");
  CREATE INDEX "tools_rels_path_idx" ON "tools_rels" USING btree ("path");
  CREATE INDEX "tools_rels_tools_id_idx" ON "tools_rels" USING btree ("tools_id");
  CREATE INDEX "_tools_v_version_faqs_order_idx" ON "_tools_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_tools_v_version_faqs_parent_id_idx" ON "_tools_v_version_faqs" USING btree ("_parent_id");
  CREATE INDEX "_tools_v_version_sources_order_idx" ON "_tools_v_version_sources" USING btree ("_order");
  CREATE INDEX "_tools_v_version_sources_parent_id_idx" ON "_tools_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_tools_v_parent_idx" ON "_tools_v" USING btree ("parent_id");
  CREATE INDEX "_tools_v_version_meta_version_meta_image_idx" ON "_tools_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_tools_v_version_version_slug_idx" ON "_tools_v" USING btree ("version_slug");
  CREATE INDEX "_tools_v_version_version_author_idx" ON "_tools_v" USING btree ("version_author_id");
  CREATE INDEX "_tools_v_version_version_updated_at_idx" ON "_tools_v" USING btree ("version_updated_at");
  CREATE INDEX "_tools_v_version_version_created_at_idx" ON "_tools_v" USING btree ("version_created_at");
  CREATE INDEX "_tools_v_version_version__status_idx" ON "_tools_v" USING btree ("version__status");
  CREATE INDEX "_tools_v_created_at_idx" ON "_tools_v" USING btree ("created_at");
  CREATE INDEX "_tools_v_updated_at_idx" ON "_tools_v" USING btree ("updated_at");
  CREATE INDEX "_tools_v_latest_idx" ON "_tools_v" USING btree ("latest");
  CREATE INDEX "_tools_v_rels_order_idx" ON "_tools_v_rels" USING btree ("order");
  CREATE INDEX "_tools_v_rels_parent_idx" ON "_tools_v_rels" USING btree ("parent_id");
  CREATE INDEX "_tools_v_rels_path_idx" ON "_tools_v_rels" USING btree ("path");
  CREATE INDEX "_tools_v_rels_tools_id_idx" ON "_tools_v_rels" USING btree ("tools_id");
  CREATE INDEX "states_faqs_order_idx" ON "states_faqs" USING btree ("_order");
  CREATE INDEX "states_faqs_parent_id_idx" ON "states_faqs" USING btree ("_parent_id");
  CREATE INDEX "states_sources_order_idx" ON "states_sources" USING btree ("_order");
  CREATE INDEX "states_sources_parent_id_idx" ON "states_sources" USING btree ("_parent_id");
  CREATE INDEX "states_meta_meta_image_idx" ON "states" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "states_slug_idx" ON "states" USING btree ("slug");
  CREATE INDEX "states_author_idx" ON "states" USING btree ("author_id");
  CREATE INDEX "states_updated_at_idx" ON "states" USING btree ("updated_at");
  CREATE INDEX "states_created_at_idx" ON "states" USING btree ("created_at");
  CREATE INDEX "states__status_idx" ON "states" USING btree ("_status");
  CREATE INDEX "_states_v_version_faqs_order_idx" ON "_states_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_states_v_version_faqs_parent_id_idx" ON "_states_v_version_faqs" USING btree ("_parent_id");
  CREATE INDEX "_states_v_version_sources_order_idx" ON "_states_v_version_sources" USING btree ("_order");
  CREATE INDEX "_states_v_version_sources_parent_id_idx" ON "_states_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_states_v_parent_idx" ON "_states_v" USING btree ("parent_id");
  CREATE INDEX "_states_v_version_meta_version_meta_image_idx" ON "_states_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_states_v_version_version_slug_idx" ON "_states_v" USING btree ("version_slug");
  CREATE INDEX "_states_v_version_version_author_idx" ON "_states_v" USING btree ("version_author_id");
  CREATE INDEX "_states_v_version_version_updated_at_idx" ON "_states_v" USING btree ("version_updated_at");
  CREATE INDEX "_states_v_version_version_created_at_idx" ON "_states_v" USING btree ("version_created_at");
  CREATE INDEX "_states_v_version_version__status_idx" ON "_states_v" USING btree ("version__status");
  CREATE INDEX "_states_v_created_at_idx" ON "_states_v" USING btree ("created_at");
  CREATE INDEX "_states_v_updated_at_idx" ON "_states_v" USING btree ("updated_at");
  CREATE INDEX "_states_v_latest_idx" ON "_states_v" USING btree ("latest");
  CREATE INDEX "state_pages_faqs_order_idx" ON "state_pages_faqs" USING btree ("_order");
  CREATE INDEX "state_pages_faqs_parent_id_idx" ON "state_pages_faqs" USING btree ("_parent_id");
  CREATE INDEX "state_pages_sources_order_idx" ON "state_pages_sources" USING btree ("_order");
  CREATE INDEX "state_pages_sources_parent_id_idx" ON "state_pages_sources" USING btree ("_parent_id");
  CREATE INDEX "state_pages_tool_idx" ON "state_pages" USING btree ("tool_id");
  CREATE INDEX "state_pages_state_idx" ON "state_pages" USING btree ("state_id");
  CREATE INDEX "state_pages_meta_meta_image_idx" ON "state_pages" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "state_pages_path_idx" ON "state_pages" USING btree ("path");
  CREATE INDEX "state_pages_author_idx" ON "state_pages" USING btree ("author_id");
  CREATE INDEX "state_pages_updated_at_idx" ON "state_pages" USING btree ("updated_at");
  CREATE INDEX "state_pages_created_at_idx" ON "state_pages" USING btree ("created_at");
  CREATE INDEX "state_pages__status_idx" ON "state_pages" USING btree ("_status");
  CREATE INDEX "_state_pages_v_version_faqs_order_idx" ON "_state_pages_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_state_pages_v_version_faqs_parent_id_idx" ON "_state_pages_v_version_faqs" USING btree ("_parent_id");
  CREATE INDEX "_state_pages_v_version_sources_order_idx" ON "_state_pages_v_version_sources" USING btree ("_order");
  CREATE INDEX "_state_pages_v_version_sources_parent_id_idx" ON "_state_pages_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_state_pages_v_parent_idx" ON "_state_pages_v" USING btree ("parent_id");
  CREATE INDEX "_state_pages_v_version_version_tool_idx" ON "_state_pages_v" USING btree ("version_tool_id");
  CREATE INDEX "_state_pages_v_version_version_state_idx" ON "_state_pages_v" USING btree ("version_state_id");
  CREATE INDEX "_state_pages_v_version_meta_version_meta_image_idx" ON "_state_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_state_pages_v_version_version_path_idx" ON "_state_pages_v" USING btree ("version_path");
  CREATE INDEX "_state_pages_v_version_version_author_idx" ON "_state_pages_v" USING btree ("version_author_id");
  CREATE INDEX "_state_pages_v_version_version_updated_at_idx" ON "_state_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_state_pages_v_version_version_created_at_idx" ON "_state_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_state_pages_v_version_version__status_idx" ON "_state_pages_v" USING btree ("version__status");
  CREATE INDEX "_state_pages_v_created_at_idx" ON "_state_pages_v" USING btree ("created_at");
  CREATE INDEX "_state_pages_v_updated_at_idx" ON "_state_pages_v" USING btree ("updated_at");
  CREATE INDEX "_state_pages_v_latest_idx" ON "_state_pages_v" USING btree ("latest");
  CREATE INDEX "lawyers_practice_areas_order_idx" ON "lawyers_practice_areas" USING btree ("order");
  CREATE INDEX "lawyers_practice_areas_parent_idx" ON "lawyers_practice_areas" USING btree ("parent_id");
  CREATE INDEX "lawyers_state_idx" ON "lawyers" USING btree ("state_id");
  CREATE INDEX "lawyers_meta_meta_image_idx" ON "lawyers" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "lawyers_slug_idx" ON "lawyers" USING btree ("slug");
  CREATE INDEX "lawyers_updated_at_idx" ON "lawyers" USING btree ("updated_at");
  CREATE INDEX "lawyers_created_at_idx" ON "lawyers" USING btree ("created_at");
  CREATE INDEX "lawyers__status_idx" ON "lawyers" USING btree ("_status");
  CREATE INDEX "lawyers_texts_order_parent" ON "lawyers_texts" USING btree ("order","parent_id");
  CREATE INDEX "_lawyers_v_version_practice_areas_order_idx" ON "_lawyers_v_version_practice_areas" USING btree ("order");
  CREATE INDEX "_lawyers_v_version_practice_areas_parent_idx" ON "_lawyers_v_version_practice_areas" USING btree ("parent_id");
  CREATE INDEX "_lawyers_v_parent_idx" ON "_lawyers_v" USING btree ("parent_id");
  CREATE INDEX "_lawyers_v_version_version_state_idx" ON "_lawyers_v" USING btree ("version_state_id");
  CREATE INDEX "_lawyers_v_version_meta_version_meta_image_idx" ON "_lawyers_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_lawyers_v_version_version_slug_idx" ON "_lawyers_v" USING btree ("version_slug");
  CREATE INDEX "_lawyers_v_version_version_updated_at_idx" ON "_lawyers_v" USING btree ("version_updated_at");
  CREATE INDEX "_lawyers_v_version_version_created_at_idx" ON "_lawyers_v" USING btree ("version_created_at");
  CREATE INDEX "_lawyers_v_version_version__status_idx" ON "_lawyers_v" USING btree ("version__status");
  CREATE INDEX "_lawyers_v_created_at_idx" ON "_lawyers_v" USING btree ("created_at");
  CREATE INDEX "_lawyers_v_updated_at_idx" ON "_lawyers_v" USING btree ("updated_at");
  CREATE INDEX "_lawyers_v_latest_idx" ON "_lawyers_v" USING btree ("latest");
  CREATE INDEX "_lawyers_v_texts_order_parent" ON "_lawyers_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "settlements_sources_order_idx" ON "settlements_sources" USING btree ("_order");
  CREATE INDEX "settlements_sources_parent_id_idx" ON "settlements_sources" USING btree ("_parent_id");
  CREATE INDEX "settlements_meta_meta_image_idx" ON "settlements" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "settlements_slug_idx" ON "settlements" USING btree ("slug");
  CREATE INDEX "settlements_updated_at_idx" ON "settlements" USING btree ("updated_at");
  CREATE INDEX "settlements_created_at_idx" ON "settlements" USING btree ("created_at");
  CREATE INDEX "settlements__status_idx" ON "settlements" USING btree ("_status");
  CREATE INDEX "_settlements_v_version_sources_order_idx" ON "_settlements_v_version_sources" USING btree ("_order");
  CREATE INDEX "_settlements_v_version_sources_parent_id_idx" ON "_settlements_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_settlements_v_parent_idx" ON "_settlements_v" USING btree ("parent_id");
  CREATE INDEX "_settlements_v_version_meta_version_meta_image_idx" ON "_settlements_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_settlements_v_version_version_slug_idx" ON "_settlements_v" USING btree ("version_slug");
  CREATE INDEX "_settlements_v_version_version_updated_at_idx" ON "_settlements_v" USING btree ("version_updated_at");
  CREATE INDEX "_settlements_v_version_version_created_at_idx" ON "_settlements_v" USING btree ("version_created_at");
  CREATE INDEX "_settlements_v_version_version__status_idx" ON "_settlements_v" USING btree ("version__status");
  CREATE INDEX "_settlements_v_created_at_idx" ON "_settlements_v" USING btree ("created_at");
  CREATE INDEX "_settlements_v_updated_at_idx" ON "_settlements_v" USING btree ("updated_at");
  CREATE INDEX "_settlements_v_latest_idx" ON "_settlements_v" USING btree ("latest");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_wide_sizes_wide_filename_idx" ON "media" USING btree ("sizes_wide_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX "categories_breadcrumbs_order_idx" ON "categories_breadcrumbs" USING btree ("_order");
  CREATE INDEX "categories_breadcrumbs_parent_id_idx" ON "categories_breadcrumbs" USING btree ("_parent_id");
  CREATE INDEX "categories_breadcrumbs_doc_idx" ON "categories_breadcrumbs" USING btree ("doc_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "users_links_order_idx" ON "users_links" USING btree ("_order");
  CREATE INDEX "users_links_parent_id_idx" ON "users_links" USING btree ("_parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "users_slug_idx" ON "users" USING btree ("slug");
  CREATE INDEX "users_photo_idx" ON "users" USING btree ("photo_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX "redirects_rels_order_idx" ON "redirects_rels" USING btree ("order");
  CREATE INDEX "redirects_rels_parent_idx" ON "redirects_rels" USING btree ("parent_id");
  CREATE INDEX "redirects_rels_path_idx" ON "redirects_rels" USING btree ("path");
  CREATE INDEX "redirects_rels_pages_id_idx" ON "redirects_rels" USING btree ("pages_id");
  CREATE INDEX "redirects_rels_posts_id_idx" ON "redirects_rels" USING btree ("posts_id");
  CREATE INDEX "redirects_rels_tools_id_idx" ON "redirects_rels" USING btree ("tools_id");
  CREATE INDEX "redirects_rels_states_id_idx" ON "redirects_rels" USING btree ("states_id");
  CREATE INDEX "redirects_rels_state_pages_id_idx" ON "redirects_rels" USING btree ("state_pages_id");
  CREATE INDEX "redirects_rels_lawyers_id_idx" ON "redirects_rels" USING btree ("lawyers_id");
  CREATE INDEX "search_categories_order_idx" ON "search_categories" USING btree ("_order");
  CREATE INDEX "search_categories_parent_id_idx" ON "search_categories" USING btree ("_parent_id");
  CREATE INDEX "search_slug_idx" ON "search" USING btree ("slug");
  CREATE INDEX "search_meta_meta_image_idx" ON "search" USING btree ("meta_image_id");
  CREATE INDEX "search_updated_at_idx" ON "search" USING btree ("updated_at");
  CREATE INDEX "search_created_at_idx" ON "search" USING btree ("created_at");
  CREATE INDEX "search_rels_order_idx" ON "search_rels" USING btree ("order");
  CREATE INDEX "search_rels_parent_idx" ON "search_rels" USING btree ("parent_id");
  CREATE INDEX "search_rels_path_idx" ON "search_rels" USING btree ("path");
  CREATE INDEX "search_rels_posts_id_idx" ON "search_rels" USING btree ("posts_id");
  CREATE INDEX "search_rels_tools_id_idx" ON "search_rels" USING btree ("tools_id");
  CREATE INDEX "search_rels_states_id_idx" ON "search_rels" USING btree ("states_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_folders_folder_type_order_idx" ON "payload_folders_folder_type" USING btree ("order");
  CREATE INDEX "payload_folders_folder_type_parent_idx" ON "payload_folders_folder_type" USING btree ("parent_id");
  CREATE INDEX "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
  CREATE INDEX "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
  CREATE INDEX "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_tools_id_idx" ON "payload_locked_documents_rels" USING btree ("tools_id");
  CREATE INDEX "payload_locked_documents_rels_states_id_idx" ON "payload_locked_documents_rels" USING btree ("states_id");
  CREATE INDEX "payload_locked_documents_rels_state_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("state_pages_id");
  CREATE INDEX "payload_locked_documents_rels_lawyers_id_idx" ON "payload_locked_documents_rels" USING btree ("lawyers_id");
  CREATE INDEX "payload_locked_documents_rels_settlements_id_idx" ON "payload_locked_documents_rels" USING btree ("settlements_id");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_locked_documents_rels_search_id_idx" ON "payload_locked_documents_rels" USING btree ("search_id");
  CREATE INDEX "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "header_nav_items_order_idx" ON "header_nav_items" USING btree ("_order");
  CREATE INDEX "header_nav_items_parent_id_idx" ON "header_nav_items" USING btree ("_parent_id");
  CREATE INDEX "header_rels_order_idx" ON "header_rels" USING btree ("order");
  CREATE INDEX "header_rels_parent_idx" ON "header_rels" USING btree ("parent_id");
  CREATE INDEX "header_rels_path_idx" ON "header_rels" USING btree ("path");
  CREATE INDEX "header_rels_pages_id_idx" ON "header_rels" USING btree ("pages_id");
  CREATE INDEX "header_rels_posts_id_idx" ON "header_rels" USING btree ("posts_id");
  CREATE INDEX "header_rels_tools_id_idx" ON "header_rels" USING btree ("tools_id");
  CREATE INDEX "header_rels_states_id_idx" ON "header_rels" USING btree ("states_id");
  CREATE INDEX "footer_nav_items_order_idx" ON "footer_nav_items" USING btree ("_order");
  CREATE INDEX "footer_nav_items_parent_id_idx" ON "footer_nav_items" USING btree ("_parent_id");
  CREATE INDEX "footer_rels_order_idx" ON "footer_rels" USING btree ("order");
  CREATE INDEX "footer_rels_parent_idx" ON "footer_rels" USING btree ("parent_id");
  CREATE INDEX "footer_rels_path_idx" ON "footer_rels" USING btree ("path");
  CREATE INDEX "footer_rels_pages_id_idx" ON "footer_rels" USING btree ("pages_id");
  CREATE INDEX "footer_rels_posts_id_idx" ON "footer_rels" USING btree ("posts_id");
  CREATE INDEX "footer_rels_tools_id_idx" ON "footer_rels" USING btree ("tools_id");
  CREATE INDEX "footer_rels_states_id_idx" ON "footer_rels" USING btree ("states_id");
  CREATE INDEX "site_settings_same_as_order_idx" ON "site_settings_same_as" USING btree ("_order");
  CREATE INDEX "site_settings_same_as_parent_id_idx" ON "site_settings_same_as" USING btree ("_parent_id");
  CREATE INDEX "site_settings_org_logo_idx" ON "site_settings" USING btree ("org_logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_faqs" CASCADE;
  DROP TABLE "pages_sources" CASCADE;
  DROP TABLE "pages_breadcrumbs" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "_pages_v_version_faqs" CASCADE;
  DROP TABLE "_pages_v_version_sources" CASCADE;
  DROP TABLE "_pages_v_version_breadcrumbs" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "posts_faqs" CASCADE;
  DROP TABLE "posts_sources" CASCADE;
  DROP TABLE "posts_populated_authors" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TABLE "_posts_v_version_faqs" CASCADE;
  DROP TABLE "_posts_v_version_sources" CASCADE;
  DROP TABLE "_posts_v_version_populated_authors" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "_posts_v_rels" CASCADE;
  DROP TABLE "tools_faqs" CASCADE;
  DROP TABLE "tools_sources" CASCADE;
  DROP TABLE "tools" CASCADE;
  DROP TABLE "tools_rels" CASCADE;
  DROP TABLE "_tools_v_version_faqs" CASCADE;
  DROP TABLE "_tools_v_version_sources" CASCADE;
  DROP TABLE "_tools_v" CASCADE;
  DROP TABLE "_tools_v_rels" CASCADE;
  DROP TABLE "states_faqs" CASCADE;
  DROP TABLE "states_sources" CASCADE;
  DROP TABLE "states" CASCADE;
  DROP TABLE "_states_v_version_faqs" CASCADE;
  DROP TABLE "_states_v_version_sources" CASCADE;
  DROP TABLE "_states_v" CASCADE;
  DROP TABLE "state_pages_faqs" CASCADE;
  DROP TABLE "state_pages_sources" CASCADE;
  DROP TABLE "state_pages" CASCADE;
  DROP TABLE "_state_pages_v_version_faqs" CASCADE;
  DROP TABLE "_state_pages_v_version_sources" CASCADE;
  DROP TABLE "_state_pages_v" CASCADE;
  DROP TABLE "lawyers_practice_areas" CASCADE;
  DROP TABLE "lawyers" CASCADE;
  DROP TABLE "lawyers_texts" CASCADE;
  DROP TABLE "_lawyers_v_version_practice_areas" CASCADE;
  DROP TABLE "_lawyers_v" CASCADE;
  DROP TABLE "_lawyers_v_texts" CASCADE;
  DROP TABLE "settlements_sources" CASCADE;
  DROP TABLE "settlements" CASCADE;
  DROP TABLE "_settlements_v_version_sources" CASCADE;
  DROP TABLE "_settlements_v" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "categories_breadcrumbs" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "users_links" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "redirects" CASCADE;
  DROP TABLE "redirects_rels" CASCADE;
  DROP TABLE "search_categories" CASCADE;
  DROP TABLE "search" CASCADE;
  DROP TABLE "search_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_folders_folder_type" CASCADE;
  DROP TABLE "payload_folders" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "header_nav_items" CASCADE;
  DROP TABLE "header" CASCADE;
  DROP TABLE "header_rels" CASCADE;
  DROP TABLE "footer_nav_items" CASCADE;
  DROP TABLE "footer" CASCADE;
  DROP TABLE "footer_rels" CASCADE;
  DROP TABLE "site_settings_same_as" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TYPE "public"."enum_pages_template";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_template";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum_tools_category";
  DROP TYPE "public"."enum_tools_status";
  DROP TYPE "public"."enum__tools_v_version_category";
  DROP TYPE "public"."enum__tools_v_version_status";
  DROP TYPE "public"."enum_states_status";
  DROP TYPE "public"."enum__states_v_version_status";
  DROP TYPE "public"."enum_state_pages_status";
  DROP TYPE "public"."enum__state_pages_v_version_status";
  DROP TYPE "public"."enum_lawyers_practice_areas";
  DROP TYPE "public"."enum_lawyers_verified";
  DROP TYPE "public"."enum_lawyers_source";
  DROP TYPE "public"."enum_lawyers_indexing";
  DROP TYPE "public"."enum_lawyers_status";
  DROP TYPE "public"."enum__lawyers_v_version_practice_areas";
  DROP TYPE "public"."enum__lawyers_v_version_verified";
  DROP TYPE "public"."enum__lawyers_v_version_source";
  DROP TYPE "public"."enum__lawyers_v_version_indexing";
  DROP TYPE "public"."enum__lawyers_v_version_status";
  DROP TYPE "public"."enum_settlements_claim_status";
  DROP TYPE "public"."enum_settlements_status";
  DROP TYPE "public"."enum__settlements_v_version_status";
  DROP TYPE "public"."enum_leads_kind";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_redirects_to_type";
  DROP TYPE "public"."enum_redirects_type";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_payload_folders_folder_type";
  DROP TYPE "public"."enum_header_nav_items_link_type";
  DROP TYPE "public"."enum_footer_nav_items_link_type";`)
}
