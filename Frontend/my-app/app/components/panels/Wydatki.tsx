import React from "react";
import {
  getBudget,
  saveBudget,
  calcGlobalBalance,
  type BudgetData,
  type Period,
  type Expense,
  type ExpenseStatus,
  type Category,
} from "../../api/expensesApi";

export function Wydatki() {
  const [data, setData] = React.useState<BudgetData>({
    periods: [],
    expenses: [],
    incomes: [],
  });
  const [selectedPeriodId, setSelectedPeriodId] = React.useState<number | null>(
    null,
  );
  const [selectedExpenseId, setSelectedExpenseId] = React.useState<
    number | null
  >(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const bd = await getBudget();
        setData(bd);
        if (bd.periods.length > 0) {
          const firstPeriod = bd.periods[0];
          setSelectedPeriodId(firstPeriod.id);
          const firstInPeriod = bd.expenses.find(
            (e) => e.periodId === firstPeriod.id,
          );
          setSelectedExpenseId(firstInPeriod?.id ?? null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateAndSave = async (next: BudgetData) => {
    setData(next);
    setSaving(true);
    try {
      await saveBudget(next);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPeriod = async () => {
    const name = window.prompt(
      "Nazwa okresu (np. 'Wydatki w październiku'):",
    );
    if (!name) return;

    const newPeriod: Period = {
      id: Date.now(),
      name,
    };

    const next: BudgetData = {
      ...data,
      periods: [...data.periods, newPeriod],
    };

    await updateAndSave(next);
    setSelectedPeriodId(newPeriod.id);
    setSelectedExpenseId(null);
  };

  const handleAddExpense = async () => {
    if (!selectedPeriodId) {
      alert("Najpierw dodaj i wybierz okres/miesiąc.");
      return;
    }

    const countInPeriod = data.expenses.filter(
      (e) => e.periodId === selectedPeriodId,
    ).length;

    const newExpense: Expense = {
      id: Date.now(),
      periodId: selectedPeriodId,
      title: `Nowy wydatek #${countInPeriod + 1}`,
      amount: 0,
      description: "",
      date: new Date().toISOString().slice(0, 10),
      status: "oplacony",
      category: "rachunki",
    };

    const next: BudgetData = {
      ...data,
      expenses: [...data.expenses, newExpense],
    };

    await updateAndSave(next);
    setSelectedExpenseId(newExpense.id);
  };

  const handleUpdateExpense = async (updated: Expense) => {
    const next: BudgetData = {
      ...data,
      expenses: data.expenses.map((e) =>
        e.id === updated.id ? updated : e,
      ),
    };
    await updateAndSave(next);
  };

  const handleRemoveExpense = async (id: number) => {
    const next: BudgetData = {
      ...data,
      expenses: data.expenses.filter((e) => e.id !== id),
    };
    await updateAndSave(next);
    if (selectedExpenseId === id) {
      const remaining = next.expenses.filter(
        (e) => e.periodId === selectedPeriodId,
      );
      setSelectedExpenseId(remaining[0]?.id ?? null);
    }
  };

  if (loading) {
    return <div className="p-4 text-black">Ładowanie…</div>;
  }

  const periods = data.periods;
  const currentPeriod =
    periods.find((p) => p.id === selectedPeriodId) ?? null;

  const currentExpenses = data.expenses.filter(
    (e) => e.periodId === selectedPeriodId,
  );

  const selectedExpense =
    currentExpenses.find((e) => e.id === selectedExpenseId) ?? null;

  const total = currentExpenses.reduce(
  (s, e) => s + Number(e.amount || 0),
  0,
);
  const byCategory: Record<Category, number> = {
    rachunki: 0,
    zakupy: 0,
    hobby: 0,
    inne: 0,
  };
  currentExpenses.forEach((e) => {
      byCategory[e.category] += Number(e.amount || 0);
    });
  const balance = calcGlobalBalance(data);
  const hasPeriod = !!currentPeriod;

  return (
    <div className="flex h-[486px] p-4 gap-4 text-black">
      <div className="w-[280px] flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm">
          <select
            className="select select-sm bg-slate-100 border border-slate-300 flex-1"
            value={selectedPeriodId ?? ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              if (!id) {
                setSelectedPeriodId(null);
                setSelectedExpenseId(null);
                return;
              }
              setSelectedPeriodId(id);
              const firstInPeriod = data.expenses.find(
                (exp) => exp.periodId === id,
              );
              setSelectedExpenseId(firstInPeriod?.id ?? null);
            }}
          >
            <option value="">(brak / wybierz okres)</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleAddPeriod}
            className="btn btn-xs normal-case border border-slate-300 bg-slate-100"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAddExpense}
          disabled={!hasPeriod}
          className="w-full h-10 rounded-full bg-slate-100 shadow-md flex items-center justify-between px-4 text-sm hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Dodaj nowy wydatek</span>
          <span className="text-xl font-bold">+</span>
        </button>

        <div className="flex-1 mt-1 flex flex-col gap-2 overflow-y-auto">
          {currentExpenses.length === 0 && (
            <div className="text-xs text-center mt-4">
              Brak wydatków w tym okresie.
            </div>
          )}

          {currentExpenses.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedExpenseId(e.id)}
              className={`w-full text-left rounded-xl px-4 py-2 border shadow-sm text-sm transition ${
                selectedExpenseId === e.id
                  ? "bg-emerald-200 border-emerald-400"
                  : "bg-slate-100 border-slate-300"
              }`}
            >
              <div className="font-semibold truncate">{e.title}</div>
              <div className="flex justify-between text-xs mt-1">
                <span>{e.date}</span>
                <span>{e.amount.toFixed(2)} zł</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <div className="bg-[#f0f0f0] rounded-2xl shadow-md p-3 flex gap-4">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-sm">
                Suma wydatków {currentPeriod ? `– ${currentPeriod.name}` : ""}
              </span>
              <span className="font-semibold text-sm">
                {total.toFixed(2)} zł
              </span>
            </div>
            <div className="text-xs space-y-1 mt-2">
              <RowDot
                label="Rachunki"
                color="bg-emerald-400"
                value={byCategory.rachunki}
              />
              <RowDot
                label="Zakupy"
                color="bg-lime-400"
                value={byCategory.zakupy}
              />
              <RowDot
                label="Hobby"
                color="bg-orange-400"
                value={byCategory.hobby}
              />
              <RowDot
                label="Inne"
                color="bg-red-400"
                value={byCategory.inne}
              />
            </div>
          </div>

          <div className="w-[180px] flex flex-col justify-between text-xs">
            <div>
              <div className="mb-1">Saldo konta:</div>
              <div className="font-semibold text-sm">
                {balance.toFixed(2)} zł
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1">Dodane zdjęcia:</div>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-md bg-slate-300"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          {selectedExpense ? (
            <ExpenseDetails
              expense={selectedExpense}
              onChange={handleUpdateExpense}
              onRemove={handleRemoveExpense}
              saving={saving}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-sm">
              Wybierz wydatek z listy lub dodaj nowy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RowDot({
  label,
  color,
  value,
}: {
  label: string;
  color: string;
  value: number;
}) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <span>{label}</span>
      </div>
      <span>{value.toFixed(2)} zł</span>
    </div>
  );
}

type ExpenseDetailsProps = {
  expense: Expense;
  onChange: (exp: Expense) => Promise<void> | void;
  onRemove: (id: number) => Promise<void> | void;
  saving: boolean;
};

function ExpenseDetails({
  expense,
  onChange,
  onRemove,
  saving,
}: ExpenseDetailsProps) {
  const handleField =
    (field: keyof Expense) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      const value =
        field === "amount" ? Number(e.target.value) : e.target.value;
      onChange({ ...expense, [field]: value as any });
    };

  const setStatus = (status: ExpenseStatus) =>
    onChange({ ...expense, status });

  const setCategory = (category: Category) =>
    onChange({ ...expense, category });

  return (
    <div className="bg-[#f5f5f5] text-black rounded-2xl shadow-xl p-4 h-full flex flex-col">
      <div className="flex gap-2 mb-3">
        {[
          { key: "rachunki", label: "Rachunki", dot: "bg-emerald-400" },
          { key: "zakupy", label: "Zakupy", dot: "bg-lime-400" },
          { key: "hobby", label: "Hobby", dot: "bg-orange-400" },
          { key: "inne", label: "Inne", dot: "bg-red-400" },
        ].map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategory(cat.key as Category)}
            className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 border ${
              expense.category === cat.key
                ? "bg-white border-slate-400"
                : "bg-slate-200 border-slate-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${cat.dot}`} />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 text-xs mb-2">
        <span>Tytuł</span>
        <span className="text-right">Data</span>
      </div>

      <div className="flex gap-2 mb-2">
        <input
          className="input input-sm bg-white border border-slate-300 text-sm flex-1"
          value={expense.title}
          onChange={handleField("title")}
        />
        <input
          type="date"
          className="input input-sm bg-white border border-slate-300 text-sm w-[150px]"
          value={expense.date}
          onChange={handleField("date")}
        />
      </div>

      <div className="grid grid-cols-2 text-xs mb-1">
        <span>Kwota</span>
        <span>Opis</span>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="number"
          className="input input-sm bg-white border border-slate-300 text-sm w-[150px]"
          value={expense.amount}
          onChange={handleField("amount")}
        />
        <textarea
          className="textarea textarea-sm bg-white border border-slate-300 text-sm flex-1 resize-none"
          rows={2}
          value={expense.description}
          onChange={handleField("description")}
        />
      </div>

      <div className="mt-auto flex items-center justify-between">
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            onClick={() => setStatus("oplacony")}
            className={`px-3 py-1 rounded-full border flex items-center gap-1 ${
              expense.status === "oplacony"
                ? "bg-emerald-200 border-emerald-400"
                : "bg-slate-200 border-slate-400"
            }`}
          >
            ✓ Opłacony
          </button>
          <button
            type="button"
            onClick={() => setStatus("zaplanowany")}
            className={`px-3 py-1 rounded-full border flex items-center gap-1 ${
              expense.status === "zaplanowany"
                ? "bg-emerald-200 border-emerald-400"
                : "bg-slate-200 border-slate-400"
            }`}
          >
            ⏱ Zaplanowany
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => onRemove(expense.id)}
            className="btn btn-sm btn-ghost text-black"
          >
            Usuń
          </button>
          <button
            type="button"
            disabled={saving}
            className="btn btn-sm bg-emerald-300 border border-emerald-500 text-black"
          >
            {saving ? "Zapisywanie..." : "Zapisz"}
          </button>
        </div>
      </div>
    </div>
  );
}
