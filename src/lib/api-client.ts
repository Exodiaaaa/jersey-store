import { products, teams, categories, sizes } from "@/data/catalog";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

export const catalogApi = {
  async getProducts() {
    if (!apiBaseUrl) return products;
    const response = await fetch(`${apiBaseUrl}/products`, { cache: "no-store" });
    return response.json();
  },
  async getTeams() {
    if (!apiBaseUrl) return teams;
    const response = await fetch(`${apiBaseUrl}/teams`, { cache: "no-store" });
    return response.json();
  },
  async getCategories() {
    if (!apiBaseUrl) return categories;
    const response = await fetch(`${apiBaseUrl}/categories`, { cache: "no-store" });
    return response.json();
  },
  async getSizes() {
    if (!apiBaseUrl) return sizes;
    const response = await fetch(`${apiBaseUrl}/sizes`, { cache: "no-store" });
    return response.json();
  },
};
