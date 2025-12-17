import { Button } from "@/components/ui/button";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup';
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const GoogleSignInButton = ({ 
  mode = 'signin',
  className = '',
  onSuccess,
  onError 
}: GoogleSignInButtonProps) => {
  const { signInWithGoogle, loading } = useGoogleAuth();

  const handleClick = async () => {
    const result = await signInWithGoogle();
    
    if (result.success) {
      onSuccess?.();
    } else if (result.error) {
      onError?.(result.error);
    }
  };

  const buttonText = mode === 'signin' 
    ? 'Continuar con Google' 
    : 'Registrarse con Google';

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full relative ${className}`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <FcGoogle className="mr-2 h-5 w-5" />
      )}
      {loading ? 'Conectando...' : buttonText}
    </Button>
  );
};
