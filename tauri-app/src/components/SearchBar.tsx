import React, { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [input, setInput] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setInput(q);
    onSearch(q);
  };

  return (
    <input
      type="text"
      placeholder="Search..."
      value={input}
      onChange={handleChange}
      className="border rounded px-2 py-1 focus:outline-none focus:ring"
    />
  );
};

export default SearchBar;
