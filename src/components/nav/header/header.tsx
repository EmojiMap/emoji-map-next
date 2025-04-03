import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { ThemedSignInButton } from '@/components/auth/themed-signin-button';
import ThemedUserButton from '@/components/auth/themed-user-button';
import { Button } from '@/components/ui/button';
import { navItems } from '@/constants/routes';
import { useNavItems } from '@/hooks/use-nav-items/use-nav-items';
import { cn } from '@/lib/utils';
import { DesktopNav } from '../desktop-nav/desktop-nav';
import { Logo } from '../logo/logo';
import { MobileNav } from '../mobile-nav/mobile-nav';
import { ModeToggle } from '../mode-toggle/mode-toggle';

/**
 * Props for the Header component
 * @interface HeaderProps
 * @property {boolean} [showAuth=false] - Whether to show authentication components instead of the logo
 */
interface HeaderProps {
  showAuth?: boolean;
  className?: string;
}

/**
 * Header component that displays either a logo or authentication components,
 * along with navigation and theme toggle.
 *
 * @param {HeaderProps} props - Component props
 * @param {boolean} [props.showAuth=false] - When true, displays auth components instead of logo
 * @returns {JSX.Element} Header component
 */
export function Header({ showAuth = false, className }: HeaderProps) {
  const { filterNavItems } = useNavItems();
  const filteredNavItems = filterNavItems(navItems);

  return (
    <header
      className={cn(
        `sticky top-0 w-full z-50`,
        'bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900 dark:via-purple-900 dark:to-pink-800 border-none',
        className
      )}
    >
      <div className='container flex items-center justify-between h-16'>
        {showAuth ? (
          <>
            <SignedOut>
              <ThemedSignInButton>
                <Button type='button' variant='default'>
                  Sign In
                </Button>
              </ThemedSignInButton>
            </SignedOut>
            <SignedIn>
              <ThemedUserButton />
            </SignedIn>
          </>
        ) : (
          <Link href='/' aria-label='Home page' className='py-2'>
            <Logo />
          </Link>
        )}
        <div className='hidden xl:flex gap-7 items-center justify-between'>
          <DesktopNav navItems={filteredNavItems} />
          <ModeToggle />
        </div>
        <div className='flex items-center xl:hidden'>
          <ModeToggle />
          <MobileNav navItems={filteredNavItems} />
        </div>
      </div>
    </header>
  );
}
