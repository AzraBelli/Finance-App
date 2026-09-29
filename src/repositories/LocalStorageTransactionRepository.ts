import type { Transaction, TransactionInput } from "@/lib/types";
import type { TransactionRepository } from "./TransactionRepository";

export const TRANSACTIONS_STORAGE_KEY = "finance-transactions";

/** Keys from an earlier build that held sample data; cleared once on first run. */
const LEGACY_KEYS = ["finans-transactions", "finans-settings"];

interface StoredData {
  version: 1;
  transactions: Transaction[];
}

export class LocalStorageTransactionRepository implements TransactionRepository {
  private readonly storage: Storage;
  private readonly key: string;

  constructor(storage: Storage = window.localStorage, key: string = TRANSACTIONS_STORAGE_KEY) {
    this.storage = storage;
    this.key = key;
    for (const legacy of LEGACY_KEYS) this.storage.removeItem(legacy);
  }

  async list(): Promise<Transaction[]> {
    return this.read();
  }

  async create(input: TransactionInput): Promise<Transaction> {
    const transaction: Transaction = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.write([transaction, ...this.read()]);
    return transaction;
  }

  async update(id: string, input: Partial<Transaction>): Promise<Transaction> {
    const all = this.read();
    const index = all.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Transaction not found: ${id}`);
    const updated: Transaction = { ...all[index], ...input, id, createdAt: all[index].createdAt };
    all[index] = updated;
    this.write(all);
    return updated;
  }

  async remove(id: string): Promise<void> {
    this.write(this.read().filter((t) => t.id !== id));
  }

  private read(): Transaction[] {
    const raw = this.storage.getItem(this.key);
    if (raw === null) return [];
    try {
      const parsed = JSON.parse(raw) as Partial<StoredData>;
      return Array.isArray(parsed.transactions) ? parsed.transactions : [];
    } catch {
      return [];
    }
  }

  private write(transactions: Transaction[]) {
    const data: StoredData = { version: 1, transactions };
    this.storage.setItem(this.key, JSON.stringify(data));
  }
}
