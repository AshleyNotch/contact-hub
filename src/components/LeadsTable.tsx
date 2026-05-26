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
  Linkedin,
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
      return [l.companyName, l.email, l.country, l.source, l.website, l.companyLinkedin, l.notes]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(needle));
    });
  }, [leads, q, statusFilter, countryFilter, sourceFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company, email…"
            className="h-9 rounded-full pl-9"
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
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">
          {filtered.length} / {leads.length}
        </span>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[860px]">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
                <TableHead className="w-10 px-3" />
                <TableHead className="w-[180px] font-semibold text-xs uppercase tracking-wide text-muted-foreground">Company</TableHead>
                <TableHead className="w-[150px] font-semibold text-xs uppercase tracking-wide text-muted-foreground">Website</TableHead>
                <TableHead className="w-10 px-2 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  <Linkedin className="h-3.5 w-3.5 mx-auto" />
                </TableHead>
                <TableHead className="w-[180px] font-semibold text-xs uppercase tracking-wide text-muted-foreground">Email</TableHead>
                <TableHead className="w-[110px] font-semibold text-xs uppercase tracking-wide text-muted-foreground">Country</TableHead>
                <TableHead className="w-[150px] font-semibold text-xs uppercase tracking-wide text-muted-foreground">Source</TableHead>
                <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wide text-muted-foreground">Status</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-16 text-center text-sm text-muted-foreground">
                    {leads.length === 0
                      ? "No leads yet — upload a CSV to get started."
                      : "No leads match your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((l) => (
                  <LeadRow key={l.id} lead={l} onUpdate={onUpdate} onRemove={onRemove} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function LeadRow({
  lead: l,
  onUpdate,
  onRemove,
}: {
  lead: Lead;
  onUpdate: Props["onUpdate"];
  onRemove: Props["onRemove"];
}) {
  const done = l.status === "outreach_complete";

  return (
    <TableRow className={cn("group border-b last:border-0 transition-colors", done && "bg-muted/20")}>
      {/* Mark done toggle */}
      <TableCell className="px-3 py-2.5 w-10">
        <button
          onClick={() => onUpdate(l.id, { status: done ? "contacted" : "outreach_complete" })}
          title={done ? "Mark as not done" : "Mark outreach complete"}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full transition-colors",
            done
              ? "text-[oklch(0.5_0.22_145)]"
              : "text-muted-foreground/30 hover:text-[oklch(0.5_0.22_145)]",
          )}
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>
      </TableCell>

      {/* Company */}
      <TableCell className="py-2.5 font-medium">
        <span className="block truncate max-w-[165px] text-sm" title={l.companyName || undefined}>
          {l.companyName || <span className="text-muted-foreground/40">—</span>}
        </span>
      </TableCell>

      {/* Website */}
      <TableCell className="py-2.5">
        {l.website ? (
          <a
            href={l.website.startsWith("http") ? l.website : `https://${l.website}`}
            target="_blank"
            rel="noreferrer"
            title={l.website}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground max-w-[135px] group/link"
          >
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover/link:opacity-100" />
            <span className="truncate">{l.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
          </a>
        ) : (
          <span className="text-muted-foreground/30 text-xs">—</span>
        )}
      </TableCell>

      {/* LinkedIn */}
      <TableCell className="px-2 py-2.5 text-center w-10">
        {l.companyLinkedin ? (
          <a
            href={l.companyLinkedin.startsWith("http") ? l.companyLinkedin : `https://${l.companyLinkedin}`}
            target="_blank"
            rel="noreferrer"
            title={l.companyLinkedin}
            className="inline-flex text-[#0A66C2] hover:opacity-70 transition-opacity"
          >
            <Linkedin className="h-4 w-4" />
          </a>
        ) : (
          <span className="text-muted-foreground/25 text-xs">—</span>
        )}
      </TableCell>

      {/* Email */}
      <TableCell className="py-2.5">
        <span
          className="block truncate max-w-[165px] text-xs text-muted-foreground"
          title={l.email || undefined}
        >
          {l.email || <span className="text-muted-foreground/30">—</span>}
        </span>
      </TableCell>

      {/* Country */}
      <TableCell className="py-2.5">
        <span
          className="block truncate max-w-[95px] text-sm"
          title={l.country || undefined}
        >
          {l.country || <span className="text-muted-foreground/30 text-xs">—</span>}
        </span>
      </TableCell>

      {/* Source */}
      <TableCell className="py-2.5">
        <span
          className="block truncate max-w-[135px] text-sm"
          title={l.source || undefined}
        >
          {l.source || <span className="text-muted-foreground/30 text-xs">—</span>}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell className="py-2.5">
        <Badge className={cn("rounded-full text-xs font-medium px-2 py-0.5 whitespace-nowrap", statusStyles[l.status])}>
          {STATUS_LABEL[l.status]}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell className="py-2.5 pr-2 text-right w-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {STATUSES.map((s) => (
              <DropdownMenuItem key={s} onClick={() => onUpdate(l.id, { status: s })}>
                {l.status === s && <Check className="h-4 w-4" />}
                <span className={l.status === s ? "" : "ml-6"}>Set: {STATUS_LABEL[s]}</span>
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
      </TableCell>
    </TableRow>
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
      <SelectTrigger className="h-9 w-[150px] rounded-full">
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
