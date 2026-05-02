"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportCryptoCsv } from "@/server/actions/export";

export function CryptoExportButton() {
  const onClick = async () => {
    const csv = await exportCryptoCsv();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crypto-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return <Button variant="outline" onClick={onClick}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>;
}
