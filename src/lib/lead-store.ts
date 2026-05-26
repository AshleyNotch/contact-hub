import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Lead, Status } from "./crm-types";

type DbLead = {
  id: string;
  company_name: string;
  email: string;
  country: string;
  source: string;
  website: string;
  founders: string;
  status: Status;
  notes: string | null;
  created_at: string;
};

function fromDb(row: DbLead): Lead {
  return {
    id: row.id,
    companyName: row.company_name,
    email: row.email,
    country: row.country,
    source: row.source,
    website: row.website,
    founders: row.founders,
    status: row.status,
    notes: row.notes ?? undefined,
  };
}

function toDb(lead: Partial<Lead>): Partial<DbLead> {
  const row: Partial<DbLead> = {};
  if (lead.id !== undefined) row.id = lead.id;
  if (lead.companyName !== undefined) row.company_name = lead.companyName;
  if (lead.email !== undefined) row.email = lead.email;
  if (lead.country !== undefined) row.country = lead.country;
  if (lead.source !== undefined) row.source = lead.source;
  if (lead.website !== undefined) row.website = lead.website;
  if (lead.founders !== undefined) row.founders = lead.founders;
  if (lead.status !== undefined) row.status = lead.status;
  if (lead.notes !== undefined) row.notes = lead.notes;
  return row;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("leads")
      .select("id, company_name, email, country, source, website, founders, status, notes")
      .order("created_at", { ascending: false });
    setLeads(((data ?? []) as DbLead[]).map(fromDb));
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("leads-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return {
    leads,
    setAll: (next: Lead[]) => {
      supabase
        .from("leads")
        .delete()
        .gt("created_at", "1970-01-01T00:00:00Z")
        .then(() => (next.length ? supabase.from("leads").insert(next.map(toDb)) : Promise.resolve()))
        .then(() => refresh());
    },
    add: (incoming: Lead[]) => {
      supabase.from("leads").insert(incoming.map(toDb)).then(() => refresh());
    },
    update: (id: string, patch: Partial<Lead>) => {
      supabase.from("leads").update(toDb(patch)).eq("id", id).then(() => refresh());
    },
    remove: (id: string) => {
      supabase.from("leads").delete().eq("id", id).then(() => refresh());
    },
    clear: () => {
      supabase
        .from("leads")
        .delete()
        .gt("created_at", "1970-01-01T00:00:00Z")
        .then(() => refresh());
    },
  };
}
