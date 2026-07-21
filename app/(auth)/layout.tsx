import Image from "next/image";
import Link from "next/link";
import { APP_NAME, ROUTES } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <div className="relative hidden overflow-hidden bg-sidebar md:flex md:w-1/2 md:items-center md:justify-center lg:w-3/5">
        <Image
          src="/images/theme/sidebar-robotica.jpeg"
          alt=""
          fill
          sizes="60vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sidebar/80 via-sidebar/10 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <Link href={ROUTES.home} className="mb-8">
          <span className="font-fredoka text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
            {APP_NAME}
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}
