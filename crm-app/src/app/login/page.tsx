import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export const metadata = { title: "ログイン" };

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");
  return <LoginForm />;
}
