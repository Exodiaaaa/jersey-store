"use client";

import { removeStorage, writeStorage } from "@/lib/storage";

export const adminSessionKey = "jersey-store.admin-session";

export const adminCredentials = {
  email: "admin@kvnfootwear.ma",
  password: "admin123",
};

export function loginAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const isValid = normalizedEmail === adminCredentials.email && password.trim() === adminCredentials.password;

  if (isValid) {
    writeStorage(adminSessionKey, {
      email: normalizedEmail,
      loggedAt: new Date().toISOString(),
    });
  }

  return isValid;
}

export function logoutAdmin() {
  removeStorage(adminSessionKey);
}
