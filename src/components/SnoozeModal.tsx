import { Modal } from "./Modal";

export function SnoozeModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
}) {
  const options = [
    { label: "Tomorrow", value: "tomorrow" },
    { label: "Later this week", value: "this_week" },
    { label: "Next week", value: "next_week" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Snooze Item">
      <p className="mb-4 text-sm text-stone-600">When should PLOS remind you about this item?</p>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onConfirm(opt.value)}
            className="w-full rounded-md border border-stone-200 bg-white px-4 py-3 text-left text-sm font-semibold text-stone-800 hover:border-stone-300 hover:bg-stone-50"
          >
            {opt.label}
          </button>
        ))}
        <div className="mt-2 flex items-center gap-2 border-t border-stone-100 pt-4">
          <input type="date" className="flex-1 rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-800" />
          <button onClick={() => onConfirm("custom")} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white">Save</button>
        </div>
      </div>
    </Modal>
  );
}
