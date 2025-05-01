import Link from 'next/link'
import Image from 'next/image'


function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.png" alt="Threedly" width={32} height={32} />
        <span className="text-xl font-bold">Threedly</span>
    </Link>
  )
}

export default Logo