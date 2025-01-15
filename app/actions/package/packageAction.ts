"use server";

import { applyRateLimitMember } from "@/utils/function";
import prisma from "@/utils/prisma";
import { protectionMemberUser } from "@/utils/serversideProtection";
import { z } from "zod";

const availPackageSchema = z.object({
  amount: z.number().min(1),
  earnings: z.number(),
  packageConnectionId: z.string().uuid(),
});

export const claimPackage = async (params: {
  packageConnectionId: string;
  amount: number;
  earnings: number;
}) => {
  try {
    const { packageConnectionId, amount, earnings } = params;

    const parsedData = availPackageSchema.safeParse({
      amount,
      packageConnectionId,
      earnings,
    });

    if (!parsedData.success) {
      throw new Error("Invalid request");
    }

    const { teamMemberProfile } = await protectionMemberUser();
    if (!teamMemberProfile) {
      throw new Error("User authentication failed.");
    }

    await applyRateLimitMember(teamMemberProfile.alliance_member_id);

    const packageConnection =
      await prisma.package_member_connection_table.findUnique({
        where: { package_member_connection_id: packageConnectionId },
      });

    if (!packageConnection) {
      throw new Error("Package connection not found.");
    }

    if (packageConnection.package_member_status === "ENDED") {
      throw new Error("Invalid request. Package already ended.");
    }

    // if (!packageConnection.package_member_is_ready_to_claim) {
    //   throw new Error("Invalid request. Package is not ready to claim.");
    // }

    const totalClaimedAmount =
      packageConnection.package_member_amount +
      packageConnection.package_amount_earnings;
    const totalAmountToBeClaimed = amount + earnings;

    if (totalClaimedAmount !== totalAmountToBeClaimed) {
      throw new Error("Invalid request");
    }

    await prisma.$transaction(async (tx) => {
      await tx.package_member_connection_table.update({
        where: { package_member_connection_id: packageConnectionId },
        data: { package_member_status: "ENDED" },
      });

      await tx.alliance_earnings_table.update({
        where: {
          alliance_earnings_member_id: teamMemberProfile.alliance_member_id,
        },
        data: {
          alliance_olympus_earnings: { increment: totalClaimedAmount },
          alliance_combined_earnings: { increment: totalClaimedAmount },
        },
      });

      await tx.alliance_transaction_table.create({
        data: {
          transaction_member_id: teamMemberProfile.alliance_member_id,
          transaction_amount: totalClaimedAmount,
          transaction_description: "Package Claimed",
        },
      });

      await tx.package_earnings_log.create({
        data: {
          package_member_connection_id: packageConnectionId,
          package_member_package_id:
            packageConnection.package_member_package_id,
          package_member_member_id: teamMemberProfile.alliance_member_id,
          package_member_connection_created:
            packageConnection.package_member_connection_created,
          package_member_amount: packageConnection.package_member_amount,
          package_member_amount_earnings: earnings,
          package_member_status: "ENDED",
        },
      });
    });

    return { success: true, totalClaimedAmount };
  } catch (error) {
    throw new Error("Internal server error");
  }
};
