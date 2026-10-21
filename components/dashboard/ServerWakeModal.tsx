"use client";

import React, { useEffect } from "react";
import { Server, Power, Loader2, X, Cpu, Network, HardDrive, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServerWakeModalProps {
  isOpen: boolean;
  isBooting: boolean;
  onClose: () => void;
  onConfirmWake: () => Promise<void>;
}

export const ServerWakeModal: React.FC<ServerWakeModalProps> = ({
  isOpen,
  isBooting,
  onClose,
  onConfirmWake,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBooting && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isBooting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wake-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 select-none"
    >
      <div className="w-full max-w-md p-6 rounded-2xl bg-[#0c111e] border border-white/[0.1] shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          disabled={isBooting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors disabled:opacity-30"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 id="wake-modal-title" className="text-sm font-semibold text-white">
              Cloud Worker in Standby
            </h3>
            <p className="text-xs text-slate-400">Codespace instance is currently in powersave mode.</p>
          </div>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed bg-[#070b14] p-3.5 rounded-xl border border-white/[0.06] space-y-2">
          <p>
            To stream files directly to Google Drive, the cloud extraction node needs to be spawned. Once booted, your pending task will automatically dispatch.
          </p>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-white/[0.04]">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <span>Automatically shuts down after 5 minutes of idle time to conserve quota.</span>
          </div>
        </div>

        {isBooting && (
          <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Booting container (~25-35s)...</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Signal Dispatched
              </span>
              <span className="flex items-center gap-1 text-indigo-300">
                <Loader2 className="w-3 h-3 animate-spin" />
                Tunnel Handshake
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isBooting}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onConfirmWake}
            disabled={isBooting}
            className="flex items-center gap-2"
          >
            {isBooting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Spawning Instance...</span>
              </>
            ) : (
              <>
                <Power className="w-3.5 h-3.5 text-emerald-300" />
                <span>Spawn Cloud Worker</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
