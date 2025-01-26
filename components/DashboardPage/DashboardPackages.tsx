"use client";

import { claimPackage } from "@/app/actions/package/packageAction";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { usePackageChartData } from "@/store/usePackageChartData";
import { useUserTransactionHistoryStore } from "@/store/useTransactionStore";
import { useUserDashboardEarningsStore } from "@/store/useUserDashboardEarnings";
import { useUserEarningsStore } from "@/store/useUserEarningsStore";
import { ChartDataMember } from "@/utils/types";
import { alliance_member_table } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

type DashboardPackagesProps = {
  teamMemberProfile: alliance_member_table;
};

const DashboardPackages = ({ teamMemberProfile }: DashboardPackagesProps) => {
  const { toast } = useToast();
  const { earnings, setEarnings } = useUserEarningsStore();
  const { chartData, setChartData } = usePackageChartData();
  const { totalEarnings, setTotalEarnings } = useUserDashboardEarningsStore();
  const { setAddTransactionHistory } = useUserTransactionHistoryStore();
  const [openDialogId, setOpenDialogId] = useState<string | null>(null); // Track which dialog is open
  const [isLoading, setIsLoading] = useState<string | null>(null); // Track loading state for specific packages

  const handleClaimPackage = async (packageData: ChartDataMember) => {
    const { amount, profit_amount, package_connection_id } = packageData;

    try {
      setIsLoading(package_connection_id); // Indicate the specific package is being claimed
      const response = await claimPackage({
        packageConnectionId: package_connection_id,
        amount,
        earnings: profit_amount,
      });

      if (response.success) {
        toast({
          title: "Package claimed successfully",
          description: "You have successfully claimed the package",
        });

        // Update chart data to remove the claimed package
        setChartData(
          chartData.filter(
            (data) => data.package_connection_id !== package_connection_id
          )
        );

        const newEarnings = amount + profit_amount;
        // Update earnings
        if (earnings) {
          setEarnings({
            ...earnings,
            alliance_earnings_id: earnings.alliance_earnings_id || "",
            alliance_olympus_wallet: earnings.alliance_olympus_wallet || 0,
            alliance_olympus_earnings:
              earnings.alliance_olympus_earnings + newEarnings,
            alliance_referral_bounty: earnings.alliance_referral_bounty || 0,
            alliance_combined_earnings:
              earnings.alliance_combined_earnings + newEarnings,
            alliance_earnings_member_id:
              earnings.alliance_earnings_member_id || "",
          });
        }

        setAddTransactionHistory({
          data: [
            {
              transaction_id: uuidv4(),
              transaction_date: new Date(),
              transaction_description: ` ${packageData.package} Package Claimed`,
              transaction_details: "",
              transaction_amount: newEarnings,
              transaction_member_id: teamMemberProfile.alliance_member_id,
            },
          ],
          count: 1,
        });

        // Update total earnings
        setTotalEarnings({
          ...totalEarnings!,
          totalEarnings: totalEarnings!.totalEarnings + newEarnings,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to claim package",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null); // Clear loading state
    }
  };

  return (
    <ScrollArea className="w-full pb-10">
      <div className="flex grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {chartData.map((data) => (
          <Card
            key={data.package_connection_id}
            style={{
              background: `linear-gradient(110deg, ${
                data.package_color || "#F6DB4E"
              } 60%, #ED9738)`,
            }}
            className="min-w-[260px] max-w-[500px] h-auto dark:bg-cardColor transition-all duration-300"
          >
            <CardHeader>
              <CardTitle className="flex justify-end items-end">
                <div className="text-xs rounded-full bg-black p-2">
                  {data.completion.toFixed(2)}%
                </div>
              </CardTitle>
              <CardDescription className="space-y-2">
                <div className="flex justify-between items-center">
                  <Badge className="dark:bg-black dark:text-white min-w-[80px] text-center flex items-center justify-center">
                    Amount
                  </Badge>
                  <span className="text-lg font-extrabold text-black">
                    ₱{" "}
                    {data.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge className="dark:bg-black dark:text-white min-w-[80px] text-center flex items-center justify-center">
                    Profit
                  </Badge>
                  <span className="text-lg font-extrabold text-black">
                    ₱{" "}
                    {data.profit_amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </CardDescription>
              <Separator />
            </CardHeader>

            <CardContent className="space-y-1 pb-0">
              <div className="flex flex-col items-center">
                <Badge className="dark:bg-black dark:text-white dark:hover:bg-black hover:bg-black hover:text-white">
                  Total Amount
                </Badge>
                <span className="text-2xl font-extrabold text-black">
                  ₱{" "}
                  {(data.amount + data.profit_amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-xl text-black font-extrabold">
                  {data.package} Plan
                </span>
              </div>
              <Separator />
            </CardContent>

            <CardFooter className="flex-col items-center gap-2 text-sm">
              <div className="font-extrabold text-sm text-black">
                {new Intl.DateTimeFormat("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(data.completion_date))}
              </div>
              {data.is_ready_to_claim && (
                <Dialog
                  open={openDialogId === data.package_connection_id}
                  onOpenChange={(isOpen) =>
                    setOpenDialogId(isOpen ? data.package_connection_id : null)
                  }
                >
                  <DialogDescription></DialogDescription>
                  <DialogTrigger asChild>
                    <Button className="dark:bg-black dark:text-white dark:hover:bg-black hover:bg-black hover:text-white cursor-pointer px-10 py-2">
                      Collect
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-bold mb-4">
                        Collect Package
                      </DialogTitle>
                      Are you sure you want to collect this package?
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        disabled={isLoading === data.package_connection_id}
                        onClick={() => handleClaimPackage(data)}
                        className="w-full"
                        variant="card"
                      >
                        {isLoading === data.package_connection_id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {"Collecting ..."}
                          </>
                        ) : (
                          "Collect"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default DashboardPackages;
