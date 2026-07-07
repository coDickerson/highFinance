import type { PositionBudget, FeeIncomeLine, RosterEntry } from "./ledger";

// Fake budgets shown in the demo. Columns match POSITION_COLUMN in ledger.ts;
// remaining = planned - spent.
export const DEMO_POSITION_BUDGETS: PositionBudget[] = [
  { position: "Psi (Social)",   column: "B",  planned: 3000, spent: 1850, remaining: 1150 },
  { position: "Brotherhood",    column: "D",  planned: 2000, spent: 640,  remaining: 1360 },
  { position: "Rush",           column: "F",  planned: 5000, spent: 3120, remaining: 1880 },
  { position: "Housing",        column: "H",  planned: 8000, spent: 5400, remaining: 2600 },
  { position: "Kitchen",        column: "J",  planned: 4000, spent: 2210, remaining: 1790 },
  { position: "Iota",           column: "L",  planned: 1500, spent: 300,  remaining: 1200 },
  { position: "Risk",           column: "N",  planned: 1000, spent: 150,  remaining: 850 },
  { position: "Sustainability", column: "P",  planned: 800,  spent: 220,  remaining: 580 },
  { position: "Misc",           column: "R",  planned: 500,  spent: 95,   remaining: 405 },
  { position: "Emergency",      column: "T",  planned: 5000, spent: 0,    remaining: 5000 },
  { position: "Philo",          column: "V",  planned: 1200, spent: 450,  remaining: 750 },
  { position: "President",      column: "X",  planned: 2000, spent: 780,  remaining: 1220 },
  { position: "Retreat/Formal", column: "Z",  planned: 4000, spent: 2600, remaining: 1400 },
  { position: "IM",             column: "AB", planned: 600,  spent: 180,  remaining: 420 },
];

export const DEMO_FEES_AND_INCOME: { income: FeeIncomeLine[]; expenses: FeeIncomeLine[] } = {
  income: [
    { category: "Dues",   item: "Active Member Dues", perMember: 150, estTotal: 9000, notes: "60 actives" },
    { category: "Dues",   item: "New Member Dues",    perMember: 200, estTotal: 3000, notes: "15 pledges" },
    { category: "Events", item: "Formal Ticket Sales", perMember: 40,  estTotal: 2400, notes: "" },
  ],
  expenses: [
    { category: "Housing", item: "Utilities",           perMember: 0, estTotal: 6000, notes: "Semester" },
    { category: "Kitchen", item: "Food Service",        perMember: 0, estTotal: 8000, notes: "" },
    { category: "Social",  item: "Events & Exchanges",  perMember: 0, estTotal: 3000, notes: "" },
  ],
};

export const DEMO_ROSTER: RosterEntry[] = [
  { name: "Alex Johnson",   year: "FA24", baseRate: 150, amtPaid: 150, amtLeft: 0,   complete: true },
  { name: "Marco Rivera",   year: "FA24", baseRate: 150, amtPaid: 150, amtLeft: 0,   complete: true },
  { name: "Tyler Chen",     year: "SP25", baseRate: 150, amtPaid: 75,  amtLeft: 75,  complete: false },
  { name: "Jordan Park",    year: "SP25", baseRate: 150, amtPaid: 150, amtLeft: 0,   complete: true },
  { name: "Ethan Williams", year: "FA25", baseRate: 150, amtPaid: 0,   amtLeft: 150, complete: false },
];
