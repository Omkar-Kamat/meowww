import { useEffect } from "react";
import { useToastStore } from "../store/useToastStore";

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();

  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => remove(t.id), 4000)
    );

    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  return (
    <div className="fixed top-6 right-6 flex flex-col gap-3 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${
            toast.type === "error"
              ? "bg-red-600"
              : toast.type === "success"
              ? "bg-green-600"
              : "bg-neutral-800"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}