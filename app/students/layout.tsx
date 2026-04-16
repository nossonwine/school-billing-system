import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function StudentsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  // THE LOCK: Kicks out anyone who isn't the Admin
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/login");
  }

  return <>{children}</>;
}