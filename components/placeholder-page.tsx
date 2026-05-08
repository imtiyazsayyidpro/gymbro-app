import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type PlaceholderPageProps = {
  title: string;
  description: string;
  badge?: string;
  primaryAction?: string;
};

export function PlaceholderPage({ title, description, badge = "Foundation", primaryAction = "Coming soon" }: PlaceholderPageProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Badge variant="secondary">{badge}</Badge>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ready for the next build step</CardTitle>
          <CardDescription>This screen is wired into the app shell and ready for feature UI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <Button className="w-full sm:w-auto" disabled>
            {primaryAction}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
