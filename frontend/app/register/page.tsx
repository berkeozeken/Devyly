import RegisterForm from "@/components/auth/RegisterForm";
import type { UserRole } from "@/types";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const params = await searchParams;
  const roleParam = typeof params.role === "string" ? params.role.toUpperCase() : "";
  const initialRole: UserRole = roleParam === "RECRUITER" ? "RECRUITER" : "DEVELOPER";
  return <RegisterForm initialRole={initialRole} />;
}
