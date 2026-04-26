"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import {
  getAgentProfile,
  upsertAgentProfile,
  emptyAgentProfile,
  type AgentProfile,
} from "@/lib/firestore";

/**
 * Loads the current user's agent profile from Firestore (agentProfiles/{uid}).
 * Returns an empty profile (in-memory only) if none exists yet, plus a `save` fn.
 *
 * Used by the CMA page, settings page, and any UI that needs to brand output
 * with the agent's contact + agency details.
 */
export function useAgentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getAgentProfile(user.uid)
      .then((p) => {
        if (cancelled) return;
        setProfile(
          p ?? emptyAgentProfile(user.uid, user.email ?? "", user.displayName ?? "")
        );
      })
      .catch((e) => {
        console.error("[useAgentProfile] load failed", e);
        if (!cancelled) {
          setProfile(emptyAgentProfile(user.uid, user.email ?? "", user.displayName ?? ""));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  const save = useCallback(
    async (patch: Partial<AgentProfile>): Promise<void> => {
      if (!user) throw new Error("Not signed in");
      setSaving(true);
      try {
        await upsertAgentProfile(user.uid, patch);
        // Optimistic local update
        setProfile((prev) =>
          prev
            ? { ...prev, ...patch, uid: user.uid }
            : { ...emptyAgentProfile(user.uid, user.email ?? "", user.displayName ?? ""), ...patch }
        );
      } finally {
        setSaving(false);
      }
    },
    [user]
  );

  return { profile, loading, saving, save };
}
