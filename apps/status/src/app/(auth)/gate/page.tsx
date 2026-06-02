"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useAnimationControls } from "framer-motion";
import { Loader2, LockKeyhole } from "lucide-react";
import { AuroraBackground } from "@/components/effects/aurora-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function GatePage() {
  return (
    <React.Suspense fallback={<AuroraBackground>{null}</AuroraBackground>}>
      <GateForm />
    </React.Suspense>
  );
}

function GateForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [errored, setErrored] = React.useState(false);
  const controls = useAnimationControls();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setErrored(false);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setErrored(true);
        controls.start({
          x: [0, -8, 8, -6, 6, -3, 3, 0],
          transition: { duration: 0.4, ease: "easeInOut" },
        });
        return;
      }
      const from = params.get("from") || "/";
      router.replace(from);
      router.refresh();
    } catch {
      setErrored(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-16"
      >
        <motion.div
          animate={controls}
          className={cn(
            "glass w-full rounded-lg border border-border p-8",
            "shadow-[0_20px_80px_-20px_hsl(var(--background)/1)]",
          )}
        >
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
              <LockKeyhole className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-medium">Project Aurora</h1>
            <p className="text-xs text-muted-foreground">
              Enter access password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errored) setErrored(false);
              }}
              autoFocus
              autoComplete="current-password"
              placeholder="Password"
              className={cn(
                "h-10",
                errored && "border-negative focus-visible:ring-negative",
              )}
              aria-invalid={errored || undefined}
              aria-label="Access password"
              required
            />
            <Button type="submit" disabled={pending || password.length === 0} className="h-10">
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Enter"
              )}
            </Button>
            {errored && (
              <p className="text-xs text-negative" role="alert">
                Incorrect password. Try again.
              </p>
            )}
          </form>
        </motion.div>
      </motion.div>
    </AuroraBackground>
  );
}
