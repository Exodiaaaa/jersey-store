import { compare, hash } from "bcryptjs";

export const adminPasswordMinLength = 12;
export const adminPasswordMaxLength = 72;

export function validateAdminPassword(password: string) {
  if (password.length < adminPasswordMinLength) {
    return `Le mot de passe doit contenir au moins ${adminPasswordMinLength} caracteres.`;
  }

  if (password.length > adminPasswordMaxLength) {
    return `Le mot de passe ne doit pas depasser ${adminPasswordMaxLength} caracteres.`;
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
  }

  return null;
}

export function hashAdminPassword(password: string) {
  return hash(password, 12);
}

export function verifyAdminPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}
