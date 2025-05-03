import { cn } from "@/lib/utils";

interface ProfileButtonProps {
  initials: string;
  onClick?: () => void;
  isActive?: boolean;
  turnOrder?: number;
  className?: string;
}

const ProfileButton = ({ 
  initials,
  onClick,
  isActive = false,
  turnOrder,
  className
}: ProfileButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-2 rounded-full hover:bg-gray-700 transition relative",
        isActive && "active-player",
        className
      )}
    >
      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">
        <span>{initials}</span>
      </div>
      
      {turnOrder !== undefined && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">
          <span>{turnOrder}</span>
        </div>
      )}
    </button>
  );
};

export default ProfileButton;
