import * as navigation from 'next/navigation';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as navHooks from '@/hooks/use-nav-items/use-nav-items';
import type { NavItem } from '@/types/nav-items';
import { Footer } from './footer';

// Mock the next/navigation module
vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/'),
}));

// Mock the useNavItems hook
vi.mock('@/hooks/use-nav-items/use-nav-items', () => ({
  useNavItems: vi.fn(),
}));

// Mock the constants/routes module
vi.mock('@/constants/routes', () => {
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
      label: 'Admin',
      href: '/admin',
      target: false,
    },
  ];

  return {
    navItems: mockNavItems,
  };
});

describe('Footer', () => {
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
        items.filter((item) => !item.hidden && item.href !== '/admin'),
    });
  });

  it('renders the copyright text', () => {
    render(<Footer />);

    expect(screen.getByText(`Made with`)).toBeInTheDocument();
    expect(screen.getByText(`❤️`)).toBeInTheDocument();
    expect(screen.getByText(`by Emoji Map Team`)).toBeInTheDocument();
  });

  it('renders visible navigation items for non-admin users', () => {
    render(<Footer />);

    // Visible items should be rendered
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('External')).toBeInTheDocument();

    // Hidden items should not be rendered
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();

    // Admin items should not be rendered for non-admin users
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();

    // Check that links have the correct attributes
    const externalLink = screen.getByText('External');
    expect(externalLink).toHaveAttribute('href', 'https://example.com');
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders admin navigation items for admin users', () => {
    // Mock the useNavItems hook to return admin user implementation
    (navHooks.useNavItems as ReturnType<typeof vi.fn>).mockReturnValue({
      shouldShowNavItem: (item: NavItem) => {
        if (item.hidden) return false;
        return true; // Admin can see all non-hidden items
      },
      filterNavItems: (items: NavItem[]) =>
        items.filter((item) => !item.hidden),
    });

    render(<Footer />);

    // All non-hidden items should be rendered for admin users
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('External')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();

    // Hidden items should still not be rendered
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('applies active styles to the current path', () => {
    // Mock the usePathname hook to return a specific path
    const usePathnameMock = vi.spyOn(navigation, 'usePathname');
    usePathnameMock.mockReturnValue('/about');

    render(<Footer />);

    // The About link should have the active class
    const aboutLink = screen.getByText('About');
    expect(aboutLink).toHaveClass(
      'text-gray-900 dark:text-gray-100 font-medium'
    );

    // Other links should not have the active class
    const homeLink = screen.getByText('Home');
    expect(homeLink).not.toHaveClass(
      'text-gray-900 dark:text-gray-100 font-medium'
    );
  });
});
