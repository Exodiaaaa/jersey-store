"use client";

async function adminRequest(url: string, body?: unknown) {
  return fetch(url, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function loginAdmin(email: string, password: string) {
  return adminRequest("/api/admin/login", { email, password });
}

export function logoutAdmin() {
  return adminRequest("/api/admin/logout");
}
