import { useUser } from '@clerk/nextjs';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NavItem } from '@/types/nav-items';
import { useNavItems } from './use-nav-items';

// Mock the Clerk hook
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
}));

describe('useNavItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should filter out hidden nav items', () => {
    // Mock the useUser hook to return non-admin user
    (useUser as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        publicMetadata: {
          admin: false,
        },
      },
    });

    const navItems: NavItem[] = [
      { label: 'Visible', href: '/visible', target: false },
      { label: 'Hidden', href: '/hidden', target: false, hidden: true },
    ];

    const { result } = renderHook(() => useNavItems());

    // Test the shouldShowNavItem function
    expect(result.current.shouldShowNavItem(navItems[0])).toBe(true);
    expect(result.current.shouldShowNavItem(navItems[1])).toBe(false);

    // Test the filterNavItems function
    const filtered = result.current.filterNavItems(navItems);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].label).toBe('Visible');
  });

  it('should hide admin nav items for non-admin users', () => {
    // Mock the useUser hook to return non-admin user
    (useUser as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        publicMetadata: {
          admin: false,
        },
      },
    });

    const navItems: NavItem[] = [
      { label: 'Home', href: '/', target: false },
      { label: 'Admin', href: '/admin', target: false },
    ];

    const { result } = renderHook(() => useNavItems());

    // Test the shouldShowNavItem function
    expect(result.current.shouldShowNavItem(navItems[0])).toBe(true);
    expect(result.current.shouldShowNavItem(navItems[1])).toBe(false);

    // Test the filterNavItems function
    const filtered = result.current.filterNavItems(navItems);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].label).toBe('Home');
  });

  it('should show admin nav items for admin users', () => {
    // Mock the useUser hook to return admin user
    (useUser as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        publicMetadata: {
          admin: true,
        },
      },
    });

    const navItems: NavItem[] = [
      { label: 'Home', href: '/', target: false },
      { label: 'Admin', href: '/admin', target: false },
    ];

    const { result } = renderHook(() => useNavItems());

    // Test the shouldShowNavItem function
    expect(result.current.shouldShowNavItem(navItems[0])).toBe(true);
    expect(result.current.shouldShowNavItem(navItems[1])).toBe(true);

    // Test the filterNavItems function
    const filtered = result.current.filterNavItems(navItems);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].label).toBe('Home');
    expect(filtered[1].label).toBe('Admin');
  });

  it('should recursively filter children of nav items', () => {
    // Mock the useUser hook to return non-admin user
    (useUser as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        publicMetadata: {
          admin: false,
        },
      },
    });

    const navItems: NavItem[] = [
      {
        label: 'Parent',
        href: '/parent',
        target: false,
        children: [
          { label: 'Child1', href: '/child1', target: false },
          { label: 'Admin Child', href: '/admin', target: false },
          {
            label: 'Hidden Child',
            href: '/hidden',
            target: false,
            hidden: true,
          },
        ],
      },
    ];

    const { result } = renderHook(() => useNavItems());

    // Test the filterNavItems function
    const filtered = result.current.filterNavItems(navItems);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].label).toBe('Parent');
    expect(filtered[0].children).toHaveLength(1);
    expect(filtered[0].children?.[0].label).toBe('Child1');
  });
});
