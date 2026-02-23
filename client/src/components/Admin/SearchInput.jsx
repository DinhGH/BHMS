// src/components/SearchInput.jsx
import React from "react";
import { Search } from "lucide-react";

export default function SearchInput({
  value,
  onChange,
  onKeyDown,
  placeholder = "Search",
  className,
}) {
  return (
    <div className={`relative w-full ${className || ""}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        className="w-full pl-9 pr-3 py-2 text-sm border rounded-md"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
