import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/lib/crm-types";

export interface DuplicateMatch {
  incoming: Lead;
  existing: Lead;
  matchedOn: "email" | "website" | "linkedin" | "name";
}

interface Props {
  open: boolean;
  matches: DuplicateMatch[];
  newCount: number;
  onMerge: () => void;
  onSkip: () => void;
  onImportAll: () => void;
  onCancel: () => void;
}

const matchLabel: Record<DuplicateMatch["matchedOn"], string> = {
  email: "same email",
  website: "same website",
  linkedin: "same LinkedIn",
  name: "same company name",
};

export function DuplicateDialog({ open, matches, newCount, onMerge, onSkip, onImportAll, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Duplicates found</DialogTitle>
          <DialogDescription>
            {matches.length} lead{matches.length !== 1 ? "s" : ""} in the CSV already exist in your CRM.
            {newCount > 0 && ` ${newCount} new lead${newCount !== 1 ? "s" : ""} will be imported regardless.`}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-56 overflow-y-auto rounded-lg border divide-y text-sm">
          {matches.map((m, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 gap-3">
              <span className="font-medium truncate">{m.incoming.companyName || m.incoming.email || "Unknown"}</span>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {matchLabel[m.matchedOn]}
              </Badge>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} className="sm:mr-auto">
            Cancel
          </Button>
          <Button variant="ghost" size="sm" onClick={onImportAll}>
            Import all anyway
          </Button>
          <Button variant="outline" size="sm" onClick={onSkip}>
            Skip duplicates
          </Button>
          <Button size="sm" onClick={onMerge}>
            Merge duplicates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
