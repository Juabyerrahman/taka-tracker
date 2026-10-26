
import Dexie, { type Table } from "dexie";

export interface Expense {
  id?: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  createdAt: number;
}

class ExpenseDatabase extends Dexie {
  expenses!: Table<Expense, number>;

  constructor() {
    super("TakaTracker");

    this.version(1).stores({
      expenses: "++id, date, category",
    });
  }
}

export const db = new ExpenseDatabase();
