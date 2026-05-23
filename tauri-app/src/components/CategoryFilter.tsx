import React from "react";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <select
      value={selectedCategory}
      onChange={e => onCategoryChange(e.target.value)}
      className="border rounded px-2 py-1 focus:outline-none focus:ring"
    >
      {categories.map(cat => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  );
};

export default CategoryFilter;
