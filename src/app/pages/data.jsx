// ═══════════════════════════════════════════════════════════════════════════
// Shared sample data, constants, and helpers
// ═══════════════════════════════════════════════════════════════════════════

export const SAMPLE_DATA = [
  { id: 1, name: "Acme Corp", contact: "Jane Smith", email: "jane@acme.com", status: "active", category: "enterprise", amount: 125000, date: "2026-01-15", priority: true, callTime: { hours: 9, minutes: 0 }, meeting: { date: { year: 2026, month: 1, date: 20 }, time: { hours: 14, minutes: 30 } }, notes: "Key strategic account. Renewed for 3 years with expanded licensing across all departments. Primary contact prefers email communication." },
  { id: 2, name: "Globex Inc", contact: "Bob Johnson", email: "bob@globex.com", status: "active", category: "mid-market", amount: 67000, date: "2026-02-03", priority: false, callTime: { hours: 10, minutes: 30 }, meeting: null, notes: "Growing steadily." },
  { id: 3, name: "Initech", contact: "Michael Bolton", email: "michael@initech.com", status: "churned", category: "smb", amount: 12000, date: "2025-11-20", priority: false, callTime: null, meeting: null, notes: "Churned due to budget cuts in Q4. Expressed interest in returning if pricing is adjusted. Follow up in Q2 with new SMB pricing tier." },
  { id: 4, name: "Umbrella Corp", contact: "Alice Wesker", email: "alice@umbrella.com", status: "at-risk", category: "enterprise", amount: 230000, date: "2026-03-01", priority: true, callTime: { hours: 15, minutes: 0 }, meeting: { date: { year: 2026, month: 2, date: 15 }, time: { hours: 10, minutes: 0 } }, notes: "Contract renewal coming up in 60 days. Competitor demo scheduled internally. Need to present ROI analysis and case studies before renewal discussion." },
  { id: 5, name: "Stark Industries", contact: "Pepper Potts", email: "pepper@stark.com", status: "active", category: "enterprise", amount: 450000, date: "2026-01-28", priority: false, callTime: { hours: 8, minutes: 0 }, meeting: null, notes: "" },
  { id: 6, name: "Wayne Enterprises", contact: "Lucius Fox", email: "lucius@wayne.com", status: "active", category: "enterprise", amount: 380000, date: "2025-12-15", priority: true, callTime: { hours: 11, minutes: 0 }, meeting: { date: { year: 2026, month: 0, date: 10 }, time: { hours: 16, minutes: 0 } }, notes: "Excellent relationship with executive team. Exploring integration with their internal R&D platform. Technical POC scheduled for next month." },
  { id: 7, name: "Wonka Industries", contact: "Charlie Bucket", email: "charlie@wonka.com", status: "at-risk", category: "mid-market", amount: 42000, date: "2026-02-14", priority: false, callTime: null, meeting: null, notes: "Support tickets increasing. Main pain point is onboarding new users — documentation gaps flagged twice." },
  { id: 8, name: "Cyberdyne Systems", contact: "Miles Dyson", email: "miles@cyberdyne.com", status: "churned", category: "mid-market", amount: 89000, date: "2025-10-05", priority: false, callTime: null, meeting: null, notes: "Left for competitor. No interest in returning at this time." },
  { id: 9, name: "Soylent Corp", contact: "Sol Roth", email: "sol@soylent.com", status: "active", category: "smb", amount: 18000, date: "2026-03-10", priority: false, callTime: { hours: 13, minutes: 45 }, meeting: null, notes: "Small but loyal. Refers other SMBs regularly — consider for referral program pilot." },
  { id: 10, name: "Tyrell Corp", contact: "Eldon Tyrell", email: "eldon@tyrell.com", status: "active", category: "enterprise", amount: 520000, date: "2026-01-05", priority: true, callTime: { hours: 9, minutes: 30 }, meeting: { date: { year: 2026, month: 0, date: 25 }, time: { hours: 11, minutes: 0 } }, notes: "Largest account by revenue. Multi-year deal with annual step-ups. Executive sponsor is very engaged — quarterly business reviews are well-attended. Potential to expand into their Asia-Pacific offices in H2." },
  { id: 11, name: "Pied Piper", contact: "Richard Hendricks", email: "richard@piedpiper.com", status: "active", category: "smb", amount: 28000, date: "2026-02-22", priority: false, callTime: { hours: 16, minutes: 0 }, meeting: null, notes: "Technical founder, prefers API-first approach." },
  { id: 12, name: "Hooli", contact: "Gavin Belson", email: "gavin@hooli.com", status: "at-risk", category: "enterprise", amount: 175000, date: "2025-12-30", priority: true, callTime: { hours: 14, minutes: 0 }, meeting: { date: { year: 2026, month: 0, date: 5 }, time: { hours: 9, minutes: 0 } }, notes: "Internal champion left the company. New VP of Engineering is evaluating alternatives. Urgent: schedule intro meeting with new stakeholder and prepare competitive positioning deck." },
];

