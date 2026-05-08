"use client";

import { CSSProperties, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
};

type ComboboxProps = {
  value: string;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  allowNone?: boolean;
  noneLabel?: string;
};

const typedTextStyle: CSSProperties = {
  color: "#f0f0ee",
  WebkitTextFillColor: "#f0f0ee",
};

export function Combobox({
  value,
  options,
  onChange,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  disabled = false,
  allowNone = false,
  noneLabel = "None",
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const allOptions = useMemo(
    () => (allowNone ? [{ value: "", label: noneLabel }, ...options] : options),
    [allowNone, noneLabel, options],
  );

  const selectedLabel = allOptions.find((option) => option.value === value)?.label;
  const filteredOptions = allOptions.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Popover.Root
      modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (disabled) return;
        setOpen(nextOpen);
        if (!nextOpen) setQuery("");
      }}
    >
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between rounded-xl border-white/7 bg-[#1a1a1b] px-3 text-left font-normal !text-[#f0f0ee] caret-[#c8f135] hover:bg-[#1a1a1b] hover:text-[#f0f0ee] focus:border-[#c8f135]/40 focus:ring-0 focus-visible:ring-0 disabled:opacity-60",
            !selectedLabel && "text-white/25",
          )}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-white/30" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="z-[70] w-[var(--radix-popover-trigger-width)] rounded-xl border border-white/10 bg-[#151516] p-2 text-[#f0f0ee] shadow-xl outline-none"
        >
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="mb-2 h-10 rounded-lg border-white/7 bg-[#0f0f10] !text-[#f0f0ee] placeholder:!text-white/25 caret-[#c8f135] focus:border-[#c8f135]/40 focus-visible:ring-0"
            style={typedTextStyle}
          />
          <div className="max-h-44 overflow-y-auto overscroll-contain pr-1">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-white/35">{emptyText}</p>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option.value || "none"}
                    type="button"
                    className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-[#f0f0ee]"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <Check className={cn("size-4 text-[#c8f135]", value === option.value ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
