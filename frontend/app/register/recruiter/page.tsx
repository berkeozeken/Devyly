import { redirect } from "next/navigation";

export default function RecruiterRegisterPage() {
  redirect("/register?role=recruiter");
}
