import Image from "next/image";
import Link from "next/link";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image src="/logo.png" alt="Threedly" width={40} height={40} />
      <span className="text-xl font-bold">Threedly</span>
    </Link>
  );
}

export default Logo;
