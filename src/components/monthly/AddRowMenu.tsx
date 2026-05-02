"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { addMonthlyEntry } from "@/server/actions/monthly";

export function AddRowMenu({
  year, month, options,
}: {
  year: number;
  month: number;
  options: { id: number; name: string; defaultTarget: number }[];
}) {
  const [, startTransition] = useTransition();

  if (options.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <Plus className="mr-2 h-4 w-4" /> Add row
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => {
              startTransition(async () => {
                await addMonthlyEntry({
                  categoryId: c.id, year, month, target: c.defaultTarget,
                });
                toast.success(`Added ${c.name}`);
              });
            }}
          >
            {c.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
