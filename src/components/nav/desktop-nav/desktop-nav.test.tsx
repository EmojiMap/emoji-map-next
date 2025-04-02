import * as navigation from 'next/navigation';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as navHooks from '@/hooks/use-nav-items/use-nav-items';
import type { NavItem } from '@/types/nav-items';
import { DesktopNav } from './desktop-nav';

// Mock the next/navigation module
vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/'),
}));

// Mock the useNavItems hook
vi.mock('@/hooks/use-nav-items/use-nav-items', () => ({
  useNavItems: vi.fn(),
}));

// Mock the lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid='chevron-down'>▼</span>,
}));

describe('DesktopNav', () => {
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

  it('renders visible navigation items for non-admin users', () => {
    render(<DesktopNav navItems={mockNavItems} />);

    // Visible items should be rendered
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('External')).toBeInTheDocument();
    expect(screen.getByText('With Children')).toBeInTheDocument();

    // Hidden items should not be rendered
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();

    // Admin items should not be rendered for non-admin users
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Child')).not.toBeInTheDocument();
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

    render(<DesktopNav navItems={mockNavItems} />);

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

    render(<DesktopNav navItems={mockNavItems} />);

    // The About link should have the active class
    const aboutLink = screen.getByText('About').closest('a');
    expect(aboutLink).toHaveClass(
      'text-slate-600 dark:text-white font-semibold'
    );

    // Other links should not have the active class
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).not.toHaveClass(
      'text-slate-600 dark:text-white font-semibold'
    );
  });

  it('renders external links with target="_blank" and rel attributes', () => {
    render(<DesktopNav navItems={mockNavItems} />);

    const externalLink = screen.getByText('External').closest('a');
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders dropdown indicators and child items for items with children', () => {
    render(<DesktopNav navItems={mockNavItems} />);

    // Should have a chevron icon
    const chevrons = screen.getAllByTestId('chevron-down');
    expect(chevrons.length).toBeGreaterThan(0);

    // Should have a dropdown container
    const dropdown = screen.getByTestId('nav-child');
    expect(dropdown).toBeInTheDocument();

    // Should contain child links
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();

    // Hidden child should not be rendered
    expect(screen.queryByText('Hidden Child')).not.toBeInTheDocument();
  });
});
