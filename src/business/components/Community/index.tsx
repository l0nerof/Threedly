import { Button } from "@/shared/components/Button";
import Link from "next/link";
import React from "react";

function Community() {
  return (
    <section className="w-full bg-muted/30 py-12 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="mb-12 space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
            Приєднуйтесь до нашої спільноти
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Зв&apos;яжіться з іншими 3D-художниками, поділіться своєю роботою та
            зростіть разом
          </p>
        </div>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/signup">Приєднатися до спільноти</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/designers">Подивитися наших дизайнерів</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default Community;
