"use client";

import { useState, useTransition, useMemo } from "react";
import { Trash2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MoneyDisplay } from "@/components/dashboard/MoneyDisplay";
import { deleteTransaction } from "@/server/actions/transactions";
import type { TxRow } from "./CryptoClient";

export function TransactionTable({ transactions }: { transactions: TxRow[] }) {
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<string>("all");

  const symbols = useMemo(() => {
    const set = new Set(transactions.map((t) => t.symbol));
    return Array.from(set).sort();
  }, [transactions]);

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.symbol === filter);

  const remove = (id: number) => {
    if (!confirm("Delete this transaction?")) return;
    startTransition(async () => {
      await deleteTransaction(id);
      toast.success("Deleted");
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All coins</SelectItem>
            {symbols.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} transactions</span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Coin</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total USD</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                  No transactions yet.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{new Date(t.occurredAt).toLocaleString()}</TableCell>
                <TableCell>{t.symbol}</TableCell>
                <TableCell><span className="capitalize">{t.type}</span></TableCell>
                <TableCell className="text-right">{t.amount.toLocaleString("en-US", { maximumFractionDigits: 6 })}</TableCell>
                <TableCell className="text-right">{t.pricePerUnit === null ? "—" : <MoneyDisplay amount={t.pricePerUnit} from="USD" />}</TableCell>
                <TableCell className="text-right">{t.totalUsd === null ? "—" : <MoneyDisplay amount={t.totalUsd} from="USD" />}</TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
