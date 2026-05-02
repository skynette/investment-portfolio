"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createTransaction } from "@/server/actions/transactions";
import { upsertAsset } from "@/server/actions/assets";

export function AddTransactionDialog({ assets }: { assets: { id: number; symbol: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [form, setForm] = useState({
    assetId: "",
    newSymbol: "",
    newName: "",
    type: "buy",
    occurredAt: new Date().toISOString().slice(0, 16),
    pricePerUnit: "",
    amount: "",
    totalUsd: "",
    note: "",
  });

  const submit = () => {
    startTransition(async () => {
      let assetId: number;
      if (form.assetId === "__new__") {
        if (!form.newSymbol.trim()) {
          toast.error("Symbol required");
          return;
        }
        const a = await upsertAsset({
          symbol: form.newSymbol,
          name: form.newName || form.newSymbol,
        });
        assetId = a.id;
      } else if (form.assetId) {
        assetId = Number(form.assetId);
      } else {
        toast.error("Pick an asset");
        return;
      }

      const amount = Number(form.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("Amount required");
        return;
      }

      await createTransaction({
        assetId,
        occurredAt: new Date(form.occurredAt),
        type: form.type as "buy" | "sell" | "transferIn" | "transferOut",
        pricePerUnit: form.pricePerUnit ? Number(form.pricePerUnit) : null,
        amount,
        totalUsd: form.totalUsd ? Number(form.totalUsd) : null,
        fee: null,
        feeCurrency: null,
        note: form.note || null,
      });

      toast.success("Added");
      setOpen(false);
      setForm((f) => ({
        ...f, newSymbol: "", newName: "",
        occurredAt: new Date().toISOString().slice(0, 16),
        pricePerUnit: "", amount: "", totalUsd: "", note: "",
      }));
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Add transaction
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add transaction</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Asset</Label>
            <Select value={form.assetId} onValueChange={(v) => setForm({ ...form, assetId: v ?? "" })}>
              <SelectTrigger><SelectValue placeholder="Pick or create..." /></SelectTrigger>
              <SelectContent>
                {assets.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.symbol} — {a.name}</SelectItem>)}
                <SelectItem value="__new__">+ New asset</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.assetId === "__new__" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Symbol</Label>
                <Input value={form.newSymbol} onChange={(e) => setForm({ ...form, newSymbol: e.target.value })} placeholder="SOL" />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={form.newName} onChange={(e) => setForm({ ...form, newName: e.target.value })} placeholder="Solana" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v ?? "buy" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                  <SelectItem value="transferIn">Transfer in</SelectItem>
                  <SelectItem value="transferOut">Transfer out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="datetime-local" value={form.occurredAt} onChange={(e) => setForm({ ...form, occurredAt: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Amount</Label>
              <Input type="number" step="any" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label>Price/unit (USD)</Label>
              <Input type="number" step="any" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} />
            </div>
            <div>
              <Label>Total (USD)</Label>
              <Input type="number" step="any" value={form.totalUsd} onChange={(e) => setForm({ ...form, totalUsd: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Note</Label>
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>

          <Button className="w-full" onClick={submit}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
