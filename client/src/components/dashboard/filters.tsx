import { ViewSelector } from "./view-selector";

interface FiltersProps {
  viewId: number;
  onViewChange: (viewId: number) => void;
}

export function Filters({ viewId, onViewChange }: FiltersProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg shadow-sm">
      <ViewSelector value={viewId} onValueChange={onViewChange} />
    </div>
  );
}