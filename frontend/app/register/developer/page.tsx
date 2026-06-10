import { redirect } from "next/navigation";

export default function DeveloperRegisterPage() {
  redirect("/register?role=developer");
}
