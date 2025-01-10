import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeRange } from "@/lib/types";

interface FiltersProps {
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
}

export function Filters({ timeRange, onTimeRangeChange }: FiltersProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg shadow-sm">
      <Select value={timeRange} onValueChange={(value) => onTimeRangeChange(value as TimeRange)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select time range" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="4h">Last 4 Hours</SelectItem>
            <SelectItem value="12h">Last 12 Hours</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
