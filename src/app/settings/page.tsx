import { Cog, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">App configuration and data tools</p>
      </div>

      <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-25 bg-violet-500" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <Cog className="h-5 w-5 text-violet-400" />
            Environment
          </CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-2 text-sm">
          <p>FX endpoint and CMC API key are configured via <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.env</code> (see <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.env.example</code>).</p>
          <p className="text-muted-foreground">Restart the dev server after changing env vars.</p>
        </CardContent>
      </Card>

      <SettingsClient />
    </div>
  );
}
