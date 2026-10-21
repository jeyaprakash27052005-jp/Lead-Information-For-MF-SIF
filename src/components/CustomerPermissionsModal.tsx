import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { CustomerPermissions, CustomerPermissionSettings, User } from '../types';
import { PERMISSION_LABELS, resolvePermissions } from '../utils/permissions';

interface CustomerPermissionsModalProps {
  customer: User;
  onSave: (userId: string, permissions: CustomerPermissionSettings) => Promise<void>;
  onClose: () => void;
}

export const CustomerPermissionsModal: React.FC<CustomerPermissionsModalProps> = ({ customer, onSave, onClose }) => {
  const [perms, setPerms] = useState<CustomerPermissions>(resolvePermissions(customer));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(customer.id, { ...perms, explicit: true });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the permissions.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Customer permissions
            </span>
            <h3 className="text-base font-bold mt-0.5">{customer.name}</h3>
            <p className="text-[11px] text-slate-400">User ID {customer.username}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-500">
            Every feature is on for this customer while its switch is on in Feature Controls. Untick a feature to block it for this customer only.
          </p>
          {PERMISSION_LABELS.map((p) => (
            <label
              key={p.key}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={perms[p.key]}
                onChange={(e) => setPerms((prev) => ({ ...prev, [p.key]: e.target.checked }))}
                className="mt-0.5 w-4 h-4 accent-emerald-600"
              />
              <span>
                <span className="block text-xs font-bold text-slate-900">{p.label}</span>
                <span className="block text-[11px] text-slate-500">{p.help}</span>
              </span>
            </label>
          ))}
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save permissions'}
          </button>
        </div>
      </div>
    </div>
  );
};
