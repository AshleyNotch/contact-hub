import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { CsvUpload } from "@/components/CsvUpload";
import { LeadsTable } from "@/components/LeadsTable";
import { useLeads } from "@/lib/lead-store";
import { STATUS_LABEL, type Status } from "@/lib/crm-types";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: CrmPage,
});

function CrmPage() {
  const { leads, add, update, remove, clear } = useLeads();

  const stats = useMemo(() => {
    const total = leads.length;
    const byStatus: Record<Status, number> = {
      new: 0,
      contacted: 0,
      outreach_complete: 0,
      responded: 0,
      closed: 0,
    };
    for (const l of leads) byStatus[l.status]++;
    return { total, byStatus };
  }, [leads]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[oklch(0.86_0.22_145)]">
              <span className="text-sm font-bold text-black">≡</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Sprrintly CRM</span>
          </div>
          <div className="flex items-center gap-2">
            <CsvUpload onImport={add} />
            {leads.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete all ${leads.length} leads?`)) clear();
                }}
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        <section>
          <h1 className="text-3xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a CSV — columns are auto-mapped. Search, filter, and track outreach.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total" value={stats.total} highlight />
          {(Object.keys(stats.byStatus) as Status[]).map((s) => (
            <StatCard key={s} label={STATUS_LABEL[s]} value={stats.byStatus[s]} />
          ))}
        </section>

        <LeadsTable leads={leads} onUpdate={update} onRemove={remove} />

        {leads.length === 0 && <EmptyHelper />}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-xl border bg-card p-4 " +
        (highlight ? "bg-[oklch(0.86_0.22_145)] border-transparent" : "")
      }
    >
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

function EmptyHelper() {
  return (
    <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">CSV format</p>
      <p className="mt-1">
        Your CSV can include any combination of these columns (header names are flexible):
        <span className="block mt-2 font-mono text-xs">
          Company Name, Email, Country, Source, Website, Founders, Status
        </span>
      </p>
    </div>
  );
}
