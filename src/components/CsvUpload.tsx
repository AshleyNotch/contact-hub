import { useRef, useState } from "react";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { mapHeaderToField, rowToLead, type Lead } from "@/lib/crm-types";

export function CsvUpload({ onImport }: { onImport: (leads: Lead[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

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
          if (f) {
            fieldMap[h] = f;
            mapped.push(`${h} → ${f}`);
          }
        }
        const leads = (results.data ?? [])
          .filter((r) => Object.values(r).some((v) => v && String(v).trim()))
          .map((r) => rowToLead(r, fieldMap));
        if (leads.length === 0) {
          toast.error("No rows found in CSV");
          return;
        }
        onImport(leads);
        toast.success(`Imported ${leads.length} leads`, {
          description: `Mapped fields: ${mapped.join(", ") || "none"}`,
        });
      },
      error: (err) => {
        setLoading(false);
        toast.error("Failed to parse CSV", { description: err.message });
      },
    });
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
    </>
  );
}
