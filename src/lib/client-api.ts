"use client";

import {
  CartItem,
  Category,
  Customer,
  DashboardStats,
  Order,
  OrderStatus,
  Product,
  ProductReview,
  ProductReviewInput,
  Team,
} from "@/lib/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status} on ${url}`);
  }

  return response.json() as Promise<T>;
}

export const clientApi = {
  getProducts() {
    return request<Product[]>("/api/products");
  },
  getProduct(id: string) {
    return request<Product>(`/api/products/${id}`);
  },
  getProductBySlug(slug: string) {
    return request<Product>(`/api/products/slug/${slug}`);
  },
  createProduct(product: Product) {
    return request<Product>("/api/products", {
      body: JSON.stringify(product),
      method: "POST",
    });
  },
  updateProduct(product: Product) {
    return request<Product>(`/api/products/${product.id}`, {
      body: JSON.stringify(product),
      method: "PUT",
    });
  },
  deleteProduct(id: string) {
    return request<{ ok: true }>(`/api/products/${id}`, {
      method: "DELETE",
    });
  },
  getProductReviews(productId: string) {
    return request<ProductReview[]>(`/api/products/${productId}/reviews`);
  },
  createProductReview(productId: string, review: ProductReviewInput) {
    return request<ProductReview>(`/api/products/${productId}/reviews`, {
      body: JSON.stringify(review),
      method: "POST",
    });
  },
  getCategories() {
    return request<Category[]>("/api/categories");
  },
  createCategory(category: Category) {
    return request<Category>("/api/categories", {
      body: JSON.stringify(category),
      method: "POST",
    });
  },
  updateCategory(category: Category) {
    return request<Category>(`/api/categories/${category.id}`, {
      body: JSON.stringify(category),
      method: "PUT",
    });
  },
  deleteCategory(id: string) {
    return request<{ ok: true }>(`/api/categories/${id}`, {
      method: "DELETE",
    });
  },
  getTeams() {
    return request<Team[]>("/api/teams");
  },
  createTeam(team: Team) {
    return request<Team>("/api/teams", {
      body: JSON.stringify(team),
      method: "POST",
    });
  },
  updateTeam(team: Team) {
    return request<Team>(`/api/teams/${team.id}`, {
      body: JSON.stringify(team),
      method: "PUT",
    });
  },
  deleteTeam(id: string) {
    return request<{ ok: true }>(`/api/teams/${id}`, {
      method: "DELETE",
    });
  },
  getOrders() {
    return request<Order[]>("/api/orders");
  },
  getOrder(id: string) {
    return request<Order>(`/api/orders/${id}`);
  },
  createOrder(items: CartItem[], customer: Customer) {
    return request<Order>("/api/orders", {
      body: JSON.stringify({ items, customer }),
      method: "POST",
    });
  },
  updateOrderStatus(id: string, status: OrderStatus) {
    return request<Order>(`/api/orders/${id}/status`, {
      body: JSON.stringify({ status }),
      method: "PATCH",
    });
  },
  getDashboardStats() {
    return request<DashboardStats>("/api/dashboard");
  },
};
