import AllyBountyPage from "@/components/AllyBountyPage/AllyBountyPage";
import { protectionAllUser } from "@/utils/serversideProtection";
import { createClientServerSide } from "@/utils/supabase/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
export const metadata: Metadata = {
  title: "Direct Referral",
  description: "Direct Referral Page",
  openGraph: {
    url: "/direct-referral",
  },
};

const Page = async () => {
  const supabase = await createClientServerSide();
  const { teamMemberProfile } = await protectionAllUser();

  if (!teamMemberProfile) return redirect("/500");
  if (teamMemberProfile) {
    redirect("/");
  }

  const { data } = await supabase.rpc("get_direct_sponsor", {
    input_data: {
      teamMemberId: "",
    },
  });

  return (
    <AllyBountyPage
      teamMemberProfile={teamMemberProfile}
      sponsor={(data as string) || ""}
    />
  );
};

export default Page;
