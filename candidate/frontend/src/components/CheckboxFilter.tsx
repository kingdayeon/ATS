import { ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckboxFilterProps } from "@/types";

const CheckboxFilter = ({
  title,
  options,
  selectedOptions,
  onOptionChange,
  isExpanded,
  onToggleExpanded
}: CheckboxFilterProps) => {
  return (
    <div className="mb-8">
      <button
        onClick={onToggleExpanded}
        className="flex items-center justify-between w-full text-left font-medium mb-4 hover:text-gray-700 transition-colors"
      >
        {title}
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      
      {isExpanded && (
        <div className="space-y-3">
          {options.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`${title}-${option}`}
                checked={selectedOptions.includes(option)}
                onCheckedChange={(checked) => onOptionChange(option, !!checked)}
              />
              <label 
                htmlFor={`${title}-${option}`} 
                className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckboxFilter; 