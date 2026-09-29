import type { Transaction, TransactionInput } from "@/lib/types";

/**
 * The UI only knows this interface. To move to the ASP.NET Core API (/api/transactions),
 * write an `ApiTransactionRepository` and pass it to the store instead.
 */
export interface TransactionRepository {
  list(): Promise<Transaction[]>;
  create(input: TransactionInput): Promise<Transaction>;
  update(id: string, input: Partial<Transaction>): Promise<Transaction>;
  remove(id: string): Promise<void>;
}
