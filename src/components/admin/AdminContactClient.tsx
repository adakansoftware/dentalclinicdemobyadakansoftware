"use client";

import type { ActionResult } from "@/types";

import { useState, useActionState, startTransition } from "react";
import { markContactReadAction, deleteContactRequestAction } from "@/actions/contact";
import type { ContactRequestData } from "@/types";

const initialState: ActionResult = { success: false };

export default function AdminContactClient({ requests }: { requests: ContactRequestData[] }) {
  const [selected, setSelected] = useState<ContactRequestData | null>(null);
  const [markState, markAction] = useActionState(markContactReadAction, initialState);
  const [deleteState, deleteAction] = useActionState(deleteContactRequestAction, initialState);

  const unread = requests.filter((r) => !r.isRead);
  const read = requests.filter((r) => r.isRead);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        İletişim Mesajları
        {unread.length > 0 && (
          <span className="ml-2 text-sm font-normal px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">{unread.length} okunmamış</span>
        )}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {requests.map((req) => (
            <button key={req.id} onClick={() => setSelected(req)}
              className={`card p-4 text-left w-full transition-all ${selected?.id === req.id ? "ring-2" : ""} ${!req.isRead ? "border-l-4 border-blue-400" : ""}`}
              style={selected?.id === req.id ? { outlineColor: "var(--color-primary)" } : {}}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm">{req.name}</p>
                    {!req.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{req.subject}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate">{req.message}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{new Date(req.createdAt).toLocaleDateString("tr-TR")}</span>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="card p-6 sticky top-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">{selected.subject}</h2>
                <p className="text-sm text-gray-500">{selected.name} · {selected.phone}</p>
                {selected.email && <p className="text-sm text-gray-500">{selected.email}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg text-sm">{selected.message}</p>
            <p className="text-xs text-gray-400 mt-3">{new Date(selected.createdAt).toLocaleString("tr-TR")}</p>

            <div className="flex gap-2 mt-4">
              {!selected.isRead && (
                <form action={(fd) => { startTransition(() => { void markAction(fd); }); }}>
                  <input type="hidden" name="id" value={selected.id} />
                  <button type="submit" className="text-sm px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium">Okundu İşaretle</button>
                </form>
              )}
              <form action={(fd) => { if (!confirm("Silmek istediğinize emin misiniz?")) return; startTransition(() => { void deleteAction(fd); setSelected(null); }); }}>
                <input type="hidden" name="id" value={selected.id} />
                <button type="submit" className="text-sm px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Sil</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
