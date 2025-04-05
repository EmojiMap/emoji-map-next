'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TextAlignRightIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useNavItems } from '@/hooks';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types/nav-items';
import { isNavItemActive } from '@/utils/nav/is-nav-item-active';
import { Logo } from '../logo/logo';

function NavLink({
  href,
  label,
  isActive,
  target,
  onClick,
}: {
  href: string;
  label: string;
  isActive: boolean;
  target?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      target={target ? '_blank' : undefined}
      rel={target ? 'noopener noreferrer' : undefined}
      className={cn(
        isActive ? 'font-bold' : 'font-light',
        'text-black dark:text-white hover:text-decoration-none hover:opacity-50 text-lg'
      )}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}

function NavItemWithChildren({
  navItem,
  path,
  onClick,
  shouldShowNavItem,
}: {
  navItem: NavItem;
  path: string;
  onClick: () => void;
  shouldShowNavItem: (item: NavItem) => boolean;
}) {
  const isActive = isNavItemActive(navItem.href, path);
  const filteredChildren = navItem.children?.filter(shouldShowNavItem) || [];

  if (filteredChildren.length === 0) {
    return (
      <NavLink
        href={navItem.href}
        label={navItem.label}
        isActive={isActive}
        target={navItem.target}
        onClick={onClick}
      />
    );
  }

  return (
    <details className='group'>
      <summary
        className={cn(
          isActive ? 'font-bold' : 'font-light',
          'hover:text-decoration-none hover:opacity-50 text-lg block w-full text-left cursor-pointer transition-all duration-300 ease-in-out'
        )}
      >
        {navItem.label}
      </summary>
      {filteredChildren.length > 0 && (
        <ul className='pl-4 mt-2 space-y-2 overflow-hidden max-h-0 opacity-0 transition-all duration-300 ease-in-out group-open:max-h-screen group-open:opacity-100'>
          {filteredChildren.map((child, index) => (
            <li
              key={`${child.label}-${index}`}
              className='child-item'
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <NavLink
                href={child.href}
                label={child.label}
                isActive={isNavItemActive(child.href, path)}
                target={child.target}
                onClick={onClick}
              />
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

export function MobileNav({ navItems }: { navItems: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const { shouldShowNavItem, filterNavItems } = useNavItems();
  const filteredNavItems = filterNavItems(navItems);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          aria-label='Open Menu'
          variant='ghost'
          className='w-[1.75rem] p-5 focus-visible:ring-1 focus-visible:ring-offset-1 hover:bg-[#2a3480]/10'
        >
          <TextAlignRightIcon className='dark:text-white text-black' />
        </Button>
      </SheetTrigger>
      <SheetContent className='bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900 dark:via-purple-900 dark:to-pink-800 border-none text-white'>
        <SheetHeader>
          <div className='mr-6 ml-auto'>
            <Logo />
          </div>
          <div className='sr-only'>
            <SheetTitle>Main Navigation</SheetTitle>
            <SheetDescription>Navigate to the website pages</SheetDescription>
          </div>
        </SheetHeader>
        <nav className='pt-10 pb-20'>
          <div className='container'>
            <ul className='list-none text-left space-y-3'>
              {filteredNavItems.map((navItem, index) => {
                const isActive = isNavItemActive(navItem.href, path);

                return (
                  <li key={`${navItem.label}-${index}`}>
                    {/* If no children, render Link directly */}
                    {navItem.children ? (
                      <NavItemWithChildren
                        navItem={navItem}
                        path={path}
                        onClick={() => setOpen(false)}
                        shouldShowNavItem={shouldShowNavItem}
                      />
                    ) : (
                      <NavLink
                        href={navItem.href}
                        label={navItem.label}
                        isActive={isActive}
                        target={navItem.target}
                        onClick={() => setOpen(false)}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
