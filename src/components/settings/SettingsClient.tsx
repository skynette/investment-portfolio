"use client";

import { useTransition } from "react";
import { AlertTriangle, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { wipeDatabase } from "@/server/actions/settings";

export function SettingsClient() {
  const [pending, startTransition] = useTransition();

  const wipe = () => {
    if (!confirm("This deletes ALL data. Continue?")) return;
    if (!confirm("Are you absolutely sure? This cannot be undone.")) return;
    startTransition(async () => {
      await wipeDatabase();
      toast.success("Database wiped");
    });
  };

  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-25 bg-rose-500" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
          Danger zone
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-3">
        <p className="text-sm text-muted-foreground">
          Permanently delete all categories, monthly entries, crypto assets, and transactions.
          The database itself is preserved — only its contents are wiped.
        </p>
        <Button variant="destructive" onClick={wipe} disabled={pending}>
          <Database className="mr-2 h-4 w-4" />
          Wipe database
        </Button>
      </CardContent>
    </Card>
  );
}
