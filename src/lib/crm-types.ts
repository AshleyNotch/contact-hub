export type Status = "new" | "contacted" | "outreach_complete" | "responded" | "closed";

export const STATUSES: Status[] = [
  "new",
  "contacted",
  "outreach_complete",
  "responded",
  "closed",
];

export interface Lead {
  id: string;
  companyName: string;
  email: string;
  country: string;
  source: string;
  website: string;
  companyLinkedin?: string;
  founders: string;
  status: Status;
  notes?: string;
  [key: string]: string | undefined;
}

// Map common CSV header variants -> Lead field
const FIELD_ALIASES: Record<keyof Lead | string, string[]> = {
  companyName: ["company", "company name", "companyname", "organization", "org", "business"],
  email: ["email", "e-mail", "mail", "contact email", "email address"],
  country: ["country", "location", "region", "geo"],
  source: ["source", "lead source", "channel", "origin"],
  website: ["website", "site", "url", "web", "domain"],
  companyLinkedin: ["linkedin", "company linkedin", "linkedin url", "linkedin profile", "company linkedin url"],
  founders: ["founder", "founders", "founder name", "founders details", "ceo", "owner", "contact"],
  status: ["status", "stage", "state"],
  notes: ["notes", "note", "comments", "comment", "description"],
};

const norm = (s: string) => s.toLowerCase().trim().replace(/[_\-\s]+/g, " ");

export function mapHeaderToField(header: string): keyof Lead | null {
  const n = norm(header);
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((a) => norm(a) === n)) return field as keyof Lead;
  }
  return null;
}

export function normalizeStatus(raw: string | undefined): Status {
  if (!raw) return "new";
  const n = raw.toLowerCase().replace(/[\s-]+/g, "_");
  if (STATUSES.includes(n as Status)) return n as Status;
  if (n.includes("complete") || n.includes("done") || n.includes("sent")) return "outreach_complete";
  if (n.includes("contact")) return "contacted";
  if (n.includes("respond") || n.includes("reply")) return "responded";
  if (n.includes("clos") || n.includes("won") || n.includes("lost")) return "closed";
  return "new";
}

export function rowToLead(row: Record<string, string>, fieldMap: Record<string, keyof Lead>): Lead {
  const lead: Lead = {
    id: crypto.randomUUID(),
    companyName: "",
    email: "",
    country: "",
    source: "",
    website: "",
    founders: "",
    status: "new",
  };
  const extras: Record<string, string> = {};
  for (const [csvKey, value] of Object.entries(row)) {
    const field = fieldMap[csvKey];
    if (field) {
      if (field === "status") lead.status = normalizeStatus(value);
      else (lead as Record<string, string | undefined>)[field] = (value ?? "").toString().trim();
    } else if (value) {
      extras[csvKey] = value;
    }
  }
  if (Object.keys(extras).length) lead.notes = (lead.notes ? lead.notes + " | " : "") + Object.entries(extras).map(([k, v]) => `${k}: ${v}`).join(", ");
  return lead;
}

export const STATUS_LABEL: Record<Status, string> = {
  new: "New",
  contacted: "Contacted",
  outreach_complete: "Outreach Complete",
  responded: "Responded",
  closed: "Closed",
};
