-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE');

-- CreateEnum
CREATE TYPE "IssuePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "IssueType" AS ENUM ('TASK', 'BUG', 'FEATURE');

-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('PLANNED', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "CaseStage" AS ENUM ('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "owner_id" TEXT,
    "account_id" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "epic_id" TEXT,
    "reporter_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'TO_DO',
    "priority" "IssuePriority" NOT NULL DEFAULT 'MEDIUM',
    "type" "IssueType" NOT NULL DEFAULT 'TASK',
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epics" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANNED',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_sprint" (
    "id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "sprint_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issue_sprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_assignees" (
    "id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issue_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "owner_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "account_id" TEXT,
    "owner_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "account_id" TEXT,
    "contact_id" TEXT,
    "owner_id" TEXT,
    "issue_id" TEXT,
    "project_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stage" "CaseStage" NOT NULL DEFAULT 'LEAD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_key_key" ON "projects"("key");

-- CreateIndex
CREATE INDEX "projects_owner_id_idx" ON "projects"("owner_id");

-- CreateIndex
CREATE INDEX "projects_account_id_idx" ON "projects"("account_id");

-- CreateIndex
CREATE INDEX "project_members_project_id_idx" ON "project_members"("project_id");

-- CreateIndex
CREATE INDEX "project_members_user_id_idx" ON "project_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_project_id_user_id_key" ON "project_members"("project_id", "user_id");

-- CreateIndex
CREATE INDEX "issues_project_id_idx" ON "issues"("project_id");

-- CreateIndex
CREATE INDEX "issues_epic_id_idx" ON "issues"("epic_id");

-- CreateIndex
CREATE INDEX "issues_reporter_id_idx" ON "issues"("reporter_id");

-- CreateIndex
CREATE INDEX "issues_status_idx" ON "issues"("status");

-- CreateIndex
CREATE INDEX "issues_priority_idx" ON "issues"("priority");

-- CreateIndex
CREATE INDEX "epics_project_id_idx" ON "epics"("project_id");

-- CreateIndex
CREATE INDEX "sprints_project_id_idx" ON "sprints"("project_id");

-- CreateIndex
CREATE INDEX "sprints_status_idx" ON "sprints"("status");

-- CreateIndex
CREATE INDEX "issue_sprint_issue_id_idx" ON "issue_sprint"("issue_id");

-- CreateIndex
CREATE INDEX "issue_sprint_sprint_id_idx" ON "issue_sprint"("sprint_id");

-- CreateIndex
CREATE UNIQUE INDEX "issue_sprint_issue_id_sprint_id_key" ON "issue_sprint"("issue_id", "sprint_id");

-- CreateIndex
CREATE INDEX "issue_assignees_issue_id_idx" ON "issue_assignees"("issue_id");

-- CreateIndex
CREATE INDEX "issue_assignees_user_id_idx" ON "issue_assignees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "issue_assignees_issue_id_user_id_key" ON "issue_assignees"("issue_id", "user_id");

-- CreateIndex
CREATE INDEX "accounts_owner_id_idx" ON "accounts"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_name_key" ON "accounts"("name");

-- CreateIndex
CREATE INDEX "contacts_account_id_idx" ON "contacts"("account_id");

-- CreateIndex
CREATE INDEX "contacts_owner_id_idx" ON "contacts"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_email_key" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "cases_account_id_idx" ON "cases"("account_id");

-- CreateIndex
CREATE INDEX "cases_contact_id_idx" ON "cases"("contact_id");

-- CreateIndex
CREATE INDEX "cases_owner_id_idx" ON "cases"("owner_id");

-- CreateIndex
CREATE INDEX "cases_stage_idx" ON "cases"("stage");

-- CreateIndex
CREATE INDEX "cases_issue_id_idx" ON "cases"("issue_id");

-- CreateIndex
CREATE INDEX "cases_project_id_idx" ON "cases"("project_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_epic_id_fkey" FOREIGN KEY ("epic_id") REFERENCES "epics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epics" ADD CONSTRAINT "epics_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_sprint" ADD CONSTRAINT "issue_sprint_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_sprint" ADD CONSTRAINT "issue_sprint_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_assignees" ADD CONSTRAINT "issue_assignees_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_assignees" ADD CONSTRAINT "issue_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
