import React from "react";
import {
  getBudget,
  saveBudget,
  calcGlobalBalance,
  type BudgetData,
  type Period,
  type Income,
  type IncomeCategory,
} from "../../api/expensesApi";

export function Przychody() {
  const [data, setData] = React.useState<BudgetData>({
    periods: [],
    expenses: [],
    incomes: [],
  });
  const [selectedPeriodId, setSelectedPeriodId] = React.useState<number | null>(
    null,
  );
  const [selectedIncomeId, setSelectedIncomeId] = React.useState<number | null>(
    null,
  );
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
          const firstInPeriod = bd.incomes.find(
            (i) => i.periodId === firstPeriod.id,
          );
          setSelectedIncomeId(firstInPeriod?.id ?? null);
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
      "Nazwa okresu (np. 'Przychody w październiku'):",
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
    setSelectedIncomeId(null);
  };

  const handleAddIncome = async () => {
    if (!selectedPeriodId) {
      alert("Najpierw wybierz lub dodaj okres.");
      return;
    }

    const countInPeriod = data.incomes.filter(
      (i) => i.periodId === selectedPeriodId,
    ).length;

    const newIncome: Income = {
      id: Date.now(),
      periodId: selectedPeriodId,
      title: `Nowy przychód #${countInPeriod + 1} Bez tytułu`,
      amount: 0,
      description: "",
      date: new Date().toISOString().slice(0, 10),
      category: "praca",
    };

    const next: BudgetData = {
      ...data,
      incomes: [...data.incomes, newIncome],
    };

    await updateAndSave(next);
    setSelectedIncomeId(newIncome.id);
  };

  const handleUpdateIncome = async (updated: Income) => {
    const next: BudgetData = {
      ...data,
      incomes: data.incomes.map((i) =>
        i.id === updated.id ? updated : i,
      ),
    };
    await updateAndSave(next);
  };

  const handleRemoveIncome = async (id: number) => {
    const next: BudgetData = {
      ...data,
      incomes: data.incomes.filter((i) => i.id !== id),
    };
    await updateAndSave(next);
    if (selectedIncomeId === id) {
      const remaining = next.incomes.filter(
        (i) => i.periodId === selectedPeriodId,
      );
      setSelectedIncomeId(remaining[0]?.id ?? null);
    }
  };

  if (loading) {
    return <div className="p-4 text-black">Ładowanie…</div>;
  }

  const periods = data.periods;
  const currentPeriod =
    periods.find((p) => p.id === selectedPeriodId) ?? null;

  const currentIncomes = data.incomes.filter(
    (i) => i.periodId === selectedPeriodId,
  );

  const selectedIncome =
    currentIncomes.find((i) => i.id === selectedIncomeId) ?? null;

  const totalIncome = currentIncomes.reduce((s, i) => s + i.amount, 0);
  const byCategory: Record<IncomeCategory, number> = {
    praca: 0,
    social: 0,
    dodatkowy: 0,
    inne: 0,
  };
  currentIncomes.forEach((i) => {
    byCategory[i.category] += i.amount;
  });

  const globalBalance = calcGlobalBalance(data);
  const hasPeriod = !!currentPeriod;

  return (
    <div className="flex h-[486px] p-4 gap-4 text-black">
      {/* LEWA KOLUMNA: okres + lista przychodów */}
      <div className="w-[280px] flex flex-col gap-3">
        {/* wybór okresu */}
        <div className="flex items-center gap-2 text-sm">
          <select
            className="select select-sm bg-slate-100 border border-slate-300 flex-1"
            value={selectedPeriodId ?? ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              if (!id) {
                setSelectedPeriodId(null);
                setSelectedIncomeId(null);
                return;
              }
              setSelectedPeriodId(id);
              const firstInPeriod = data.incomes.find(
                (i) => i.periodId === id,
              );
              setSelectedIncomeId(firstInPeriod?.id ?? null);
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
            className="w-8 h-8 flex items-center justify-center rounded-full shadow-md bg-slate-200 hover:bg-slate-300 text-lg font-bold text-black"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAddIncome}
          disabled={!hasPeriod}
          className="w-full h-10 rounded-full bg-slate-100 shadow-md flex items-center justify-between px-4 text-sm hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Dodaj nowy przychód</span>
          <span className="text-xl font-bold">+</span>
        </button>

        {/* lista przychodów w okresie */}
        <div className="flex-1 mt-1 flex flex-col gap-2 overflow-y-auto">
          {currentIncomes.length === 0 && (
            <div className="text-xs text-center mt-4">
              Brak przychodów w tym okresie.
            </div>
          )}

          {currentIncomes.map((i) => (
            <button
              key={i.id}
              onClick={() => setSelectedIncomeId(i.id)}
              className={`w-full text-left rounded-xl px-4 py-2 border shadow-sm text-sm transition ${
                selectedIncomeId === i.id
                  ? "bg-emerald-200 border-emerald-400"
                  : "bg-slate-100 border-slate-300"
              }`}
            >
              <div className="font-semibold truncate">{i.title}</div>
              <div className="flex justify-between text-xs mt-1">
                <span>{i.date}</span>
                  <span>{Number(i.amount || 0).toFixed(2)} zł</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* PRAWA KOLUMNA: podsumowanie + szczegóły przychodu */}
      <div className="flex-1 flex flex-col gap-3">
        {/* PODSUMOWANIE */}
        <div className="bg-[#f0f0f0] rounded-2xl shadow-md p-3 flex gap-4">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-sm">
                Suma przychodów{" "}
                {currentPeriod ? `– ${currentPeriod.name}` : ""}
              </span>
              <span className="font-semibold text-sm">
                {totalIncome.toFixed(2)} zł
              </span>
            </div>
            <div className="text-xs space-y-1 mt-2">
              <RowDot
                label="Praca"
                color="bg-cyan-400"
                value={byCategory.praca}
              />
              <RowDot
                label="Social"
                color="bg-lime-400"
                value={byCategory.social}
              />
              <RowDot
                label="Dodatkowy"
                color="bg-orange-400"
                value={byCategory.dodatkowy}
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
                {globalBalance.toFixed(2)} zł
              </div>
            </div>
          </div>
        </div>

        {/* SZCZEGÓŁY */}
        <div className="flex-1">
          {selectedIncome ? (
            <IncomeDetails
              income={selectedIncome}
              onChange={handleUpdateIncome}
              onRemove={handleRemoveIncome}
              saving={saving}
              balance={globalBalance}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-sm">
              Wybierz przychód z listy lub dodaj nowy.
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

type IncomeDetailsProps = {
  income: Income;
  onChange: (inc: Income) => Promise<void> | void;
  onRemove: (id: number) => Promise<void> | void;
  saving: boolean;
  balance: number;
};

function IncomeDetails({
  income,
  onChange,
  onRemove,
  saving,
  balance,
}: IncomeDetailsProps) {
  const handleField =
    (field: keyof Income) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      const value =
        field === "amount" ? Number(e.target.value) : e.target.value;
      onChange({ ...income, [field]: value as any });
    };

  const setCategory = (category: IncomeCategory) =>
    onChange({ ...income, category });

  return (
    <div className="bg-[#f5f5f5] text-black rounded-2xl shadow-xl p-4 h-full flex flex-col">
      {/* Kategorie przychodu */}
      <div className="flex gap-2 mb-3">
        {[
          { key: "praca", label: "Praca", dot: "bg-cyan-400" },
          { key: "social", label: "Social", dot: "bg-lime-400" },
          { key: "dodatkowy", label: "Dodatkowy", dot: "bg-orange-400" },
          { key: "inne", label: "Inne", dot: "bg-red-400" },
        ].map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategory(cat.key as IncomeCategory)}
            className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 border ${
              income.category === cat.key
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
          value={income.title}
          onChange={handleField("title")}
        />
        <input
          type="date"
          className="input input-sm bg-white border border-slate-300 text-sm w-[150px]"
          value={income.date}
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
          value={income.amount}
          onChange={handleField("amount")}
        />
        <textarea
          className="textarea textarea-sm bg-white border border-slate-300 text-sm flex-1 resize-none"
          rows={2}
          value={income.description}
          onChange={handleField("description")}
        />
      </div>

      <div className="mt-auto flex items-center justify-between">
        <div className="text-sm">
          Na koncie:{" "}
          <span className="font-semibold">
            {balance.toFixed(2)} zł
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => onRemove(income.id)}
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
