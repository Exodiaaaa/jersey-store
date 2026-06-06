"use client";

import { categories, products, sizes, teams } from "@/data/catalog";
import { Category, Product, Size, Team } from "@/lib/types";
import { readStorage, writeStorage } from "@/lib/storage";

const PRODUCTS_KEY = "jersey-store.admin-products";
const CATEGORIES_KEY = "jersey-store.admin-categories";
const TEAMS_KEY = "jersey-store.admin-teams";
const SIZES_KEY = "jersey-store.admin-sizes";

export function getAdminProducts() {
  return readStorage<Product[]>(PRODUCTS_KEY, products);
}

export function saveAdminProducts(nextProducts: Product[]) {
  writeStorage(PRODUCTS_KEY, nextProducts);
}

export function getAdminCategories() {
  return readStorage<Category[]>(CATEGORIES_KEY, categories);
}

export function saveAdminCategories(nextCategories: Category[]) {
  writeStorage(CATEGORIES_KEY, nextCategories);
}

export function getAdminTeams() {
  return readStorage<Team[]>(TEAMS_KEY, teams);
}

export function saveAdminTeams(nextTeams: Team[]) {
  writeStorage(TEAMS_KEY, nextTeams);
}

export function getAdminSizes() {
  return readStorage<Size[]>(SIZES_KEY, sizes);
}

export function saveAdminSizes(nextSizes: Size[]) {
  writeStorage(SIZES_KEY, nextSizes);
}
