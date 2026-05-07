import { useState } from "react";
import { Modal } from "./Modal";

export function TaskModal({
  isOpen,
  onClose,
  onConfirm,
  defaultTitle = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, notes: string) => void;
  defaultTitle?: string;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [notes, setNotes] = useState("");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-stone-700">Task Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-900"
            placeholder="What needs to be done?"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-stone-700">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-900"
            rows={3}
          />
        </div>
        <div className="mt-2 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100">Cancel</button>
          <button onClick={() => onConfirm(title, notes)} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800">Create Task</button>
        </div>
      </div>
    </Modal>
  );
}
