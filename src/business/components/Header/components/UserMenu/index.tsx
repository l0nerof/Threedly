import { Button } from "@/shared/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/DropdownMenu";
import { User } from "lucide-react";
import Link from "next/link";

interface UserMenuProps {
  userName: string | undefined;
  handleSignOut: () => void;
}

function UserMenu({ userName, handleSignOut }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <User className="size-4" />
          <span className="hidden sm:inline-block">{userName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/profile">Профіль</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile?tab=favorites">Мої улюблені</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile?tab=uploads">Мої моделі</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>Вийти</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
