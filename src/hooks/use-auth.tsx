import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { account, databases, APPWRITE, ID, type AppRole, ROLE_LABEL } from "@/integrations/appwrite/client";

export type { AppRole };
export { ROLE_LABEL };

export interface AppwriteUser {
  $id: string;
  email: string;
  name: string;
}

export interface Profile {
  $id: string;
  userId: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  bio: string | null;
  date_of_birth: string | null;
  emergency_contact: string | null;
  grade: string | null;
  class_name: string | null;
  department: string | null;
  subjects: string[] | null;
  graduation_year: number | null;
  linked_children: string[] | null;
  role: AppRole;
}

interface AuthCtx {
  user: AppwriteUser | null;
  profile: Profile | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

async function loadOrCreateProfile(userId: string, email: string, name: string): Promise<Profile | null> {
  try {
    const doc = await databases.getDocument(APPWRITE.databaseId, APPWRITE.collections.profiles, userId);
    return doc as unknown as Profile;
  } catch {
    try {
      const created = await databases.createDocument(
        APPWRITE.databaseId,
        APPWRITE.collections.profiles,
        userId,
        {
          userId,
          email,
          full_name: name || email,
          role: "alumni",
        }
      );
      return created as unknown as Profile;
    } catch (e) {
      console.error("[Appwrite] could not create profile — collection may not exist yet:", e);
      return null;
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = async () => {
    try {
      const me = await account.get();
      const u: AppwriteUser = { $id: me.$id, email: me.email, name: me.name };
      setUser(u);
      const p = await loadOrCreateProfile(u.$id, u.email, u.name);
      setProfile(p);
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { hydrate(); }, []);

  const signOut = async () => {
    try { await account.deleteSession("current"); } catch {}
    setUser(null);
    setProfile(null);
  };

  const refresh = async () => { await hydrate(); };

  const primaryRole: AppRole | null = profile?.role ?? null;
  const roles: AppRole[] = primaryRole ? [primaryRole] : [];

  return (
    <Ctx.Provider value={{ user, profile, roles, primaryRole, loading, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}