import React from 'react';
import AllViewsPanel from './AllViewsPanel';
import { ViewTypeIcon, TeamFavRowIcon } from './viewIcons';
import { INITIAL_VIEWS_BY_INBOX, MAX_FAVOURITES } from '../data/dummyViews';
import { channelViewCount, channelInboxTotal, isCountedView } from '../data/channelChats';
import { useCurrentUser } from '../CurrentUser';

// Icons
import allMailIcon from '../assets/icons/all-mail.svg';
import assignedToMeIcon from '../assets/icons/assigned-to-me.svg';
import draftIcon from '../assets/icons/draft.svg';
import newConversationIcon from '../assets/icons/new-conversation.svg';
import sentIcon from '../assets/icons/sent.svg';
import tagsIcon from '../assets/icons/tags.svg';
import searchIcon from '../assets/icons/search-icon.svg';
import plusIcon from '../assets/icons/plus-icon.svg';
import chevronDownSmall from '../assets/icons/s-chevron-down.svg';

import sChevronDown from '../assets/icons/Read/side-bar-chevron.svg';

// Channel icons (HOT Design System) — one per Shared Inbox channel.
import mailChannelIcon from '../assets/icons/channels/mail.svg';
import slackChannelIcon from '../assets/icons/channels/slack.svg';
import whatsappChannelIcon from '../icons/whatsapp.svg';
import chatSidebarIcon from '../icons/chat-sidebar-icon.svg';
import botIconSvg from '../icons/bot-icon.svg';
import { Icon as HotIcon } from '../../icons/Icon';

const CHANNEL_ICONS = {
  email: mailChannelIcon,
  chat: chatSidebarIcon,
  slack: slackChannelIcon,
  whatsapp: whatsappChannelIcon,
};

// Fixed submenus for channel inboxes (Chat differs from Slack/WhatsApp).
const BotIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="10" height="8" rx="2" />
    <path d="M8 5V3M5.5 9h.01M10.5 9h.01M6 12h4" />
    <path d="M1.5 8.5v-1M14.5 8.5v-1" />
  </svg>
);

const CHANNEL_SUBMENUS = {
  chat: [
    { type: 'Unassigned', icon: 'unassigned', count: 0 },
    { type: 'Assigned to Bot', icon: 'bot', count: 0 },
    { type: 'Mine', icon: 'mine', count: 0 },
    { type: 'All Assigned', icon: 'team', count: 0 },
    { type: 'Tags', icon: 'tags' },
    { type: 'Closed', icon: 'closed' },
  ],
  slack: [
    { type: 'Unassigned', icon: 'unassigned', count: 0 },
    { type: 'Mine', icon: 'mine', count: 0 },
    { type: 'All Assigned', icon: 'team', count: 0 },
    { type: 'Tags', icon: 'tags' },
    { type: 'Pending', icon: 'pending' },
    { type: 'Closed', icon: 'closed' },
  ],
};
CHANNEL_SUBMENUS.whatsapp = CHANNEL_SUBMENUS.slack;
CHANNEL_SUBMENUS.sms = CHANNEL_SUBMENUS.slack;
CHANNEL_SUBMENUS.voice = [
  { type: 'Unassigned', icon: 'unassigned', count: 0 },
  { type: 'Mine', icon: 'mine', count: 0 },
  { type: 'All Assigned', icon: 'team', count: 0 },
  { type: 'Closed', icon: 'closed' },
];

// Masked so the glyph takes the nav item's text color (slate → primary active).
const ChannelIcon = ({ channel }) => {
  // WhatsApp uses its own icon rendered as-is (not masked/recolored).
  if (channel === 'whatsapp') {
    return <img src={whatsappChannelIcon} alt="" width="16" height="16" className="item-icon" />;
  }
  // SMS and Voice use the storybook (HOT) icons.
  if (channel === 'sms' || channel === 'voice') {
    return <span className="item-icon"><HotIcon name={channel} size={16} /></span>;
  }
  return (
    <span
      className="item-icon channel-icon"
      style={{ '--channel-icon': `url(${CHANNEL_ICONS[channel] || mailChannelIcon})` }}
      aria-hidden="true"
    />
  );
};

