import { redirect } from "next/navigation";
import { SignInPage } from "@/components/auth/SignInPage";

export default function Home() {
  return <SignInPage />;
}
