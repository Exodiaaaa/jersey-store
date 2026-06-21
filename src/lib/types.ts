export type ProductCategoryId = string;

export type ProductType = "jersey" | "pack";

export type Size = "S" | "M" | "L" | "XL" | "XXL" | "XXXL";

export type OrderStatus =
  | "new"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export type FlockingMode = "none" | "custom" | "player";

export type Team = {
  id: string;
  name: string;
  league: string;
  country: string;
  accent: string;
};

export type Category = {
  id: ProductCategoryId;
  name: string;
  description: string;
};

export type StockBySize = Record<Size, number>;

export type ProductVisual = {
  primary: string;
  secondary: string;
  trim: string;
  pattern: "diagonal" | "stripes" | "halves" | "clean" | "racing";
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  teamId: string;
  teamName?: string;
  teamLeague?: string;
  categoryId: ProductCategoryId;
  categoryName?: string;
  basePrice: number;
  packPrice: number;
  originalBasePrice?: number;
  originalPackPrice?: number;
  hasJersey?: boolean;
  hasPack?: boolean;
  flockingPrice: number;
  description: string;
  sizes: Size[];
  stock: StockBySize;
  images: string[];
  visual: ProductVisual;
  isNew: boolean;
  isPopular: boolean;
  allowFlocking: boolean;
  createdAt: string;
};

export type HomeSection = {
  id: string;
  title: string;
  subtitle?: string;
  isActive: boolean;
  sortOrder: number;
  productIds: string[];
  products: Product[];
  createdAt: string;
};

export type HomeSectionInput = {
  id?: string;
  title: string;
  subtitle?: string;
  isActive: boolean;
  sortOrder: number;
  productIds: string[];
};

export type ProductReview = {
  id: number;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ProductReviewInput = {
  customerName: string;
  rating: number;
  comment: string;
};

export type Flocking = {
  mode: FlockingMode;
  name?: string;
  number?: string;
  player?: string;
  note?: string;
};

export type CartItem = {
  id: string;
  productId: string;
  productName: string;
  teamName: string;
  size: Size;
  type: ProductType;
  quantity: number;
  unitPrice: number;
  flocking: Flocking;
  visual: ProductVisual;
  image?: string;
};

export type Customer = {
  fullName: string;
  phone: string;
  city: string;
  address: string;
};

export type OrderItem = CartItem & {
  lineTotal: number;
};

export type Order = {
  id: string;
  reference: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  whatsappMessage: string;
};

export type DashboardStats = {
  orderCount: number;
  estimatedRevenue: number;
  topProducts: Array<{ name: string; quantity: number }>;
  recentOrders: Order[];
};
