import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@local.test";
  const adminPlain = process.env.SEED_ADMIN_PASSWORD ?? "creari_company_crm";
  const adminHash = await bcrypt.hash(adminPlain, 10);

  const defaultUserPlain = process.env.SEED_USER_PASSWORD ?? "crm_demo_user";
  const defaultUserHash = await bcrypt.hash(defaultUserPlain, 10);

  const admin = await prisma.users.upsert({
    where: { email: adminEmail },
    update: { password_hash: adminHash, role: "admin", name: "Admin", is_active: true },
    create: { email: adminEmail, password_hash: adminHash, role: "admin", name: "Admin", is_active: true }
  });

  const manager = await prisma.users.upsert({
    where: { email: "manager@local.test" },
    update: { password_hash: defaultUserHash, role: "manager", name: "Manager User", is_active: true },
    create: { email: "manager@local.test", password_hash: defaultUserHash, role: "manager", name: "Manager User", is_active: true }
  });

  const member = await prisma.users.upsert({
    where: { email: "member@local.test" },
    update: { password_hash: defaultUserHash, role: "member", name: "Member User", is_active: true },
    create: { email: "member@local.test", password_hash: defaultUserHash, role: "member", name: "Member User", is_active: true }
  });

  const viewer = await prisma.users.upsert({
    where: { email: "viewer@local.test" },
    update: { password_hash: defaultUserHash, role: "viewer", name: "Viewer User", is_active: true },
    create: { email: "viewer@local.test", password_hash: defaultUserHash, role: "viewer", name: "Viewer User", is_active: true }
  });

  const account = await prisma.accounts.upsert({
    where: { id: "seed-account" },
    update: {
      name: "Acme Corporation",
      industry: "Software",
      website: "https://acme.example.com",
      phone: "+1-555-0100",
      owner_id: admin.id
    },
    create: {
      id: "seed-account",
      name: "Acme Corporation",
      industry: "Software",
      website: "https://acme.example.com",
      phone: "+1-555-0100",
      owner_id: admin.id
    }
  });

  const contact = await prisma.contacts.upsert({
    where: { id: "seed-contact" },
    update: {
      account_id: account.id,
      owner_id: manager.id,
      first_name: "Jane",
      last_name: "Doe",
      email: "jane.doe@acme.test",
      phone: "+1-555-0101"
    },
    create: {
      id: "seed-contact",
      account_id: account.id,
      owner_id: manager.id,
      first_name: "Jane",
      last_name: "Doe",
      email: "jane.doe@acme.test",
      phone: "+1-555-0101"
    }
  });

  const project = await prisma.projects.upsert({
    where: { id: "seed-project" },
    update: {
      name: "CRM Platform Revamp",
      key: "CRMREV",
      description: "Foundational project to enhance the CRM experience.",
      owner_id: admin.id,
      account_id: account.id,
      start_date: new Date("2025-01-01"),
      end_date: new Date("2025-03-31")
    },
    create: {
      id: "seed-project",
      name: "CRM Platform Revamp",
      key: "CRMREV",
      description: "Foundational project to enhance the CRM experience.",
      owner_id: admin.id,
      account_id: account.id,
      start_date: new Date("2025-01-01"),
      end_date: new Date("2025-03-31")
    }
  });

  const epicFoundation = await prisma.epics.upsert({
    where: { id: "seed-epic-foundation" },
    update: {
      project_id: project.id,
      name: "Foundation Setup",
      description: "Core platform and authentication baseline."
    },
    create: {
      id: "seed-epic-foundation",
      project_id: project.id,
      name: "Foundation Setup",
      description: "Core platform and authentication baseline."
    }
  });

  const epicExpansion = await prisma.epics.upsert({
    where: { id: "seed-epic-expansion" },
    update: {
      project_id: project.id,
      name: "Expansion Initiatives",
      description: "Enhancements to extend CRM value."
    },
    create: {
      id: "seed-epic-expansion",
      project_id: project.id,
      name: "Expansion Initiatives",
      description: "Enhancements to extend CRM value."
    }
  });

  await prisma.project_members.upsert({
    where: { id: "seed-pm-admin" },
    update: { role: "owner", project_id: project.id, user_id: admin.id },
    create: { id: "seed-pm-admin", project_id: project.id, user_id: admin.id, role: "owner" }
  });

  await prisma.project_members.upsert({
    where: { id: "seed-pm-manager" },
    update: { role: "manager", project_id: project.id, user_id: manager.id },
    create: { id: "seed-pm-manager", project_id: project.id, user_id: manager.id, role: "manager" }
  });

  await prisma.project_members.upsert({
    where: { id: "seed-pm-member" },
    update: { role: "member", project_id: project.id, user_id: member.id },
    create: { id: "seed-pm-member", project_id: project.id, user_id: member.id, role: "member" }
  });

  await prisma.project_members.upsert({
    where: { id: "seed-pm-viewer" },
    update: { role: "viewer", project_id: project.id, user_id: viewer.id },
    create: { id: "seed-pm-viewer", project_id: project.id, user_id: viewer.id, role: "viewer" }
  });

  const sprint = await prisma.sprints.upsert({
    where: { id: "seed-sprint" },
    update: {
      project_id: project.id,
      name: "Sprint 1",
      goal: "Deliver onboarding flow and analytics baseline.",
      status: "ACTIVE",
      start_date: new Date("2025-01-06"),
      end_date: new Date("2025-01-24")
    },
    create: {
      id: "seed-sprint",
      project_id: project.id,
      name: "Sprint 1",
      goal: "Deliver onboarding flow and analytics baseline.",
      status: "ACTIVE",
      start_date: new Date("2025-01-06"),
      end_date: new Date("2025-01-24")
    }
  });

  const issueTodo = await prisma.issues.upsert({
    where: { id: "seed-issue-todo" },
    update: {
      project_id: project.id,
      epic_id: epicFoundation.id,
      reporter_id: admin.id,
      title: "Implement authentication flow",
      description: "Set up credential-based auth with session handoff.",
      status: "TO_DO",
      priority: "HIGH",
      type: "FEATURE",
      due_date: new Date("2025-01-15")
    },
    create: {
      id: "seed-issue-todo",
      project_id: project.id,
      epic_id: epicFoundation.id,
      reporter_id: admin.id,
      title: "Implement authentication flow",
      description: "Set up credential-based auth with session handoff.",
      status: "TO_DO",
      priority: "HIGH",
      type: "FEATURE",
      due_date: new Date("2025-01-15")
    }
  });

  const issueInProgress = await prisma.issues.upsert({
    where: { id: "seed-issue-progress" },
    update: {
      project_id: project.id,
      epic_id: epicExpansion.id,
      reporter_id: manager.id,
      title: "Integrate analytics dashboard",
      description: "Embed KPI widgets for active accounts.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      type: "TASK",
      due_date: new Date("2025-01-20")
    },
    create: {
      id: "seed-issue-progress",
      project_id: project.id,
      epic_id: epicExpansion.id,
      reporter_id: manager.id,
      title: "Integrate analytics dashboard",
      description: "Embed KPI widgets for active accounts.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      type: "TASK",
      due_date: new Date("2025-01-20")
    }
  });

  const issueDone = await prisma.issues.upsert({
    where: { id: "seed-issue-done" },
    update: {
      project_id: project.id,
      epic_id: epicFoundation.id,
      reporter_id: member.id,
      title: "Fix lead import bug",
      description: "Resolve CSV parsing issue for bulk imports.",
      status: "DONE",
      priority: "URGENT",
      type: "BUG",
      due_date: new Date("2024-12-20")
    },
    create: {
      id: "seed-issue-done",
      project_id: project.id,
      epic_id: epicFoundation.id,
      reporter_id: member.id,
      title: "Fix lead import bug",
      description: "Resolve CSV parsing issue for bulk imports.",
      status: "DONE",
      priority: "URGENT",
      type: "BUG",
      due_date: new Date("2024-12-20")
    }
  });

  await prisma.issue_assignees.upsert({
    where: { id: "seed-ia-1" },
    update: { issue_id: issueTodo.id, user_id: manager.id },
    create: { id: "seed-ia-1", issue_id: issueTodo.id, user_id: manager.id }
  });

  await prisma.issue_assignees.upsert({
    where: { id: "seed-ia-2" },
    update: { issue_id: issueInProgress.id, user_id: member.id },
    create: { id: "seed-ia-2", issue_id: issueInProgress.id, user_id: member.id }
  });

  await prisma.issue_assignees.upsert({
    where: { id: "seed-ia-3" },
    update: { issue_id: issueDone.id, user_id: admin.id },
    create: { id: "seed-ia-3", issue_id: issueDone.id, user_id: admin.id }
  });

  await prisma.issue_sprint.upsert({
    where: { id: "seed-is-1" },
    update: { issue_id: issueTodo.id, sprint_id: sprint.id },
    create: { id: "seed-is-1", issue_id: issueTodo.id, sprint_id: sprint.id }
  });

  await prisma.issue_sprint.upsert({
    where: { id: "seed-is-2" },
    update: { issue_id: issueInProgress.id, sprint_id: sprint.id },
    create: { id: "seed-is-2", issue_id: issueInProgress.id, sprint_id: sprint.id }
  });

  await prisma.issue_sprint.upsert({
    where: { id: "seed-is-3" },
    update: { issue_id: issueDone.id, sprint_id: sprint.id },
    create: { id: "seed-is-3", issue_id: issueDone.id, sprint_id: sprint.id }
  });

  await prisma.cases.upsert({
    where: { id: "seed-case" },
    update: {
      title: "Rollout onboarding playbook",
      description: "Drive adoption for enterprise pilot.",
      account_id: account.id,
      contact_id: contact.id,
      owner_id: manager.id,
      issue_id: issueTodo.id,
      stage: "QUALIFIED"
    },
    create: {
      id: "seed-case",
      title: "Rollout onboarding playbook",
      description: "Drive adoption for enterprise pilot.",
      account_id: account.id,
      contact_id: contact.id,
      owner_id: manager.id,
      issue_id: issueTodo.id,
      stage: "QUALIFIED"
    }
  });

  console.log(`Seeded core data. Admin: ${adminEmail}`);
}

main().finally(() => prisma.$disconnect());
