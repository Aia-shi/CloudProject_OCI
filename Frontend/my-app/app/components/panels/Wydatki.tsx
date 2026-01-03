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

  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(
    null,
  );
  const [isNew, setIsNew] = React.useState(false);
  const [periodListOpen, setPeriodListOpen] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const bd = await getBudget();
        setData(bd);
        if (bd.periods.length > 0) {
          setSelectedPeriodId(bd.periods[0].id);
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

  // ---------- OKRESY ----------

  const handleAddPeriod = async () => {
    const name = window.prompt(
      "Nazwa okresu (np. 'Wydatki w październiku'):",
    );
    if (!name) return;

    const newPeriod: Period = { id: Date.now(), name };

    const next: BudgetData = {
      ...data,
      periods: [...data.periods, newPeriod],
    };
    await updateAndSave(next);

    setSelectedPeriodId(newPeriod.id);
    setSelectedExpenseId(null);
    setEditingExpense(null);
    setIsNew(false);
    setPeriodListOpen(false);
  };

  const handleRemovePeriod = async (id: number) => {
    if (
      !window.confirm(
        "Usunąć ten okres razem z jego wydatkami i przychodami?",
      )
    )
      return;

    const next: BudgetData = {
      ...data,
      periods: data.periods.filter((p) => p.id !== id),
      expenses: data.expenses.filter((e) => e.periodId !== id),
      incomes: data.incomes.filter((i) => i.periodId !== id),
    };
    await updateAndSave(next);

    if (selectedPeriodId === id) {
      const first = next.periods[0];
      setSelectedPeriodId(first?.id ?? null);
      setSelectedExpenseId(null);
      setEditingExpense(null);
      setIsNew(false);
    }
  };

  // ---------- WYDATKI ----------

  const handleStartNewExpense = () => {
    if (!selectedPeriodId) {
      alert("Najpierw dodaj / wybierz okres.");
      return;
    }

    const draft: Expense = {
      id: Date.now(),
      periodId: selectedPeriodId,
      title: "",
      amount: 0,
      description: "",
      date: new Date().toISOString().slice(0, 10),
      status: "oplacony",
      category: "rachunki",
    };

    setEditingExpense(draft);
    setIsNew(true);
    setSelectedExpenseId(null);
  };

  const handleEditExistingExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setIsNew(false);
    setSelectedExpenseId(exp.id);
  };

  const handleSaveExpense = async (exp: Expense) => {
    if (isNew) {
      const next: BudgetData = {
        ...data,
        expenses: [...data.expenses, exp],
      };
      await updateAndSave(next);
      setIsNew(false);
      setEditingExpense(exp);
      setSelectedExpenseId(exp.id);
    } else {
      const next: BudgetData = {
        ...data,
        expenses: data.expenses.map((e) =>
          e.id === exp.id ? exp : e,
        ),
      };
      await updateAndSave(next);
      setEditingExpense(exp);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (isNew) {
      setEditingExpense(null);
      setIsNew(false);
      return;
    }

    const next: BudgetData = {
      ...data,
      expenses: data.expenses.filter((e) => e.id !== id),
    };
    await updateAndSave(next);
    setEditingExpense(null);
    setSelectedExpenseId(null);
  };

  if (loading) {
    return <div className="p-4 text-black">Ładowanie…</div>;
  }

  const periods = data.periods;
  const currentPeriod =
    periods.find((p) => p.id === selectedPeriodId) ?? null;

  const baseBalance = calcGlobalBalance(data);

  const currentExpenses = data.expenses.filter(
    (e) => e.periodId === selectedPeriodId,
  );

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

  const selectedPeriodName =
    currentPeriod?.name || (periods[0]?.name ?? "Brak okresów");

  return (
    <div className="flex h-[486px] p-4 gap-4 text-black">
      {/* LEWA KOLUMNA */}
      <div className="w-[280px] flex flex-col gap-3">
        {/* dropdown okresów + plus */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() =>
                periods.length > 0 && setPeriodListOpen((o) => !o)
              }
              disabled={periods.length === 0}
              className={`w-full h-10 rounded-full px-4 flex items-center justify-between text-sm border-2 shadow-sm
                ${
                  periods.length === 0
                    ? "bg-slate-200 border-slate-300 text-slate-500"
                    : "bg-[#e6e6e6] border-emerald-500"
                }`}
            >
              <span className="truncate">
                {currentPeriod ? selectedPeriodName : "Wybierz okres"}
              </span>
              <span
                className={`text-xs transition-transform ${
                  periodListOpen ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {periodListOpen && periods.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 rounded-3xl bg-[#d4d4d4] border-2 border-emerald-500 shadow-lg max-h-48 overflow-y-auto z-10">
                {periods.map((p) => (
                  <div
                    key={p.id}
                    className={`group flex items-center justify-between px-4 py-2 border-t border-slate-400/40 first:border-t-0
                      ${
                        selectedPeriodId === p.id
                          ? "bg-emerald-100/80 opacity-100"
                          : "bg-transparent opacity-80 hover:bg-emerald-50 hover:opacity-100"
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPeriodId(p.id);
                        setSelectedExpenseId(null);
                        setEditingExpense(null);
                        setIsNew(false);
                        setPeriodListOpen(false);
                      }}
                      className="flex-1 text-left text-sm truncate"
                    >
                      {p.name}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePeriod(p.id);
                      }}
                      className="ml-2 w-6 h-6 rounded-md border border-emerald-600 bg-white text-black text-xs font-extrabold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-100 active:scale-95"
                      title="Usuń okres"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleAddPeriod}
            className="w-10 h-10 rounded-xl border border-emerald-500 bg-white flex items-center justify-center text-emerald-600 text-xl leading-none shadow-sm hover:bg-emerald-50"
            title="Dodaj okres"
          >
            +
          </button>
        </div>

        {/* Dodaj wydatek */}
        <button
          onClick={handleStartNewExpense}
          disabled={!selectedPeriodId}
          className="w-full h-9 rounded-full bg-[#1A6558] text-white text-sm flex items-center justify-between px-4 shadow hover:bg-[#268d7c] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Dodaj wydatek</span>
          <span className="text-lg font-bold">+</span>
        </button>

        {/* lista wydatków */}
        <div className="flex-1 mt-1 flex flex-col gap-1 overflow-y-auto pr-1">
          {/* wiersz „Nowy wydatek...” dla draftu */}
          {isNew &&
            editingExpense &&
            editingExpense.periodId === selectedPeriodId && (
              <button
                type="button"
                onClick={() =>
                  handleEditExistingExpense(editingExpense)
                }
                className="w-full rounded-full border-2 border-emerald-500 bg-[#e1f7f3] h-9 px-4 text-sm flex items-center justify-between shadow-sm cursor-pointer"
              >
                <span className="truncate font-semibold">
                  {`Nowy wydatek #${
                    currentExpenses.length + 1
                  } ${editingExpense.title || "Bez tytułu"}`}
                </span>
                <span className="text-lg">➜</span>
              </button>
            )}

          {currentExpenses.map((e) => {
            const isRowActive = selectedExpenseId === e.id;
            return (
              <div
                key={e.id}
                onClick={() => handleEditExistingExpense(e)}
                className={`w-full rounded-2xl px-4 py-1.5 text-xs flex flex-col border shadow-sm transition cursor-pointer
                  ${
                    isRowActive
                      ? "bg-emerald-100 border-emerald-400 opacity-100"
                      : "bg-slate-200 border-slate-300 opacity-80 hover:opacity-100"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate">
                    {e.title || "(bez tytułu)"}
                  </span>
                  <span className="text-sm">
                    {Number(e.amount || 0).toFixed(2)} zł
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span>{e.date}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleEditExistingExpense(e);
                      }}
                      className="w-5 h-5 rounded-full bg-white/70 flex items-center justify-center hover:bg-white"
                      title="Edytuj"
                    >
                      <img
                        src="/icons/edit.png"
                        alt="Edytuj"
                        className="w-3 h-3"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleDeleteExpense(e.id);
                      }}
                      className="w-5 h-5 rounded-full bg-white/70 flex items-center justify-center hover:bg-red-200"
                      title="Usuń"
                    >
                      <img
                        src="/icons/delete.png"
                        alt="Usuń"
                        className="w-3 h-3"
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {currentPeriod &&
            currentExpenses.length === 0 &&
            !(isNew && editingExpense) && (
              <div className="text-xs text-center mt-2 text-slate-500">
                Brak wydatków w tym okresie.
              </div>
            )}

          {!currentPeriod && periods.length === 0 && (
            <div className="text-xs text-slate-500">
              Brak okresów. Dodaj pierwszy.
            </div>
          )}
        </div>
      </div>

      {/* PRAWA KOLUMNA */}
      <div className="flex-1 flex flex-col">
        {!currentPeriod && (
          <div className="h-full flex items-center justify-center text-sm">
            Wybierz okres po lewej.
          </div>
        )}

        {currentPeriod && !editingExpense && (
          <SummaryCard
            periodName={currentPeriod.name}
            total={total}
            byCategory={byCategory}
            balance={baseBalance}
          />
        )}

        {currentPeriod && editingExpense && (
          <ExpenseDetails
            baseBalance={baseBalance}
            expense={editingExpense}
            isNew={isNew}
            saving={saving}
            onChange={setEditingExpense}
            onSave={handleSaveExpense}
            onDelete={handleDeleteExpense}
          />
        )}
      </div>
    </div>
  );
}

/* ------- PODSUMOWANIE ------- */

function SummaryCard({
  periodName,
  total,
  byCategory,
  balance,
}: {
  periodName: string;
  total: number;
  byCategory: Record<Category, number>;
  balance: number;
}) {
  return (
    <div className="bg-[#f0f0f0] rounded-2xl shadow-md overflow-hidden flex flex-col h-full text-black max-h-[200px]">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <span className="text-base font-semibold">Suma wydatków</span>
        <span className="text-base font-semibold">
          {total.toFixed(2)} zł
        </span>
      </div>
      <div className="px-4 text-xs text-slate-600 mb-1">
        {periodName}
      </div>

      <div className="px-4 pb-3 text-sm space-y-1">
        <RowDot
          label="Rachunki"
          color="bg-cyan-400"
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
          color="bg-red-500"
          value={byCategory.inne}
        />
      </div>

      <div className="mt-auto bg-[#747474] text-white text-sm px-4 py-2 flex items-center justify-between">
        <span>Saldo konta:</span>
        <span className="font-semibold">
          {balance.toFixed(2)} zł
        </span>
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
        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span>{label}</span>
      </div>
      <span>{value.toFixed(2)} zł</span>
    </div>
  );
}

/* ------- FORMULARZ SZCZEGÓŁÓW ------- */

type ExpenseDetailsProps = {
  expense: Expense;
  baseBalance: number;
  isNew: boolean;
  saving: boolean;
  onChange: (exp: Expense | null) => void;
  onSave: (exp: Expense) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
};

function ExpenseDetails({
  expense,
  baseBalance,
  isNew,
  saving,
  onChange,
  onSave,
  onDelete,
}: ExpenseDetailsProps) {
  const [draft, setDraft] = React.useState<Expense>(expense);
  const originalAmountRef = React.useRef(expense.amount);

  React.useEffect(() => {
    setDraft(expense);
    originalAmountRef.current = expense.amount;
  }, [expense.id]);

  const updateField =
    (field: keyof Expense) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      const value =
        field === "amount" ? Number(e.target.value) : e.target.value;
      const next = { ...draft, [field]: value as any };
      setDraft(next);
      onChange(next);
    };

  const setStatus = (status: ExpenseStatus) =>
    setDraft((d) => {
      const next = { ...d, status };
      onChange(next);
      return next;
    });

  const setCategory = (category: Category) =>
    setDraft((d) => {
      const next = { ...d, category };
      onChange(next);
      return next;
    });

  // saldo po transakcji – podgląd
  const diff = draft.amount - originalAmountRef.current;
  const balanceAfter = baseBalance - diff;

  return (
    <div className="bg-[#e9e9e9] text-black rounded-2xl shadow-xl p-3 h-full flex flex-col">
      <div className="bg-white rounded-t-2xl rounded-b-lg px-3 pt-2 pb-3 shadow-sm">
        <div className="flex gap-2 mb-2">
          {[
            { key: "rachunki", label: "Rachunki", dot: "bg-cyan-400" },
            { key: "zakupy", label: "Zakupy", dot: "bg-lime-400" },
            { key: "hobby", label: "Hobby", dot: "bg-orange-400" },
            { key: "inne", label: "Inne", dot: "bg-red-500" },
          ].map((cat) => {
            const active = draft.category === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategory(cat.key as Category)}
                className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 border transition
                  ${
                    active
                      ? "bg-white border-emerald-500 opacity-100"
                      : "bg-slate-100 border-slate-300 opacity-70 hover:opacity-100"
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${cat.dot}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* środek formularza – ciemne tło + inputy w tym samym kolorze */}
        <div className="bg-[#5e5e5e] text-white rounded-xl px-3 py-3 text-sm flex flex-col gap-2">
          <div className="grid grid-cols-2 text-xs mb-1">
            <span>Tytuł</span>
            <span className="text-right">Data</span>
          </div>

          <div className="flex gap-2 mb-1">
            <input
              className="input input-sm bg-[#5e5e5e] border border-white/30 text-sm text-white flex-1 focus:outline-none focus:border-emerald-400"
              value={draft.title}
              onChange={updateField("title")}
            />
            <input
              type="date"
              className="input input-sm bg-[#5e5e5e] border border-white/30 text-sm text-white w-[150px] focus:outline-none focus:border-emerald-400"
              value={draft.date}
              onChange={updateField("date")}
            />
          </div>

          <div className="grid grid-cols-2 text-xs mb-1">
            <span>Kwota</span>
            <span>Opis</span>
          </div>

          <div className="flex gap-2 mb-2">
            <input
              type="number"
              className="input input-sm bg-[#5e5e5e] border border-white/30 text-sm text-white w-[150px] focus:outline-none focus:border-emerald-400"
              value={draft.amount}
              onChange={updateField("amount")}
            />
            <textarea
              className="textarea textarea-sm bg-[#5e5e5e] border border-white/30 text-sm text-white flex-1 resize-none focus:outline-none focus:border-emerald-400"
              rows={2}
              value={draft.description}
              onChange={updateField("description")}
            />
          </div>

          <div className="text-xs mt-1">
            Na koncie po transakcji:{" "}
            <span className="font-semibold">
              {balanceAfter.toFixed(2)} zł
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            {/* LEWA STRONA – ikonki obrazek + załącznik */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center"
                title="Dodaj zdjęcie"
              >
                <img
                  src="/icons/image.png"
                  alt="Zdjęcie"
                  className="w-6 h-6"
                />
              </button>
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center"
                title="Dodaj załącznik"
              >
                <img
                  src="/icons/attach.png"
                  alt="Załącznik"
                  className="w-6 h-6"
                />
              </button>
            </div>

            {/* PRAWA STRONA – statusy */}
            <div className="flex gap-3 text-xs">
              <button
                type="button"
                onClick={() => setStatus("oplacony")}
                className={`px-3 py-1 rounded-full border flex items-center gap-1
                  ${
                    draft.status === "oplacony"
                      ? "bg-emerald-400/80 border-emerald-500 text-black opacity-100"
                      : "bg-slate-300 border-slate-500 opacity-70 hover:opacity-100"
                  }`}
              >
                ✓ Opłacony
              </button>
              <button
                type="button"
                onClick={() => setStatus("zaplanowany")}
                className={`px-3 py-1 rounded-full border flex items-center gap-1
                  ${
                    draft.status === "zaplanowany"
                      ? "bg-emerald-400/80 border-emerald-500 text-black opacity-100"
                      : "bg-slate-300 border-slate-500 opacity-70 hover:opacity-100"
                  }`}
              >
                ⏱ Zaplanowany
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* dół z przyciskami */}
      <div className="mt-auto flex justify-end pt-3 pr-1">
        <button
          type="button"
          disabled={saving}
          onClick={() => onDelete(draft.id)}
          className="btn btn-sm btn-ghost mr-2"
        >
          {isNew ? "Anuluj" : "Usuń"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(draft)}
          className="h-10 px-8 rounded-full border border-emerald-500 bg-white text-sm font-medium shadow hover:bg-emerald-50"
        >
          {saving ? "Zapisywanie..." : "Zapisz"}
        </button>
      </div>
    </div>
  );
}
