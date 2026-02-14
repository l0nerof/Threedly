import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import { cn } from "@/src/shared/utils/cn";
import type { ReactNode } from "react";
import type { ValueBullet } from "../ValueBullets";
import ValueBullets from "../ValueBullets";

type AuthCardProps = {
  title: string;
  description?: ReactNode;
  valueBullets?: ValueBullet[];
  children: ReactNode;
  className?: string;
};

function AuthCard({
  title,
  description,
  valueBullets,
  children,
  className,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-md">
      <Card
        className={cn(
          "bg-card relative z-10 w-full gap-5 border-0 p-5 shadow-none",
          className,
        )}
      >
        <CardHeader className="flex flex-col gap-5 px-0">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl md:text-3xl">{title}</CardTitle>

            {description && (
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            )}
          </div>

          {valueBullets?.length && <ValueBullets valueBullets={valueBullets} />}
        </CardHeader>

        <CardContent className="px-0">{children}</CardContent>
      </Card>
    </div>
  );
}

export default AuthCard;
