import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { NeuCard, NeuButton } from "@/components/ui/neu";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Upload, Download, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_app/import")({
  head: () => ({ meta: [{ title: "Import CSV | Loopr" }] }),
  component: ImportPage,
});

type CsvRow = Record<string, string>;

function ImportPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const lines = text.split(/\n/).filter(Boolean);
      if (lines.length < 2) {
        toast.error("CSV must have a header row and at least one lead.");
        return;
      }
      const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
      const rows = lines.slice(1).map((l) => {
        const vals = l.split(",").map((v) => v.trim());
        const row: CsvRow = {};
        headers.forEach((h, i) => {
          row[h] = vals[i] ?? "";
        });
        return row;
      });
      setPreview(rows.slice(0, 5));
      setResult(null);
    } catch {
      toast.error("Failed to read file.");
    }
  };

  const doImport = async () => {
    if (!fileRef.current?.files?.[0] || !user) return;
    setImporting(true);
    try {
      const text = await fileRef.current.files[0].text();
      const lines = text.split(/\n/).filter(Boolean);
      const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
      const sanitize = (v: string) => v.replace(/^[=\-+@]/, " ").trim();

      // Parse all rows first
      const rows: CsvRow[] = lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.trim());
        const row: CsvRow = {};
        headers.forEach((h, i) => {
          row[h] = vals[i] ?? "";
        });
        return row;
      });

      // Bulk check existing emails to avoid N+1
      const emails = rows.map((r) => r.email).filter(Boolean) as string[];
      const existingEmails = new Set<string>();
      if (emails.length > 0) {
        const { data: existing } = await supabase.from("leads").select("email").in("email", emails);
        if (existing) {
          for (const e of existing) {
            if (e.email) existingEmails.add(e.email.toLowerCase());
          }
        }
      }

      let imported = 0;
      let skipped = 0;
      const toInsert: Database["public"]["Tables"]["leads"]["Insert"][] = [];

      for (const row of rows) {
        const email = row.email?.trim();
        if (email && existingEmails.has(email.toLowerCase())) {
          skipped++;
          continue;
        }
        toInsert.push({
          name: sanitize(row.name || row.first_name + " " + row.last_name || "Unknown"),
          company: row.company ? sanitize(row.company) : undefined,
          email: email || undefined,
          deal_value: row.deal_value ? Number(row.deal_value) : undefined,
          stage: "New",
          user_id: user.id,
          source: row.source || "csv_import",
        });
        imported++;
      }

      // Batch insert all at once
      if (toInsert.length > 0) {
        const { error } = await supabase.from("leads").insert(toInsert);
        if (error) throw error;
      }
      setResult({ imported, skipped });
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(
        `Imported ${imported} leads${skipped > 0 ? ` (${skipped} duplicates skipped)` : ""}`,
      );
      setPreview([]);
      fileRef.current.value = "";
    } catch (err) {
      toast.error("Import failed. Check your CSV format.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Import CSV</h1>
        <p className="text-sm text-muted-foreground">
          Upload leads from a CSV file. Duplicates (by email) are skipped.
        </p>
      </header>

      <NeuCard className="rounded-2xl p-6 space-y-4">
        <div className="neu-dashed rounded-xl p-8 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-3">
            Upload a CSV with columns like name, email, company, deal_value, source
          </p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          <NeuButton onClick={() => fileRef.current?.click()} size="sm">
            Choose CSV
          </NeuButton>
        </div>

        {preview.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Preview (first {preview.length} rows)
            </h3>
            <div className="neu-inset rounded-xl p-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    {preview[0] &&
                      Object.keys(preview[0]).map((k) => (
                        <th key={k} className="text-left px-2 py-1 font-semibold">
                          {k}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-black/5">
                      {Object.values(row).map((v: string, j) => (
                        <td key={j} className="px-2 py-1 truncate max-w-[120px]">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <NeuButton onClick={doImport} disabled={importing} className="mt-3">
              {importing
                ? "Importing..."
                : `Import ${preview.length > 0 ? `${preview.length}+ leads` : "All"}`}
            </NeuButton>
          </div>
        )}

        {result && (
          <div
            className={`flex items-center gap-2 text-sm ${result.imported > 0 ? "text-green-600" : "text-muted-foreground"}`}
          >
            {result.imported > 0 ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {result.imported} imported
            {result.skipped > 0 ? `, ${result.skipped} duplicates skipped` : ""}
          </div>
        )}
      </NeuCard>

      <NeuCard className="rounded-2xl p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
          CSV Format Example
        </h3>
        <pre className="text-xs text-muted-foreground bg-foreground/5 rounded-lg p-3 overflow-x-auto">
          name,email,company,deal_value,source{`\n`}Acme Corp,acme@example.com,Acme
          Inc,5000,referral{`\n`}Bob Smith,bob@example.com,,1000,website
        </pre>
        <NeuButton
          size="sm"
          variant="ghost"
          className="mt-2"
          onClick={() => {
            const blob = new Blob(
              [
                [
                  "name,email,company,deal_value,source",
                  "Acme Corp,acme@example.com,Acme Inc,5000,referral",
                  "Bob Smith,bob@example.com,,1000,website",
                ].join("\n"),
              ],
              { type: "text/csv" },
            );
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "loopr_template.csv";
            a.click();
          }}
        >
          <Download className="h-3 w-3 mr-1 inline" /> Download Template
        </NeuButton>
      </NeuCard>
    </div>
  );
}
