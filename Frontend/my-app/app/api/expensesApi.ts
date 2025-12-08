// app/api/expensesApi.ts

export type ExpenseStatus = "oplacony" | "zaplanowany";
export type Category = "rachunki" | "zakupy" | "hobby" | "inne";

export type Period = {
  id: number;
  name: string; // np. "Wydatki w październiku"
};

export type Expense = {
  id: number;
  periodId: number;
  title: string;
  amount: number;
  description: string;
  date: string;
  status: ExpenseStatus;
  category: Category;
};

// ---- PRZYCHODY ----

export type IncomeCategory = "praca" | "social" | "dodatkowy" | "inne";

export type Income = {
  id: number;
  periodId: number;
  title: string;
  amount: number;
  description: string;
  date: string;
  category: IncomeCategory;
};

// ---- CAŁY BUDŻET ----

export type BudgetData = {
  periods: Period[];
  expenses: Expense[];
  incomes: Income[];
};

const STORAGE_KEY = "mock_budget_v1";

async function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// normalizacja danych (żeby zawsze były tablice)
function normalize(raw: any): BudgetData {
  return {
    periods: Array.isArray(raw?.periods) ? raw.periods : [],
    expenses: Array.isArray(raw?.expenses) ? raw.expenses : [],
    incomes: Array.isArray(raw?.incomes) ? raw.incomes : [],
  };
}

// POBIERANIE – najpierw z localStorage, jak pusto to z JSON-a
export async function getBudget(): Promise<BudgetData> {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return normalize(JSON.parse(stored));
    }
  }

  const res = await fetch("/data/expense.json");
  if (!res.ok) {
    throw new Error("Nie udało się pobrać expense.json");
  }

  const data = normalize(await res.json());

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  return data;
}

// ZAPIS – pseudo-backend
export async function saveBudget(data: BudgetData): Promise<void> {
  const normalized = normalize(data);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }
  await delay(150);
}

// GLOBALNE SALDO KONTA: przychody - wydatki
export function calcGlobalBalance(data: BudgetData): number {
  const totalIncome = data.incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = data.expenses.reduce((s, e) => s + e.amount, 0);
  return totalIncome - totalExpense;
}
