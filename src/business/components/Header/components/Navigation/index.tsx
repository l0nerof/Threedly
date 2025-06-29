import Link from "next/link";
import React from "react";

function Navigation() {
  return (
    <nav className="hidden gap-6 lg:flex">
      <Link
        href="/catalog"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Каталог
      </Link>
      <Link
        href="/categories"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Категорії
      </Link>
      <Link
        href="/designers"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Дизайнери
      </Link>
      <Link
        href="/pricing"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Ціни
      </Link>
    </nav>
  );
}

export default Navigation;
