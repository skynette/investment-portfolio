"use client";

import { useState, useTransition } from "react";
import { Upload } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { importTransactionsCsv } from "@/server/actions/transactions";

export function ImportCsvDialog() {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);

  const submit = () => {
    if (!file) return toast.error("Pick a file");
    startTransition(async () => {
      const csv = await file.text();
      const res = await importTransactionsCsv(csv);
      toast.success(`Imported ${res.inserted}, skipped ${res.skipped} (of ${res.totalParsed})`);
      setOpen(false);
      setFile(null);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Upload className="mr-2 h-4 w-4" /> Import CSV
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Import transactions</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          Imports rows from 2025-05-19 11:20 onward. Duplicates (same asset, time, type, amount, total) are skipped.
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
        <Button onClick={submit} disabled={!file}>Import</Button>
      </DialogContent>
    </Dialog>
  );
}
