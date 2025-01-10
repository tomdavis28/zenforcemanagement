import { ColumnDef } from "@tanstack/react-table";
import { ZendeskView } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";

export const columns: ColumnDef<ZendeskView>[] = [
  {
    accessorKey: "id",
    header: "View ID",
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const view = row.original;
      const queryClient = useQueryClient();

      const handleToggle = async () => {
        const response = await fetch(`/api/views/${view.id}/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: view.title })
        });

        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ['/api/views'] });
        }
      };

      return (
        <Button
          variant="ghost"
          onClick={handleToggle}
          className="h-8 w-8 p-0"
        >
          {view.enabled ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          <span className="sr-only">
            {view.enabled ? 'Disable' : 'Enable'} view
          </span>
        </Button>
      );
    },
  },
];