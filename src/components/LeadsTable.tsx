import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";
import { STATUSES, STATUS_LABEL, type Lead, type Status } from "@/lib/crm-types";
import { cn } from "@/lib/utils";

const statusStyles: Record<Status, string> = {
  new: "bg-muted text-foreground",
  contacted: "bg-blue-100 text-blue-900",
  outreach_complete: "bg-[oklch(0.86_0.22_145)] text-black",
  responded: "bg-purple-100 text-purple-900",
  closed: "bg-zinc-200 text-zinc-700",
};

interface Props {
  leads: Lead[];
  onUpdate: (id: string, patch: Partial<Lead>) => void;
  onRemove: (id: string) => void;
}

export function LeadsTable({ leads, onUpdate, onRemove }: Props) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const countries = useMemo(
    () => Array.from(new Set(leads.map((l) => l.country).filter(Boolean))).sort(),
    [leads],
  );
  const sources = useMemo(
    () => Array.from(new Set(leads.map((l) => l.source).filter(Boolean))).sort(),
    [leads],
  );

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (countryFilter !== "all" && l.country !== countryFilter) return false;
      if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
      if (!needle) return true;
      return [
        l.companyName,
        l.email,
        l.country,
        l.source,
        l.website,
        l.founders,
        l.notes,
      ]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(needle));
    });
  }, [leads, q, statusFilter, countryFilter, sourceFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company, email, founder…"
            className="h-10 rounded-full pl-9"
          />
        </div>
        <FilterSelect
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="Status"
          options={[{ value: "all", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))]}
        />
        <FilterSelect
          value={countryFilter}
          onValueChange={setCountryFilter}
          placeholder="Country"
          options={[{ value: "all", label: "All countries" }, ...countries.map((c) => ({ value: c, label: c }))]}
        />
        <FilterSelect
          value={sourceFilter}
          onValueChange={setSourceFilter}
          placeholder="Source"
          options={[{ value: "all", label: "All sources" }, ...sources.map((c) => ({ value: c, label: c }))]}
        />
        <div className="ml-auto text-sm text-muted-foreground">
          {filtered.length} of {leads.length}
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Founders</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[1%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center text-muted-foreground">
                  {leads.length === 0
                    ? "No leads yet — upload a CSV to get started."
                    : "No leads match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.companyName || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{l.email || "—"}</TableCell>
                  <TableCell>{l.country || "—"}</TableCell>
                  <TableCell>{l.source || "—"}</TableCell>
                  <TableCell>
                    {l.website ? (
                      <a
                        href={l.website.startsWith("http") ? l.website : `https://${l.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
                      >
                        {l.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{l.founders || "—"}</TableCell>
                  <TableCell>
                    <Badge className={cn("rounded-full font-medium", statusStyles[l.status])}>
                      {STATUS_LABEL[l.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {l.status !== "outreach_complete" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onUpdate(l.id, { status: "outreach_complete" })}
                          className="h-8 gap-1.5"
                          title="Mark outreach complete"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="hidden md:inline">Mark done</span>
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {STATUSES.map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => onUpdate(l.id, { status: s })}
                            >
                              {l.status === s && <Check className="h-4 w-4" />}
                              <span className={l.status === s ? "" : "ml-6"}>
                                Set: {STATUS_LABEL[s]}
                              </span>
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onRemove(l.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  options,
}: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-10 w-[160px] rounded-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
