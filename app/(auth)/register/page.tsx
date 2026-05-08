import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Account creation placeholder for Gymbro.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your name" disabled />
          </div>
          <Button className="w-full" disabled>
            Create account
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/login">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
