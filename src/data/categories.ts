import type { Category, TransactionType } from "@/lib/types";

export const CATEGORIES: Category[] = [
  // Expense
  { id: "rent", name: "Rent", type: "expense", color: "#3C5A99", icon: "house" },
  { id: "groceries", name: "Groceries", type: "expense", color: "#D9A441", icon: "shopping-cart" },
  { id: "bills", name: "Bills", type: "expense", color: "#4A9BB0", icon: "receipt" },
  { id: "transport", name: "Transport", type: "expense", color: "#5F6B73", icon: "bus" },
  { id: "dining", name: "Dining", type: "expense", color: "#C4533A", icon: "utensils-crossed" },
  { id: "fun", name: "Entertainment", type: "expense", color: "#7B5EA7", icon: "popcorn" },
  { id: "health", name: "Health", type: "expense", color: "#2E7D5B", icon: "heart-pulse" },
  { id: "shopping", name: "Shopping", type: "expense", color: "#B5657E", icon: "shopping-bag" },
  // Income
  { id: "salary", name: "Salary", type: "income", color: "#2E7D5B", icon: "briefcase-business" },
  { id: "freelance", name: "Freelance", type: "income", color: "#3C5A99", icon: "laptop" },
  { id: "investment", name: "Investment", type: "income", color: "#D9A441", icon: "trending-up" },
  { id: "other-income", name: "Other", type: "income", color: "#8A8F5C", icon: "coins" },
];

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);

export function categoriesOfType(type: TransactionType): Category[] {
  return CATEGORIES.filter((c) => c.type === type);
}
