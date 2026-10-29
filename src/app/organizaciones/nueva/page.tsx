import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { NewOrganizationForm } from "./form";

export default async function NewOrganizationPage() {
  if (!(await getCurrentUser())) redirect("/");

  return (
    <main>
      <h1>Nueva organización</h1>
      <NewOrganizationForm />
    </main>
  );
}
