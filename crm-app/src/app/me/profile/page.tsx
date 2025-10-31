import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ProfilePanel from "./profile-panel";

export const metadata = {
  title: "プロフィール",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <ProfilePanel
      name={session.user.name ?? ""}
      email={session.user.email ?? ""}
      role={session.user.role ?? "member"}
    />
  );
}

