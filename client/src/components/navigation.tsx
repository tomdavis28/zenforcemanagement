import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart, Settings } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();

  const items = [
    {
      title: "Dashboard",
      icon: BarChart,
      href: "/",
    },
    {
      title: "Configuration",
      icon: Settings,
      href: "/config",
    },
  ];

  return (
    <nav className="border-b">
      <div className="container mx-auto">
        <div className="flex h-14 items-center px-4 gap-6">
          <h1 className="text-lg font-semibold">Zendesk Analytics</h1>
          <div className="flex gap-4">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  location === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
