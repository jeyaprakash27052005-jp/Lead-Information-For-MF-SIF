import React, { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';

export interface MenuItem<T extends string = string> {
  id: T;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  description?: string;
}

interface Props<T extends string> {
  items: MenuItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
  /** heading inside the opened menu */
  title?: string;
  className?: string;
}

/**
 * Three-line (hamburger) menu: a button showing the current section; it opens a side panel with every option.
 * Closes when an option is chosen, on Escape, or when the dark area outside is pressed.
 */
export function HamburgerMenu<T extends string>({ items, activeId, onSelect, title = 'Menu', className = '' }: Props<T>) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const active = items.find((i) => i.id === activeId) || items[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLButtonElement>('button[data-active="true"]')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="btn-glow w-10 h-10 shrink-0 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        {active && (
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-black text-slate-900 truncate">
              <span className="text-indigo-500 shrink-0">{active.icon}</span>
              <span className="truncate">{active.label}</span>
            </p>
            {active.description && <p className="text-[11px] text-slate-500 truncate">{active.description}</p>}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={title}>
          <div className="absolute inset-0 bg-slate-900/50 anim-fade" onClick={() => setOpen(false)} />
          <div ref={panelRef} className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl flex flex-col anim-slide-in-left">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <p className="text-sm font-black text-slate-900 uppercase tracking-wider">{title}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {items.map((item) => {
                const isActive = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-active={isActive}
                    onClick={() => {
                      setOpen(false);
                      onSelect(item.id);
                    }}
                    className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                      isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`mt-0.5 shrink-0 ${isActive ? 'text-indigo-300' : 'text-slate-400'}`}>{item.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{item.label}</span>
                      {item.description && <span className={`block text-[11px] ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{item.description}</span>}
                    </span>
                    {item.badge !== undefined && (
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold ${isActive ? 'bg-slate-700 text-indigo-200' : 'bg-slate-200 text-slate-700'}`}>{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
