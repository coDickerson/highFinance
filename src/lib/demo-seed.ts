import { PrismaClient, Role, DuesStatus, Semester } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const OFFICER_POSITIONS = [
  { id: "dept-social",       name: "Psi (Social)",    description: "Social events & exchanges",   icon: "celebration",       colorHex: "#7B2D8B" },
  { id: "dept-brotherhood",  name: "Brotherhood",     description: "Brotherhood activities",       icon: "people",            colorHex: "#1565C0" },
  { id: "dept-rush",         name: "Rush",            description: "Recruitment & rush events",    icon: "directions_run",    colorHex: "#E65100" },
  { id: "dept-housing",      name: "Housing",         description: "House maintenance & supplies", icon: "home",              colorHex: "#2E7D32" },
  { id: "dept-kitchen",      name: "Kitchen",         description: "Kitchen & dining supplies",    icon: "restaurant",        colorHex: "#C62828" },
  { id: "dept-iota",         name: "Iota",            description: "Iota committee activities",    icon: "star",              colorHex: "#F57F17" },
  { id: "dept-risk",         name: "Risk",            description: "Risk management",              icon: "warning",           colorHex: "#AD1457" },
  { id: "dept-sustain",      name: "Sustainability",  description: "Sustainability initiatives",   icon: "eco",               colorHex: "#00695C" },
  { id: "dept-misc",         name: "Misc",            description: "Miscellaneous expenses",       icon: "more_horiz",        colorHex: "#546E7A" },
  { id: "dept-emergency",    name: "Emergency",       description: "Emergency reserve fund",       icon: "emergency",         colorHex: "#B71C1C" },
  { id: "dept-philo",        name: "Philo",           description: "Philanthropy & service",       icon: "volunteer_activism",colorHex: "#6A1B9A" },
  { id: "dept-president",    name: "President",       description: "Presidential discretionary",   icon: "account_balance",   colorHex: "#004D40" },
  { id: "dept-retreat",      name: "Retreat/Formal",  description: "Retreat & formal events",      icon: "event",             colorHex: "#1A237E" },
  { id: "dept-im",           name: "IM",              description: "Intramural sports",            icon: "sports",            colorHex: "#33691E" },
] as const;

const BUDGET_AMOUNTS: Record<string, number> = {
  "dept-social": 3000, "dept-brotherhood": 2000, "dept-rush": 5000, "dept-housing": 8000,
  "dept-kitchen": 4000, "dept-iota": 1500, "dept-risk": 1000, "dept-sustain": 800,
  "dept-misc": 500, "dept-emergency": 5000, "dept-philo": 1200, "dept-president": 2000,
  "dept-retreat": 4000, "dept-im": 600,
};

const OFFICER_SEEDS = [
  { dept: "dept-social",      email: "social@highfinance.test",        name: "Social Chair" },
  { dept: "dept-brotherhood", email: "brotherhood@highfinance.test",   name: "Brotherhood Chair" },
  { dept: "dept-rush",        email: "rush@highfinance.test",          name: "Rush Chair" },
  { dept: "dept-housing",     email: "housing@highfinance.test",       name: "Housing Chair" },
  { dept: "dept-kitchen",     email: "kitchen@highfinance.test",       name: "Kitchen Chair" },
  { dept: "dept-iota",        email: "iota@highfinance.test",          name: "Iota Chair" },
  { dept: "dept-risk",        email: "risk@highfinance.test",          name: "Risk Chair" },
  { dept: "dept-sustain",     email: "sustainability@highfinance.test", name: "Sustainability Chair" },
  { dept: "dept-misc",        email: "misc@highfinance.test",          name: "Misc Chair" },
  { dept: "dept-emergency",   email: "emergency@highfinance.test",     name: "Emergency Chair" },
  { dept: "dept-philo",       email: "philo@highfinance.test",         name: "Philanthropy Chair" },
  { dept: "dept-president",   email: "president@highfinance.test",     name: "President" },
  { dept: "dept-retreat",     email: "retreat@highfinance.test",       name: "Retreat/Formal Chair" },
  { dept: "dept-im",          email: "im@highfinance.test",            name: "IM Chair" },
];

