import { Button } from "@/shared/components/Button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="space-y-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">Сторінка не знайдена</h2>
        <p className="text-muted-foreground">
          Сторінка, яку ви шукаєте, не існує або була переміщена.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/">На головну</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Увійти</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
