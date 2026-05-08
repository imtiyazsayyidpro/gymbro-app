"use client";

import { ChangeEvent } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: SearchInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/30" />
      <Input
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-11 rounded-2xl border-white/7 bg-[#1a1a1b] pr-11 pl-10 text-[#f0f0ee] placeholder:text-white/30 caret-[#c8f135] focus:border-[#c8f135]/40 focus-visible:ring-0"
        style={{
          color: "#f0f0ee",
          WebkitTextFillColor: "#f0f0ee",
        }}
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-1.5 size-8 -translate-y-1/2 rounded-full text-white/35 hover:bg-white/5 hover:text-white/75"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