const MEMBERS = [
  { id: "mem-1", name: "Alex Johnson",   email: "alex.j@test.com",   phone: "415-555-0101", tier: "FA24", duesStatus: DuesStatus.paid,    lastPayment: new Date("2025-08-15"), duesOwed: 150, duesPaid: 150 },
  { id: "mem-2", name: "Marco Rivera",   email: "marco.r@test.com",  phone: "415-555-0202", tier: "FA24", duesStatus: DuesStatus.paid,    lastPayment: new Date("2025-08-15"), duesOwed: 150, duesPaid: 150 },
  { id: "mem-3", name: "Tyler Chen",     email: "tyler.c@test.com",  phone: "415-555-0303", tier: "SP25", duesStatus: DuesStatus.overdue, lastPayment: new Date("2025-01-10"), duesOwed: 150, duesPaid:  75 },
  { id: "mem-4", name: "Jordan Park",    email: "jordan.p@test.com", phone: "415-555-0404", tier: "SP25", duesStatus: DuesStatus.paid,    lastPayment: new Date("2025-08-15"), duesOwed: 150, duesPaid: 150 },
  { id: "mem-5", name: "Ethan Williams", email: "ethan.w@test.com",  phone: "415-555-0505", tier: "FA25", duesStatus: DuesStatus.overdue, lastPayment: null,                  duesOwed: 150, duesPaid:   0 },
  { id: "mem-6", name: "Liam Torres",    email: "liam.t@test.com",   phone: "415-555-0606", tier: "FA25", duesStatus: DuesStatus.exempt,  lastPayment: null,                  duesOwed:   0, duesPaid:   0 },
];

/** Wipe and reseed all app tables with the demo dataset. Used by the CLI seed and the nightly reset. */
export async function reseedDemo(prisma: PrismaClient): Promise<void> {
  const HASH = (pw: string) => bcrypt.hash(pw, 10);

  // Clear in dependency order.
  await prisma.receipt.deleteMany();
  await prisma.reimbursementRequest.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.userDepartment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.signupRequest.deleteMany();
  await prisma.department.deleteMany();
  await prisma.income.deleteMany();
  await prisma.member.deleteMany();
  await prisma.feeItem.deleteMany();
  await prisma.feeCategory.deleteMany();
  await prisma.feeBudget.deleteMany();

  const depts: Record<string, { id: string }> = {};
  for (const pos of OFFICER_POSITIONS) {
    depts[pos.id] = await prisma.department.create({ data: pos });
  }

  const admin = await prisma.user.create({
    data: { name: "Treasurer (Admin)", email: "admin@highfinance.test", passwordHash: await HASH("Admin1234"), role: Role.admin },
  });
  await prisma.user.create({
    data: { name: "President (Exec)", email: "exec@highfinance.test", passwordHash: await HASH("Exec1234"), role: Role.executive },
  });

  const officers: Record<string, { id: string }> = {};
  for (const o of OFFICER_SEEDS) {
    const officer = await prisma.user.create({
      data: { name: o.name, email: o.email, passwordHash: await HASH("Officer1234"), role: Role.officer, departmentId: depts[o.dept].id },
    });
    officers[o.dept] = officer;
    await prisma.userDepartment.create({ data: { userId: officer.id, departmentId: depts[o.dept].id } });
  }

  for (const pos of OFFICER_POSITIONS) {
    const amount = BUDGET_AMOUNTS[pos.id] ?? 1000;
    for (const [semester, year] of [["spring", 2026], ["fall", 2026]] as [string, number][]) {
      const label = semester === "spring" ? "SP26" : "FA26";
      await prisma.budget.create({
        data: { departmentId: depts[pos.id].id, name: `${pos.name} ${label}`, year, semester: semester as Semester, totalAmount: amount, status: "active" },
      });
    }
  }

  for (const m of MEMBERS) await prisma.member.create({ data: m });

  // Two pending reimbursements so the admin approval queue is non-empty on load.
  await prisma.reimbursementRequest.create({
    data: { submittedById: officers["dept-social"].id, departmentId: depts["dept-social"].id, amount: 124.5, category: "venmo", paymentMethod: "venmo", venmoZelle: "@social-chair", description: "Decorations for mixer", status: "pending" },
  });
  await prisma.reimbursementRequest.create({
    data: { submittedById: officers["dept-rush"].id, departmentId: depts["dept-rush"].id, amount: 310, category: "zelle", paymentMethod: "zelle", venmoZelle: "rush@test.com", description: "Rush week catering deposit", status: "pending" },
  });

  await prisma.activityLog.create({
    data: { userId: admin.id, action: "login", ipAddress: "127.0.0.1", timestamp: new Date() },
  });
}
