"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPercent, type Currency } from "@/lib/format";
import { MoneyDisplay, PrivateText } from "@/components/dashboard/MoneyDisplay";
import { updateMonthlyEntry, deleteMonthlyEntry } from "@/server/actions/monthly";

type Row = {
  id: number;
  categoryId: number;
  target: number;
  actual: number;
  note: string | null;
  category: { name: string; currency: string };
};

export function MonthlyTable({ rows }: { rows: Row[] }) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<{ id: number; field: "target" | "actual" } | null>(null);
  const [draft, setDraft] = useState<string>("");

  const totalTarget = rows.reduce((s, r) => s + Number(r.target), 0);
  const totalActual = rows.reduce((s, r) => s + Number(r.actual), 0);
  const currency = (rows[0]?.category.currency as Currency) ?? "NGN";

  const commit = (id: number, field: "target" | "actual") => {
    const value = Number(draft);
    if (Number.isNaN(value) || value < 0) {
      toast.error("Enter a non-negative number");
      setEditing(null);
      return;
    }
    startTransition(async () => {
      await updateMonthlyEntry(id, { [field]: value });
      toast.success("Saved");
      setEditing(null);
    });
  };

  const remove = (id: number) => {
    if (!confirm("Delete this row?")) return;
    startTransition(async () => {
      await deleteMonthlyEntry(id);
      toast.success("Deleted");
    });
  };

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No categories for this month yet. Create a category to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Target</TableHead>
          <TableHead className="text-right">Actual</TableHead>
          <TableHead className="text-right">%</TableHead>
          <TableHead className="w-[60px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const target = Number(r.target);
          const actual = Number(r.actual);
          const cur = r.category.currency as Currency;
          const cellClass = "cursor-pointer text-right hover:bg-accent/50";

          return (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.category.name}</TableCell>

              {(["target", "actual"] as const).map((field) => (
                <TableCell key={field} className={cellClass}
                  onClick={() => {
                    setEditing({ id: r.id, field });
                    setDraft(String(field === "target" ? target : actual));
                  }}>
                  {editing?.id === r.id && editing.field === field ? (
                    <div className="flex items-center justify-end gap-1">
                      <Input
                        autoFocus
                        type="number"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => commit(r.id, field)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commit(r.id, field);
                          if (e.key === "Escape") setEditing(null);
                        }}
                        className="h-8 w-32 text-right"
                      />
                      <span className="text-xs text-muted-foreground">{cur}</span>
                    </div>
                  ) : (
                    <MoneyDisplay amount={field === "target" ? target : actual} from={cur} />
                  )}
                </TableCell>
              ))}

              <TableCell className="text-right">
                {target > 0 ? (
                  <PrivateText
                    fallback="••%"
                    className={
                      actual >= target ? "text-emerald-400"
                      : actual === 0 ? "text-muted-foreground"
                      : "text-amber-400"
                    }
                  >
                    {formatPercent(actual / target)}
                  </PrivateText>
                ) : "—"}
              </TableCell>

              <TableCell>
                <Button variant="ghost" onClick={() => remove(r.id)} className="h-10 w-10 p-0" aria-label="Delete row">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="font-semibold">Total</TableCell>
          <TableCell className="text-right font-semibold"><MoneyDisplay amount={totalTarget} from={currency} className="font-semibold" /></TableCell>
          <TableCell className="text-right font-semibold"><MoneyDisplay amount={totalActual} from={currency} className="font-semibold" /></TableCell>
          <TableCell className="text-right font-semibold">
            {totalTarget > 0 ? <PrivateText fallback="••%" className="font-semibold">{formatPercent(totalActual / totalTarget)}</PrivateText> : "—"}
          </TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}
