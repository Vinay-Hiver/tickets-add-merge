import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainNav } from '../../patterns/MainNav';
import { navSampleItems, navSampleFooterItems } from '../../patterns/MainNav/sampleData';
import { useCurrentUser } from '../CurrentUser';

// Main nav from the storybook (replaces the omni-boilerplate MiniSidebar).
// Conversations navigates; the other icons (Admin Panel included) do nothing.
const NAV_ROUTES = { conversations: '/' };

// The avatar menu shows no options.
const USER_MENU_ENTRIES = [];

export default function AppMainNav() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  return (
    <MainNav
      items={navSampleItems}
      footerItems={navSampleFooterItems}
      value="conversations"
      onChange={(id) => NAV_ROUTES[id] && navigate(NAV_ROUTES[id])}
      user={{ initial: user.name.charAt(0), name: user.name, showStatus: true }}
      userMenu={{ name: user.name, email: user.email, entries: USER_MENU_ENTRIES }}
    />
  );
}
