import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "lucide-react";

interface WalletButtonProps {
  balance: number;
}

const WalletButton = ({ balance }: WalletButtonProps) => {
  return (
    <Link href="/wallet">
      <a className="bg-secondary text-primary px-4 py-2 rounded-lg font-sans font-semibold flex items-center hover:bg-secondary-dark transition-colors">
        <span>{formatCurrency(balance)}</span>
        <Wallet className="h-5 w-5 ml-2" />
      </a>
    </Link>
  );
};

export default WalletButton;