export const STATUS_COLORS = { active: "success", "at-risk": "warning", churned: "danger" };
export const STATUS_LABELS = { active: "Active", "at-risk": "At Risk", churned: "Churned" };
export const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "At Risk", value: "at-risk" },
  { label: "Churned", value: "churned" },
];
export const CATEGORY_OPTIONS = [
  { label: "Enterprise", value: "enterprise" },
  { label: "Mid-Market", value: "mid-market" },
  { label: "SMB", value: "smb" },
];

export const ROLE_OPTIONS = [
  { label: "Decision Maker", value: "decision_maker" },
  { label: "Influencer", value: "influencer" },
  { label: "End User", value: "end_user" },
  { label: "Champion", value: "champion" },
  { label: "Blocker", value: "blocker" },
];

export const RANK_OPTIONS = [
  { label: "Move to Marketing", value: "move_to_marketing" },
  { label: "Move to Sales", value: "move_to_sales" },
  { label: "Disqualify", value: "disqualify" },
];

export const OEM_OPTIONS = [
  { label: "Dell", value: "dell" },
  { label: "HP", value: "hp" },
  { label: "Lenovo", value: "lenovo" },
  { label: "Apple", value: "apple" },
];

export const HW_CATEGORY_OPTIONS = [
  { label: "Laptops", value: "laptops" },
  { label: "Desktops", value: "desktops" },
  { label: "Servers", value: "servers" },
  { label: "Networking", value: "networking" },
];

export const INDUSTRY_OPTIONS = [
  { label: "Accounting", value: "accounting" },
  { label: "Technology", value: "technology" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Manufacturing", value: "manufacturing" },
  { label: "Finance", value: "finance" },
];

export const SUB_CATEGORIES = {
  enterprise: [
    { label: "Strategic", value: "strategic" },
    { label: "Key Account", value: "key_account" },
    { label: "Named Account", value: "named_account" },
  ],
  "mid-market": [
    { label: "Growth", value: "growth" },
    { label: "Established", value: "established" },
  ],
  smb: [
    { label: "Startup", value: "startup" },
    { label: "Small Business", value: "small_business" },
  ],
};

export const formatCurrency = (val) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

export const formatTime = (val) => {
  if (!val) return "--";
  const h = val.hours % 12 || 12;
  const ampm = val.hours < 12 ? "AM" : "PM";
  return `${h}:${String(val.minutes).padStart(2, "0")} ${ampm}`;
};

export const formatDateTime = (val) => {
  if (!val) return "--";
  const parts = [];
  if (val.date) {
    const d = new Date(val.date.year, val.date.month, val.date.date);
    parts.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }
  if (val.time) parts.push(formatTime(val.time));
  return parts.join(" at ");
};

export const GITHUB_BASE_URL = "https://github.com/05bmckay/hs-uix/tree/main/packages";
