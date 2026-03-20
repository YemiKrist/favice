import { formatNaira } from "@/lib/utils";

interface Props {
  total: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
}

export function SummaryCards({ total, totalAmount, totalPaid, totalOutstanding }: Props) {
  const cards = [
    {
      label: "Total Invoices",
      value: String(total),
      icon: "📄",
      color: "bg-slate-50 border-slate-200",
    },
    {
      label: "Total Invoiced",
      value: formatNaira(totalAmount),
      icon: "₦",
      color: "bg-blue-50 border-blue-100",
    },
    {
      label: "Total Paid",
      value: formatNaira(totalPaid),
      icon: "✓",
      color: "bg-emerald-50 border-emerald-100",
    },
    {
      label: "Outstanding",
      value: formatNaira(totalOutstanding),
      icon: "⏳",
      color: "bg-amber-50 border-amber-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon, color }) => (
        <div key={label} className={`rounded-xl border p-5 ${color}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <span className="text-base">{icon}</span>
          </div>
          <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
        </div>
      ))}
    </div>
  );
}
