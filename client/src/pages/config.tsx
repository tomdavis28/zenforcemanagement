import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchViews } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Settings } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/config/columns";

export default function Config() {
  const { data: views, isLoading, error } = useQuery({
    queryKey: ['/api/views'],
    queryFn: fetchViews
  });

  const showConfigurationMessage = error?.message?.includes("Zendesk credentials not configured");

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Configuration</h1>
        </div>
      </div>

      {showConfigurationMessage ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Zendesk credentials are not configured. Please configure your Zendesk API credentials to start collecting analytics data.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Views Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading views...</div>
            ) : views ? (
              <DataTable columns={columns} data={views} />
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
