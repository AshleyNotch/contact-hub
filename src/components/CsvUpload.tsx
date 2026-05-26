import { useRef, useState } from "react";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { mapHeaderToField, rowToLead, type Lead } from "@/lib/crm-types";
import { DuplicateDialog, type DuplicateMatch } from "@/components/DuplicateDialog";

function normalizeUrl(s: string | undefined): string {
  if (!s) return "";
  return s.toLowerCase().trim().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function normalizeName(s: string | undefined): string {
  return (s ?? "").toLowerCase().trim();
}

function findMatch(incoming: Lead, existing: Lead[]): DuplicateMatch | null {
  for (const ex of existing) {
    if (incoming.email && ex.email && normalizeName(incoming.email) === normalizeName(ex.email))
      return { incoming, existing: ex, matchedOn: "email" };
    if (incoming.website && ex.website && normalizeUrl(incoming.website) === normalizeUrl(ex.website))
      return { incoming, existing: ex, matchedOn: "website" };
    if (incoming.companyLinkedin && ex.companyLinkedin && normalizeUrl(incoming.companyLinkedin) === normalizeUrl(ex.companyLinkedin))
      return { incoming, existing: ex, matchedOn: "linkedin" };
    if (incoming.companyName && ex.companyName && normalizeName(incoming.companyName) === normalizeName(ex.companyName))
      return { incoming, existing: ex, matchedOn: "name" };
  }
  return null;
}

function mergePatch(incoming: Lead, existing: Lead): Partial<Lead> {
  const patch: Partial<Lead> = {};
  const fields: (keyof Lead)[] = ["companyName", "email", "website", "companyLinkedin", "country", "source", "founders", "notes"];
  for (const f of fields) {
    const val = incoming[f];
    if (val && val !== existing[f]) patch[f as string] = val;
  }
  return patch;
}

interface Props {
  existingLeads: Lead[];
  onImport: (leads: Lead[]) => void;
  onMerge: (id: string, patch: Partial<Lead>) => void;
}

export function CsvUpload({ existingLeads, onImport, onMerge }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [matches, setMatches] = useState<DuplicateMatch[]>([]);
  const [uniqueLeads, setUniqueLeads] = useState<Lead[]>([]);
  const [allIncoming, setAllIncoming] = useState<Lead[]>([]);

  const handleFile = (file: File) => {
    setLoading(true);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setLoading(false);
        const headers = results.meta.fields ?? [];
        const fieldMap: Record<string, keyof Lead> = {};
        const mapped: string[] = [];
        for (const h of headers) {
          const f = mapHeaderToField(h);
          if (f) { fieldMap[h] = f; mapped.push(`${h} → ${f}`); }
        }
        const leads = (results.data ?? [])
          .filter((r) => Object.values(r).some((v) => v && String(v).trim()))
          .map((r) => rowToLead(r, fieldMap));

        if (leads.length === 0) { toast.error("No rows found in CSV"); return; }

        const foundMatches: DuplicateMatch[] = [];
        const unique: Lead[] = [];

        for (const lead of leads) {
          const match = findMatch(lead, existingLeads);
          if (match) foundMatches.push(match);
          else unique.push(lead);
        }

        if (foundMatches.length > 0) {
          setMatches(foundMatches);
          setUniqueLeads(unique);
          setAllIncoming(leads);
          setDialogOpen(true);
        } else {
          onImport(leads);
          toast.success(`Imported ${leads.length} leads`, {
            description: `Mapped: ${mapped.join(", ") || "none"}`,
          });
        }
      },
      error: (err) => {
        setLoading(false);
        toast.error("Failed to parse CSV", { description: err.message });
      },
    });
  };

  const handleMerge = () => {
    setDialogOpen(false);
    for (const m of matches) {
      const patch = mergePatch(m.incoming, m.existing);
      if (Object.keys(patch).length > 0) onMerge(m.existing.id, patch);
    }
    if (uniqueLeads.length > 0) onImport(uniqueLeads);
    toast.success(
      `Merged ${matches.length} duplicate${matches.length !== 1 ? "s" : ""}` +
      (uniqueLeads.length > 0 ? `, imported ${uniqueLeads.length} new` : ""),
    );
  };

  const handleSkip = () => {
    setDialogOpen(false);
    if (uniqueLeads.length > 0) {
      onImport(uniqueLeads);
      toast.success(`Imported ${uniqueLeads.length} new lead${uniqueLeads.length !== 1 ? "s" : ""}, skipped ${matches.length} duplicate${matches.length !== 1 ? "s" : ""}`);
    } else {
      toast.info("No new leads to import — all were duplicates.");
    }
  };

  const handleImportAll = () => {
    setDialogOpen(false);
    onImport(allIncoming);
    toast.success(`Imported all ${allIncoming.length} leads`);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="rounded-full bg-foreground text-background hover:bg-foreground/90"
      >
        <Upload className="h-4 w-4" />
        {loading ? "Parsing..." : "Upload CSV"}
      </Button>

      <DuplicateDialog
        open={dialogOpen}
        matches={matches}
        newCount={uniqueLeads.length}
        onMerge={handleMerge}
        onSkip={handleSkip}
        onImportAll={handleImportAll}
        onCancel={() => setDialogOpen(false)}
      />
    </>
  );
}