// Untitled UI "mail-01" glyph, used for every Shared Inbox header.
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="item-icon">
    <path d="M2 6L8.913 10.755C10.155 11.606 10.776 12.031 11.449 12.196C12.044 12.343 12.665 12.343 13.26 12.196C13.933 12.031 14.554 11.606 15.796 10.755L22 6M6.8 20H17.2C18.8802 20 19.7202 20 20.362 19.673C20.9265 19.3854 21.3854 18.9265 21.673 18.362C22 17.7202 22 16.8802 22 15.2V8.8C22 7.11984 22 6.27976 21.673 5.63803C21.3854 5.07354 20.9265 4.6146 20.362 4.32698C19.7202 4 18.8802 4 17.2 4H6.8C5.11984 4 4.27976 4 3.63803 4.32698C3.07354 4.6146 2.6146 5.07354 2.32698 5.63803C2 6.27976 2 7.11984 2 8.8V15.2C2 16.8802 2 17.7202 2.32698 18.362C2.6146 18.9265 3.07354 19.3854 3.63803 19.673C4.27976 20 5.11984 20 6.8 20Z"></path>
  </svg>
);

// Same "layers" glyph used for custom Views in the All Views panel
const LayersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="item-icon">
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 12 17 22 12"></polyline>
  </svg>
);

// Animates the nested list open/closed by measuring its actual pixel height
// and transitioning `height` directly — smoother than the `grid-template-
// rows: 0fr/1fr` trick, which can settle with a small sub-pixel jump once
// the transition ends and the row's auto-sized height gets its final layout.
const NestedGroup = ({ expanded, children }) => {
  const contentRef = React.useRef(null);
  const [height, setHeight] = React.useState(expanded ? 'auto' : 0);
  const isFirstRender = React.useRef(true);

  React.useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const el = contentRef.current;
    if (!el) return;

    if (expanded) {
      const target = el.scrollHeight;
      setHeight(target);
      const timeout = setTimeout(() => setHeight('auto'), 250);
      return () => clearTimeout(timeout);
    }

    setHeight(el.scrollHeight);
    requestAnimationFrame(() => setHeight(0));
  }, [expanded]);

  return (
    <div
      ref={contentRef}
      className="nav-group-nested-wrapper"
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        overflow: 'hidden',
        transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  );
};

// Ordered list of Shared Inboxes + a stable slug for each (used as the
// expanded/collapsed key). Order follows the data in dummyViews.js.
const slugifyInbox = (name) => name.toLowerCase().replace(/\s+/g, '-');
const ALL_INBOX_NAMES = Object.keys(INITIAL_VIEWS_BY_INBOX);

