"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { FakeUser } from "@/lib/auth";
import { getStoredUser, setStoredUser, clearStoredUser } from "@/lib/auth";

interface UserContextValue {
  user: FakeUser | null;
  login: (user: FakeUser | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FakeUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const login = (u: FakeUser | null) => {
    setUser(u);
    setStoredUser(u);
  };

  const logout = () => {
    setUser(null);
    clearStoredUser();
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
