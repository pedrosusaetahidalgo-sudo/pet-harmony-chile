import { Button } from '@/components/ui/button';
import { useAppleAuth } from '@/hooks/useAppleAuth';
import { Loader2 } from '@/lib/icons';
import { FaApple } from 'react-icons/fa';

interface AppleSignInButtonProps {
  mode?: 'signin' | 'signup';
  className?: string;
}

export const AppleSignInButton = ({ mode = 'signin', className = '' }: AppleSignInButtonProps) => {
  const { signInWithApple, loading } = useAppleAuth();

  const buttonText = mode === 'signin' ? 'Continuar con Apple' : 'Registrarse con Apple';

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full relative bg-black text-white hover:bg-gray-900 hover:text-white border-black ${className}`}
      onClick={() => signInWithApple()}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <FaApple className="mr-2 h-5 w-5" />
      )}
      {loading ? 'Conectando...' : buttonText}
    </Button>
  );
};
