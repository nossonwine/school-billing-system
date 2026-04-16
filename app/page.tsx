import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If not logged in, go to login
  if (!session) {
    redirect("/login");
  }

  // If Admin, go to dashboard. If Parent, go to portal.
  const role = (session.user as any)?.role;
  if (role === "ADMIN") {
    redirect("/students");
  } else {
    redirect("/portal");
  }
}