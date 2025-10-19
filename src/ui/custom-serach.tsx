import { FiSearch, FiX } from "react-icons/fi";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search by Name or Company",
}) => {
  return (
    <div className="relative w-full md:w-[300px]">
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        <FiSearch className="text-gray-400" size={18} />
      </div>

      <input
        type="text"
        placeholder={placeholder}
        className="border border-gray-300 rounded-md w-full pl-10 pr-8 py-2 outline-none bg-white shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
        >
          <FiX size={18} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
