import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { mockAuth, ROLE_LABEL, type AppRole, type MockUser } from "@/lib/mock-backend-mobile";

export type { AppRole };
export { ROLE_LABEL };

export interface Profile extends Omit<MockUser, "password"> {
  full_name: string;
  avatar_url?: string | null;
}

interface AuthCtx {
  user: { id: string; email: string; name: string } | null;
  profile: Profile | null;
  primaryRole: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

function toProfile(u: MockUser): Profile {
  const { password, ...rest } = u;
  return { ...rest, full_name: u.name, avatar_url: u.avatar ?? null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthCtx["user"]>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    try {
      const me = await mockAuth.getCurrent();
      if (me) {
        setUser({ id: me.id, email: me.email, name: me.name });
        setProfile(toProfile(me));
      } else {
        setUser(null);
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { hydrate(); }, [hydrate]);

  const signOut = async () => {
    await mockAuth.signOut();
    setUser(null);
    setProfile(null);
  };

  const primaryRole: AppRole | null = (profile?.role as AppRole) ?? null;

  return (
    <Ctx.Provider value={{ user, profile, primaryRole, loading, signOut, refresh: hydrate }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
