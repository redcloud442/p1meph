import LoginPage from "@/components/loginPage/loginPage";
import { protectionRegisteredUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Pr1me Login",
  description: "Sign in to your Pr1me account",
  openGraph: {
    url: "/auth/login",
  },
};

const Page = async () => {
  const result = await protectionRegisteredUser();

  if (result?.redirect) {
    redirect("/");
  }

  return (
    <main className="max-w-full min-h-screen flex flex-col items-center justify-center bg-pageColor">
      <LoginPage />
    </main>
  );
};
export default Page;
