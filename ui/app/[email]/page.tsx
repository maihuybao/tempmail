import { redirect, notFound } from "next/navigation";
import { getActiveDomains } from "@/app/actions/admin";

export default async function QuickAccessPage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email } = await params;
  const decoded = decodeURIComponent(email);

  if (!decoded.includes("@")) {
    notFound();
  }

  const [username, d] = decoded.split("@");
  const activeDomains = await getActiveDomains();

  if (!d || !activeDomains.includes(d.toLowerCase())) {
    notFound();
  }

  redirect(
    `/search?q=${encodeURIComponent(username.toLowerCase())}&d=${encodeURIComponent(d.toLowerCase())}`
  );
}
