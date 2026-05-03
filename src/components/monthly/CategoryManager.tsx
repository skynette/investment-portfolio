"use client";

import { useState, useTransition } from "react";
import { Settings, Plus, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  createCategory, updateCategory, deleteCategory,
} from "@/server/actions/categories";

type Category = {
  id: number;
  name: string;
  currency: string;
  defaultMonthlyTarget: number;
  isActive: boolean;
};

export function CategoryManager({
  categories,
  currentMonth,
}: {
  categories: Category[];
  currentMonth: { year: number; month: number };
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("0");

  const handleCreate = () => {
    if (!newName.trim()) return toast.error("Name required");
    startTransition(async () => {
      await createCategory({
        name: newName,
        defaultMonthlyTarget: Number(newTarget) || 0,
        addToMonth: currentMonth,
      });
      toast.success(`Created and added to this month`);
      setNewName("");
      setNewTarget("0");
    });
  };

  const handleUpdate = (id: number, patch: Partial<Category>) => {
    startTransition(async () => {
      await updateCategory(id, patch);
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete category and all its monthly entries?")) return;
    startTransition(async () => {
      await deleteCategory(id);
      toast.success("Deleted");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Settings className="mr-2 h-4 w-4" /> Manage categories
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">No categories yet. Add one below.</p>
          )}
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <Input
                defaultValue={c.name}
                onBlur={(e) =>
                  e.target.value !== c.name && handleUpdate(c.id, { name: e.target.value })
                }
                className="flex-1"
              />
              <Input
                type="number"
                defaultValue={c.defaultMonthlyTarget}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== c.defaultMonthlyTarget) handleUpdate(c.id, { defaultMonthlyTarget: v });
                }}
                className="w-32"
              />
              <Button
                variant={c.isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleUpdate(c.id, { isActive: !c.isActive })}
              >
                {c.isActive ? "Active" : "Inactive"}
              </Button>
              <Button variant="ghost" onClick={() => handleDelete(c.id)} className="h-10 w-10 p-0" aria-label="Delete category">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t pt-4">
          <Label>Add new category</Label>
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name (e.g. US Stocks)"
              className="flex-1"
            />
            <Input
              type="number"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder="Default target"
              className="w-32"
            />
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
