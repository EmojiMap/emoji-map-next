import { useUser } from '@clerk/nextjs';
import type { NavItem } from '@/types/nav-items';

export function useNavItems() {
  const { user } = useUser();
  const isAdmin = Boolean(user?.publicMetadata?.admin);

  const shouldShowNavItem = (navItem: NavItem): boolean => {
    // Don't show hidden items
    if (navItem.hidden) return false;

    // Only show admin nav items if user is admin
    if (navItem.href === '/admin' && !isAdmin) return false;

    // No feature flag or hidden flag, show the item
    return true;
  };

  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items.filter(shouldShowNavItem).map((item) => {
      if (item.children && item.children.length > 0) {
        // Filter children recursively
        const filteredChildren = item.children.filter(shouldShowNavItem);
        return { ...item, children: filteredChildren };
      }
      return item;
    });
  };

  return {
    shouldShowNavItem,
    filterNavItems,
  };
}