const MainSidebarPanel = ({ activeFilter, onFilterChange, activeRole, onOpenSearch }) => {
  // Only the inboxes the current user is a member of.
  const { user } = useCurrentUser();
  const INBOX_NAMES = ALL_INBOX_NAMES.filter((name) => !user.hiddenInboxes?.includes(name));
  const [expandedInboxes, setExpandedInboxes] = React.useState(() =>
    INBOX_NAMES.reduce((acc, name, i) => ({ ...acc, [slugifyInbox(name)]: i === 0 }), {})
  );

  const [allViewsInbox, setAllViewsInbox] = React.useState(null);

  // Switching Admin/Agent always drops back to the home nav — e.g. an admin
  // pinning Team Favourites from within All Views, then flipping to Agent to
  // see how it looks, should land on the sidebar's home screen first.
  const isFirstRoleRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRoleRender.current) {
      isFirstRoleRender.current = false;
      return;
    }
    setAllViewsInbox(null);
  }, [activeRole]);

  // Views (and each inbox's favourited View ids, in display order) live here
  // so they persist across opening/closing All Views and drive the home nav.
  const [viewsByInbox, setViewsByInbox] = React.useState(INITIAL_VIEWS_BY_INBOX);

  const toggleInbox = (name) => {
    const key = slugifyInbox(name);
    const willExpand = !expandedInboxes[key];
    setExpandedInboxes(prev => ({
      ...prev,
      [key]: willExpand
    }));
    if (willExpand) {
      onFilterChange({ inbox: name, type: firstSubsection(name) });
    }
  };

  // The first subsection shown under an inbox: 'Unassigned' for channel
  // inboxes, or the first favourite view's name for email inboxes (e.g. Mine).
  const firstSubsection = (name) => {
    const data = viewsByInbox[name];
    if (!data) return 'Mine';
    if (data.channel && data.channel !== 'email') return 'Unassigned';
    const order = data.sidebarOrder?.[activeRole] || data.favouriteIds?.[activeRole] || [];
    const first = data.views.find((v) => v.id === order[0]);
    return first ? first.name : 'Mine';
  };

  // Sum of the counts of the views shown under an inbox (its home-nav
  // favourites) — displayed beside the inbox name while collapsed.
  const inboxSum = (inboxName) => {
    const data = viewsByInbox[inboxName];
    if (!data) return 0;
    // Channel inboxes: total number of conversations across all views.
    if (data.channel && data.channel !== 'email') return channelInboxTotal(inboxName);
    const sidebarOrder = data.sidebarOrder?.[activeRole] || data.favouriteIds?.[activeRole] || [];
    const viewsById = {};
    data.views.forEach((v) => { viewsById[v.id] = v; });
    return sidebarOrder
      .map((id) => viewsById[id])
      .filter(Boolean)
      .slice(0, MAX_FAVOURITES)
      .reduce((sum, v) => sum + (v.count || 0), 0);
  };

  const renderNestedItems = (inboxName) => {
    const { views, sidebarOrder: sidebarOrderByRole, favouriteIds: favouriteIdsByRole, teamFavouriteIds } = viewsByInbox[inboxName];
    const sidebarOrder = sidebarOrderByRole[activeRole] || favouriteIdsByRole[activeRole] || [];
    const viewsById = {};
    views.forEach((v) => { viewsById[v.id] = v; });

    // What shows in the sidebar isn't "your favourites" anymore — it's the
    // first 5 entries of the merged, drag-reorderable order (personal
    // favourites and Team Favourites interleaved, as arranged in All
    // Views). An Agent can't remove a Team Favourite, so with zero personal
    // favourites the sidebar simply shows the top 5 Team Favourites.
    const sidebarViews = sidebarOrder.map((id) => viewsById[id]).filter(Boolean).slice(0, MAX_FAVOURITES);

    return (
      <div className="nav-group-nested">
        {sidebarViews.map((view) => (
          <div
            key={view.id}
            className={`nav-item ${activeFilter.inbox === inboxName && activeFilter.type === view.name ? 'active' : ''}`}
            onClick={() => onFilterChange({ inbox: inboxName, type: view.name })}
          >
            <div className="nav-content">
              <span className="item-icon">
                {teamFavouriteIds.includes(view.id) ? <TeamFavRowIcon /> : <ViewTypeIcon icon={view.icon} />}
              </span>
              <span>{view.name}</span>
            </div>
            <div className="nav-item-meta">
              <span className="count">{view.count}</span>
            </div>
          </div>
        ))}

      <div className="nav-item" style={{ cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}>
        <div className="nav-content">
          <img src={tagsIcon} alt="" width="16" height="16" className="item-icon" />
          <span>Tags</span>
        </div>
      </div>

      <div
        className="nav-item"
        onClick={() => setAllViewsInbox(inboxName)}
      >
        <div className="nav-content">
          <LayersIcon />
          <span>All Views</span>
        </div>
      </div>
    </div>
  );
};

  // Fixed submenu for channel inboxes (Chat vs Slack/WhatsApp).
  const submenuIcon = (icon) => {
    if (icon === 'tags') return <img src={tagsIcon} alt="" width="16" height="16" className="item-icon" />;
    if (icon === 'bot') return <img src={botIconSvg} alt="" width="16" height="16" className="item-icon" />;
    return <span className="item-icon"><ViewTypeIcon icon={icon} /></span>;
  };

  const renderChannelSubmenu = (inboxName, channel) => {
    const items = CHANNEL_SUBMENUS[channel] || [];
    return (
      <div className="nav-group-nested">
        {items.map((item) => (
          <div
            key={item.type}
            className={`nav-item ${activeFilter.inbox === inboxName && activeFilter.type === item.type ? 'active' : ''}`}
            onClick={(e) => {
              if (item.type === 'Tags') {
                e.stopPropagation();
                return;
              }
              onFilterChange({ inbox: inboxName, type: item.type });
            }}
          >
            <div className="nav-content">
              {submenuIcon(item.icon)}
              <span>{item.type}</span>
            </div>
            {isCountedView(item.type) && (
              <div className="nav-item-meta"><span className="count">{channelViewCount(inboxName, item.type)}</span></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (allViewsInbox) {
    return (
      <div className="side-nav-expanded">
        <AllViewsPanel
          inboxName={allViewsInbox}
          onBack={() => setAllViewsInbox(null)}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          viewsData={viewsByInbox[allViewsInbox]}
          onChange={(updated) =>
            setViewsByInbox((prev) => ({ ...prev, [allViewsInbox]: updated }))
          }
          activeRole={activeRole}
        />
      </div>
    );
  }

  return (
    <div className="side-nav-expanded">
      <div className="panel-header-top panel-header-top--title-only">
        <div className="header-row">
          <h1>Conversations</h1>
          <div className="header-actions">
            <button type="button" className="header-icon-btn" title="Search" onClick={onOpenSearch}>
              <img src={searchIcon} alt="" width="16" height="16" />
            </button>
            <div className="new-convo-split-btn">
              <button type="button" className="split-btn-main" title="New conversation">
                <img src={plusIcon} alt="" width="16" height="16" />
              </button>
              <button type="button" className="split-btn-chevron" title="More options">
                <img src={chevronDownSmall} alt="" width="14" height="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar-content">
        <div className="section-title">Shared Inbox</div>
        
        <div className="nav-group">
          {INBOX_NAMES.map((name) => {
            const key = slugifyInbox(name);
            return (
              <React.Fragment key={key}>
                <div
                  className={`nav-item accordion-trigger ${expandedInboxes[key] ? 'expanded' : ''}`}
                  onClick={() => toggleInbox(name)}
                >
                  <div className="nav-content">
                    <ChannelIcon channel={viewsByInbox[name]?.channel} />
                    <span>{name}</span>
                  </div>
                  <div className="accordion-meta">
                    <span className="inbox-sum">{inboxSum(name)}</span>
                    <img
                      src={sChevronDown}
                      alt=""
                      className={`chevron-icon ${expandedInboxes[key] ? 'up' : ''}`}
                    />
                  </div>
                </div>

                <NestedGroup expanded={expandedInboxes[key]}>
                  {(viewsByInbox[name]?.channel || 'email') === 'email'
                    ? renderNestedItems(name)
                    : renderChannelSubmenu(name, viewsByInbox[name].channel)}
                </NestedGroup>
              </React.Fragment>
            );
          })}
        </div>

        <div className="section-title margin-top">More</div>
        
        <div className="nav-group">
          <div className="nav-item">
            <div className="nav-content">
              <img src={sentIcon} alt="" width="16" height="16" className="item-icon" />
              <span>Sent</span>
            </div>
            <span className="count">2</span>
          </div>

          <div className="nav-item">
            <div className="nav-content">
              <img src={draftIcon} alt="" width="16" height="16" className="item-icon" />
              <span>Draft</span>
            </div>
          </div>

          <div className="nav-item">
            <div className="nav-content">
              <img src={allMailIcon} alt="" width="16" height="16" className="item-icon" />
              <span>All Mail</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainSidebarPanel;
