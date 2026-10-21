"use client";

import React, { useEffect, useState } from "react";
import { LogOut, X, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSigningOut && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSigningOut, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSigningOut(true);
    try {
      await onConfirm();
    } finally {
      setIsSigningOut(false);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 select-none"
    >
      <div className="w-full max-w-sm p-6 rounded-2xl bg-white dark:bg-[#0c111e] border border-slate-200 dark:border-white/[0.1] shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          disabled={isSigningOut}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors disabled:opacity-30"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h3 id="signout-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
              Confirm Sign Out
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              End your current RunSync session
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Are you sure you want to sign out? Any active extractions currently streaming will continue running on your cloud worker node.
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSigningOut}
            className="text-slate-600 dark:text-slate-400"
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            disabled={isSigningOut}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white border-transparent"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Sign Out</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
