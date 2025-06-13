import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WalletButtonProps {
  balance: number;
  currency?: string;
}

const WalletButton = ({ balance, currency = 'NGN' }: WalletButtonProps) => {
  return (
    <Link href="/wallet">
      <Button variant="secondary" className="text-primary font-sans font-semibold flex items-center">
        <span>{formatCurrency(balance, currency)}</span>
        <Wallet className="h-5 w-5 ml-2" />
      </Button>
    </Link>
  );
};

export default WalletButton;
