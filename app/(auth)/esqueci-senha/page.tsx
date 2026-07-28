import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { APP_NAME, ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-12">
      <Link href={ROUTES.home} className="mb-8">
        <span className="font-fredoka text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
          {APP_NAME}
        </span>
      </Link>
      <ForgotPasswordForm />
    </div>
  );
}
