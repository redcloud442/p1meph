import { package_table } from "@prisma/client";
import Link from "next/link";
import { Button } from "./button";
import { Card } from "./card";

type Props = {
  onClick: () => void;
  packageName: string;
  selectedPackage: package_table | null;
  packageDescription?: string;
  packagePercentage?: string;
  packageDays?: string;
  packageId?: string;
  href?: string;
  type?: string;
};

const PackageCard = ({
  packageId,
  packageName,
  selectedPackage,
  onClick,
  packageDescription,
  type,
  href,
}: Props) => {
  console.log(selectedPackage?.package_id, packageId);
  return (
    <Card
      onClick={onClick}
      className={`border w-full h-36 rounded-lg cursor-pointer shadow-lg p-6 flex flex-col items-center justify-center space-y-4 ${
        selectedPackage?.package_id === packageId
          ? "border-2 dark:border-primaryYellow"
          : ""
      }`}
    >
      <h2 className="text-xl font-bold z-10">{packageName}</h2>

      <p className="text-gray-600 text-center dark:text-white z-10">
        {packageDescription}
      </p>
      {/* <p className="text-2xl text-center font-extrabold text-gray-800 dark:text-white z-10">
        {packagePercentage} Earnings in {packageDays}{" "}
        {Number(packageDays) > 1 ? `Days` : ` Day`}
      </p> */}

      {href && type === "MEMBER" && (
        <Link href={href} className="w-full z-10">
          <Button className="w-full text-white font-semibold py-2">
            Select
          </Button>
        </Link>
      )}
    </Card>
  );
};

export default PackageCard;
