"use client";

import React from "react";
import { Server, Power, Loader2, X } from "lucide-react";
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
  // Guard ensures zero modal artifacts render when closed
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className="w-full max-w-md p-6 rounded-2xl bg-[#0D1424] border border-[#1E2C48] shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          disabled={isBooting}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Cloud Worker in Standby</h3>
            <p className="text-xs text-slate-400">Codespace instance is currently powered off.</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-[#070B14] p-3 rounded-xl border border-[#1A263D]">
          To stream files directly to Google Drive, the Codespace worker needs to be activated. Once on, you can freely enqueue multiple tasks. It will <strong>automatically power off after 5 minutes of idle time</strong>.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isBooting}>
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
                <span>Booting Instance (~30s)...</span>
              </>
            ) : (
              <>
                <Power className="w-3.5 h-3.5 text-emerald-400" />
                <span>Turn On Server</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};