import * as navigation from 'next/navigation';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as navHooks from '@/hooks/use-nav-items/use-nav-items';
import type { NavItem } from '@/types/nav-items';
import { MobileNav } from './mobile-nav';

// Mock the next/navigation module
vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/'),
}));

// Mock the useNavItems hook
vi.mock('@/hooks/use-nav-items/use-nav-items', () => ({
  useNavItems: vi.fn(),
}));

// Mock the components used by MobileNav
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props} data-testid='mobile-menu-button'>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({
    children,
    open,
  }: React.PropsWithChildren<{
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
  }>) => (
    <div data-testid='sheet' data-open={open}>
      {children}
    </div>
  ),
  SheetTrigger: ({
    children,
    asChild,
  }: React.PropsWithChildren<{ asChild?: boolean }>) => (
    <div data-testid='sheet-trigger' data-aschild={asChild}>
      {children}
    </div>
  ),
  SheetContent: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid='sheet-content' className={className}>
      {children}
    </div>
  ),
  SheetHeader: ({ children }: React.PropsWithChildren) => (
    <div data-testid='sheet-header'>{children}</div>
  ),
  SheetTitle: ({ children }: React.PropsWithChildren) => (
    <div data-testid='sheet-title'>{children}</div>
  ),
  SheetDescription: ({ children }: React.PropsWithChildren) => (
    <div data-testid='sheet-description'>{children}</div>
  ),
}));

vi.mock('@radix-ui/react-icons', () => ({
  TextAlignRightIcon: () => <span data-testid='menu-icon'>☰</span>,
}));

vi.mock('../logo/logo', () => ({
  Logo: () => <div data-testid='logo'>Logo</div>,
}));

describe('MobileNav', () => {
  const mockNavItems: NavItem[] = [
    {
      label: 'Home',
      href: '/',
      target: false,
    },
    {
      label: 'About',
      href: '/about',
      target: false,
    },
    {
      label: 'External',
      href: 'https://example.com',
      target: true,
    },
    {
      label: 'Hidden',
      href: '/hidden',
      target: false,
      hidden: true,
    },
    {
      label: 'With Children',
      href: '/parent',
      target: false,
      children: [
        {
          label: 'Child 1',
          href: '/parent/child1',
          target: false,
        },
        {
          label: 'Child 2',
          href: '/parent/child2',
          target: true,
        },
        {
          label: 'Hidden Child',
          href: '/parent/hidden',
          target: false,
          hidden: true,
        },
        {
          label: 'Admin Child',
          href: '/admin',
          target: false,
        },
      ],
    },
    {
      label: 'Admin',
      href: '/admin',
      target: false,
    },
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock implementation for non-admin user
    (navHooks.useNavItems as ReturnType<typeof vi.fn>).mockReturnValue({
      shouldShowNavItem: (item: NavItem) => {
        if (item.hidden) return false;
        if (item.href === '/admin') return false;
        return true;
      },
      filterNavItems: (items: NavItem[]) =>
        items.filter((item) => {
          if (item.hidden) return false;
          if (item.href === '/admin') return false;
          if (item.children) {
            return {
              ...item,
              children: item.children.filter(
                (child) => !child.hidden && child.href !== '/admin'
              ),
            };
          }
          return true;
        }),
    });
  });

  it('renders a button to open the mobile menu', () => {
    render(<MobileNav navItems={mockNavItems} />);

    const menuButton = screen.getByTestId('mobile-menu-button');
    expect(menuButton).toBeInTheDocument();
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
  });

  it('renders the sheet content with navigation items for non-admin users', () => {
    render(<MobileNav navItems={mockNavItems} />);

    const sheetContent = screen.getByTestId('sheet-content');
    expect(sheetContent).toBeInTheDocument();

    // Logo should be in the header
    expect(screen.getByTestId('logo')).toBeInTheDocument();

    // Navigation items should be rendered (except hidden and admin ones)
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('External')).toBeInTheDocument();
    expect(screen.getByText('With Children')).toBeInTheDocument();

    // Hidden items should not be rendered
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();

    // Admin items should not be rendered for non-admin users
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Child')).not.toBeInTheDocument();

    // Child items should be rendered correctly
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.queryByText('Hidden Child')).not.toBeInTheDocument();
  });

  it('renders admin navigation items for admin users', () => {
    // Mock the useNavItems hook to return admin user implementation
    (navHooks.useNavItems as ReturnType<typeof vi.fn>).mockReturnValue({
      shouldShowNavItem: (item: NavItem) => {
        if (item.hidden) return false;
        return true; // Admin can see all non-hidden items
      },
      filterNavItems: (items: NavItem[]) =>
        items.filter((item) => {
          if (item.hidden) return false;
          if (item.children) {
            return {
              ...item,
              children: item.children.filter((child) => !child.hidden),
            };
          }
          return true;
        }),
    });

    render(<MobileNav navItems={mockNavItems} />);

    // All non-hidden items should be rendered for admin users
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('External')).toBeInTheDocument();
    expect(screen.getByText('With Children')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();

    // Admin child items should be rendered
    expect(screen.getByText('Admin Child')).toBeInTheDocument();

    // Hidden items should still not be rendered
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden Child')).not.toBeInTheDocument();
  });

  it('applies active styles to the current path', () => {
    // Mock the usePathname hook to return a specific path
    const usePathnameMock = vi.spyOn(navigation, 'usePathname');
    usePathnameMock.mockReturnValue('/about');

    render(<MobileNav navItems={mockNavItems} />);

    // Find all links
    const links = screen.getAllByRole('link');

    // Find the About link
    const aboutLink = links.find((link) => link.textContent === 'About');
    expect(aboutLink).toHaveClass('font-bold');

    // Other links should not have the active class
    const homeLink = links.find((link) => link.textContent === 'Home');
    expect(homeLink).not.toHaveClass('font-bold');
  });
});
