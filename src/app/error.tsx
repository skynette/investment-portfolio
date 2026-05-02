"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <pre className="max-w-full whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">{error.message}</pre>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
