import { forwardRef, type TextareaHTMLAttributes } from "react";

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      rows={3}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900
        placeholder:text-slate-400 resize-none
        focus:outline-none focus:ring-2 focus:ring-[#163258] focus:border-transparent
        disabled:bg-slate-50 ${className}`}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
export { Textarea };
