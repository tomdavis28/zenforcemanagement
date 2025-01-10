import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { fetchViews } from "@/lib/api";

interface ViewSelectorProps {
  value: number;
  onValueChange: (value: number) => void;
}

export function ViewSelector({ value, onValueChange }: ViewSelectorProps) {
  const [open, setOpen] = useState(false);

  const { data: views, isLoading } = useQuery({
    queryKey: ['/api/views'],
    queryFn: fetchViews
  });

  const selectedView = views?.find((view) => view.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            "Loading views..."
          ) : selectedView ? (
            `${selectedView.title} (${selectedView.id})`
          ) : (
            "Select view..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search views..." />
          <CommandEmpty>No view found.</CommandEmpty>
          <CommandGroup>
            {views?.map((view) => (
              <CommandItem
                key={view.id}
                value={view.title.toLowerCase()}
                onSelect={() => {
                  onValueChange(view.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === view.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex-1">{view.title}</span>
                <span className="text-xs text-muted-foreground">
                  ID: {view.id}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}