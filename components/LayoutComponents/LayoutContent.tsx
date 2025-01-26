"use client";

import MobileNavBar from "@/components/ui/MobileNavBar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getAllyBounty, getLegionBounty } from "@/services/Bounty/Member";
import { getDashboard } from "@/services/Dasboard/Member";
import { getTransactionHistory } from "@/services/Transaction/Transaction";
import { getUserEarnings, getUserWithdrawalToday } from "@/services/User/User";
import { useDirectReferralStore } from "@/store/useDirectReferralStore";
import { useIndirectReferralStore } from "@/store/useIndirrectReferralStore";
import { useUserLoadingStore } from "@/store/useLoadingStore";
import { usePackageChartData } from "@/store/usePackageChartData";
import { useUserTransactionHistoryStore } from "@/store/useTransactionStore";
import { useUserDashboardEarningsStore } from "@/store/useUserDashboardEarnings";
import { useUserEarningsStore } from "@/store/useUserEarningsStore";
import { useUserHaveAlreadyWithdraw } from "@/store/useWithdrawalToday";
import { ROLE } from "@/utils/constant";
import { useRole } from "@/utils/context/roleContext";
import { createClientSide } from "@/utils/supabase/client";
import { alliance_member_table, user_table } from "@prisma/client";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect } from "react";
import AppSidebar from "../ui/side-bar";
import { ModeToggle } from "../ui/toggleDarkmode";

type LayoutContentProps = {
  profile: user_table;
  teamMemberProfile: alliance_member_table;
  children: React.ReactNode;
};

export default function LayoutContent({
  profile,
  teamMemberProfile,
  children,
}: LayoutContentProps) {
  const supabaseClient = createClientSide();
  const { role } = useRole();
  const { setTransactionHistory } = useUserTransactionHistoryStore();
  const { setTotalEarnings } = useUserDashboardEarningsStore();
  const { setEarnings } = useUserEarningsStore();
  const { setLoading } = useUserLoadingStore();
  const { setChartData } = usePackageChartData();
  const { setDirectReferral } = useDirectReferralStore();
  const { setIndirectReferral } = useIndirectReferralStore();
  const { setIsWithdrawalToday } = useUserHaveAlreadyWithdraw();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (role !== ROLE.ADMIN) {
      setTheme("dark"); // Default to light mode for other roles
    }
  }, [role, setTheme]);

  useEffect(() => {
    const handleFetchTransaction = async () => {
      if (role === ROLE.ADMIN) return;
      try {
        setLoading(true);

        const { totalEarnings, userEarningsData } = await getUserEarnings({
          memberId: teamMemberProfile.alliance_member_id,
        });

        setTotalEarnings(totalEarnings);

        setEarnings(userEarningsData);

        const { data } = await getDashboard(supabaseClient, {
          teamMemberId: teamMemberProfile.alliance_member_id,
        });

        setChartData(data);

        const { transactionHistory, totalTransactions } =
          await getTransactionHistory({
            limit: 10,
            page: 1,
          });

        setTransactionHistory({
          data: transactionHistory,
          count: totalTransactions,
        });

        const { data: bountyData, totalCount: bountyTotalCount } =
          await getAllyBounty({
            page: 1,
            limit: 10,
            teamMemberId: teamMemberProfile.alliance_member_id,
            columnAccessor: "user_date_created",
            isAscendingSort: true,
          });

        setDirectReferral({
          data: bountyData,
          count: bountyTotalCount,
        });

        const { data: legionBountyData, totalCount: legionBountyTotalCount } =
          await getLegionBounty({
            page: 1,
            limit: 10,
            teamMemberId: teamMemberProfile.alliance_member_id,
            columnAccessor: "user_date_created",
            isAscendingSort: true,
          });

        setIndirectReferral({
          data: legionBountyData,
          count: legionBountyTotalCount,
        });

        const isWithdrawalToday = await getUserWithdrawalToday({
          userId: teamMemberProfile.alliance_member_id,
        });

        setIsWithdrawalToday(isWithdrawalToday);

        setLoading(false);
      } catch (e) {
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    handleFetchTransaction();
  }, [role]);

  return (
    <div className="flex min-h-screen w-full overflow-hidden relative">
      {role === ROLE.ADMIN && (
        <div>
          <AppSidebar
            userData={profile}
            teamMemberProfile={teamMemberProfile}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-x-auto relative">
        {role === ROLE.ADMIN && (
          <div className="p-4 md:hidden">
            <SidebarTrigger />
          </div>
        )}

        {role !== ROLE.ADMIN && (
          <div className="absolute inset-0 -z-10">
            {/* Background Image */}
            <Image
              src="/assets/bg-primary.jpeg"
              alt="Background"
              quality={100}
              fill
              priority
              className="object-cover"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-zinc-900/80 dark:bg-zinc-900/90"></div>
          </div>
        )}

        {/* Content Section */}
        <div className="pb-24 p-4 relative z-50 flex-grow">{children}</div>

        {/* Mobile Navigation */}
        {role !== ROLE.ADMIN && <MobileNavBar />}
        {role === ROLE.ADMIN && <ModeToggle />}
      </div>
    </div>
  );
}
