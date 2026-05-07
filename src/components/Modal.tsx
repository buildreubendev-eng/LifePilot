import { useEffect, useRef } from "react";

export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-stone-900/50 w-full sm:max-w-md rounded-xl border border-stone-200 bg-white p-0 shadow-xl"
      onClose={onClose}
    >
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
        <h2 className="text-lg font-bold text-stone-950">{title}</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-stone-500 hover:bg-stone-100"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
