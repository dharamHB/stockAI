import React from "react";
import { X } from "lucide-react";
import clsx from "clsx";

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className={clsx(
          "bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-neutral-800 rounded-[2rem] shadow-2xl w-full mx-auto relative overflow-hidden transition-all animate-in zoom-in-95 duration-300",
          maxWidth
        )}
      >
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex justify-between items-center p-8 border-b border-gray-50 dark:border-neutral-900/50">
          <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 italic tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
