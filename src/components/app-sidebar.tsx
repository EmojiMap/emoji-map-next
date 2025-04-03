'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, UserButton, useUser } from '@clerk/nextjs';
import { ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { ADMIN_SIDEBAR_DATA } from '@/constants/admin-sitemap';
import type {
  AdminSidebarGroup,
  AdminSidebarItem,
} from '@/types/admin-sidebar-item';
import { ModeToggle } from './nav/mode-toggle/mode-toggle';

function WrappedUserButton() {
  const { user } = useUser();

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName}`
    : user?.emailAddresses[0].emailAddress;

  return (
    <SidebarMenuButton size='lg' asChild>
      <div className='inline-block'>
        <UserButton />
        {/* Name / Email */}
        <div>{displayName}</div>
      </div>
    </SidebarMenuButton>
  );
}

function isGroup(
  item: AdminSidebarItem | AdminSidebarGroup
): item is AdminSidebarGroup {
  return 'items' in item;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      {/* Header (Replace with Clerk User Component) */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SignedIn>
              <WrappedUserButton />
            </SignedIn>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className='gap-0'>
        {ADMIN_SIDEBAR_DATA.navMain.map((section) => (
          <Collapsible
            key={section.title}
            defaultOpen
            className='group/collapsible'
          >
            <SidebarGroup>
              <SidebarGroupLabel className='group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'>
                <div className='flex w-full items-center py-2'>
                  {section.url && (
                    <Link
                      href={section.url}
                      className='flex-1 hover:text-sidebar-accent-foreground cursor-pointer'
                    >
                      {section.title}
                    </Link>
                  )}
                  {!section.url && (
                    <span className='flex-1'>{section.title}</span>
                  )}
                  {section.items && section.items.length > 0 && (
                    <CollapsibleTrigger className='ml-2 p-1 hover:bg-sidebar-accent rounded-sm cursor-pointer'>
                      <ChevronRight className='h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90' />
                    </CollapsibleTrigger>
                  )}
                </div>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent className='ml-4'>
                  <SidebarMenu>
                    {section.items?.map((item) =>
                      isGroup(item) ? (
                        <Collapsible
                          key={item.title}
                          defaultOpen
                          className='group/collapsible'
                        >
                          <SidebarGroupLabel className='group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'>
                            <div className='flex w-full items-center pr-4 py-2'>
                              {item.url && (
                                <Link
                                  href={item.url}
                                  className='flex-1 hover:text-sidebar-accent-foreground cursor-pointer'
                                >
                                  {item.title}
                                </Link>
                              )}
                              {!item.url && (
                                <span className='flex-1'>{item.title}</span>
                              )}
                              {item.items && item.items.length > 0 && (
                                <CollapsibleTrigger className='ml-2 p-1 hover:bg-sidebar-accent rounded-sm cursor-pointer'>
                                  <ChevronRight className='h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90' />
                                </CollapsibleTrigger>
                              )}
                            </div>
                          </SidebarGroupLabel>
                          <CollapsibleContent>
                            <SidebarGroupContent className='ml-8'>
                              <SidebarMenu>
                                {item.items.map((subItem) => (
                                  <SidebarMenuItem key={subItem.title}>
                                    <SidebarMenuButton
                                      asChild
                                      isActive={pathname === subItem.url}
                                      className='cursor-pointer'
                                    >
                                      <Link
                                        href={subItem.url}
                                        target={subItem?.target}
                                      >
                                        {subItem.title}
                                      </Link>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                ))}
                              </SidebarMenu>
                            </SidebarGroupContent>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === item.url}
                            className='cursor-pointer'
                          >
                            <Link href={item.url} target={item?.target}>
                              {item.title}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <ModeToggle />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
