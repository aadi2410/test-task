import React, { useState, useRef, useEffect } from "react";

interface CustomDropdownProps {
  locations: string[];
  value: string;
  onChange: (value: string) => void;
  optionPlaceholder: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  locations,
  value,
  onChange,
  optionPlaceholder
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => setOpen(!open);

  const handleSelect = (loc: string) => {
    onChange(loc);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative md:w-[180px] flex-1" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="w-full flex justify-between items-center px-4 py-2 border border-gray-300 rounded-md bg-white shadow-sm hover:bg-gray-50"
      >
        <span>{value || optionPlaceholder}</span>
        <svg
          className={`w-4 h-4 transform transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-60 overflow-y-auto">
          <li
            onClick={() => handleSelect("")}
            className="px-4 py-2 cursor-pointer hover:bg-gray-100"
          >
            {optionPlaceholder}
          </li>
          {locations.map((loc) => (
            <li
              key={loc}
              onClick={() => handleSelect(loc)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
            >
              {loc}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
