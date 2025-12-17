import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useFollows } from "@/hooks/useFollows";
import { useAuth } from "@/hooks/useAuth";

interface FollowButtonProps {
  targetUserId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const FollowButton = ({ 
  targetUserId, 
  variant = "default",
  size = "md",
  showIcon = true 
}: FollowButtonProps) => {
  const { user } = useAuth();
  const { followStatus, follow, unfollow, isFollowing } = useFollows(targetUserId);

  // Don't show button if viewing own profile
  if (!user || user.id === targetUserId) {
    return null;
  }

  if (!followStatus) {
    return null;
  }

  const handleClick = () => {
    if (followStatus.isFollowing) {
      unfollow();
    } else {
      follow();
    }
  };

  const sizeClasses = {
    sm: "h-8 text-xs px-3",
    md: "h-9 text-sm px-4",
    lg: "h-10 text-base px-6",
  };

  return (
    <Button
      variant={followStatus.isFollowing ? "outline" : variant}
      onClick={handleClick}
      disabled={isFollowing}
      className={sizeClasses[size]}
    >
      {isFollowing ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : showIcon ? (
        followStatus.isFollowing ? (
          <UserCheck className="h-4 w-4 mr-2" />
        ) : (
          <UserPlus className="h-4 w-4 mr-2" />
        )
      ) : null}
      {followStatus.isFollowing ? "Siguiendo" : "Seguir"}
    </Button>
  );
};

export default FollowButton;

