// Dummy email conversations for the Email Shared Inboxes (moved out of App.jsx so
// the link-conversation search can index them).
export const conversationsData = [
  // --- Email: Mine (2) ---
  {
    id: 1,
    inbox: 'Email Support 01',
    type: 'Mine',
    sender: 'John Smith',
    initial: 'J',
    avatarColor: 'var(--pastelRedBorderDefault)',
    time: 'Feb 4, 02:45 PM',
    subject: 'Issue with the app',
    preview: 'I am seeing a blank screen after login.',
    threadCount: 3,
    messages: [
      {
        id: 'm1',
        sender: 'John Smith',
        email: 'john.smith@airbnb.com',
        time: 'Feb 4, 01:20 PM',
        initial: 'J',
        avatarColor: 'var(--pastelRedBorderDefault)',
        body: 'Hi Support,\n\nI am experiencing a blank screen after logging in to the mobile app. Can you please help?'
      },
      {
        id: 'm2',
        sender: 'Ruben Geidt',
        email: 'ruben@acme.com',
        time: 'Feb 4, 02:00 PM',
        initial: 'R',
        avatarColor: 'var(--pastelLightBlueBorderDefault)',
        body: 'Hello John,\n\nI am looking into this. Could you let me know which device you are using?'
      },
      {
        id: 'm3',
        sender: 'John Smith',
        email: 'john.smith@airbnb.com',
        time: 'Feb 4, 02:45 PM',
        initial: 'J',
        avatarColor: 'var(--pastelRedBorderDefault)',
        body: 'I am using an iPhone 15 Pro with the latest iOS update.'
      }
    ]
  },
  {
    id: 2,
    ticketId: 'TKT#3', // a ticket: email conversation with the ticket right panel
    inbox: 'Email Support 01',
    type: 'Mine',
    sender: 'Alice Johnson',
    initial: 'A',
    avatarColor: 'var(--pastelVioletBorderDefault)',
    time: 'Feb 4, 11:30 AM',
    subject: 'Refund status',
    preview: 'Has the refund been processed yet?',
    threadCount: 2,
    messages: [
      {
        id: 'm1',
        sender: 'Alice Johnson',
        email: 'alice.j@fedex.com',
        time: 'Feb 4, 10:00 AM',
        initial: 'A',
        avatarColor: 'var(--pastelVioletBorderDefault)',
        body: 'Hello,\n\nI requested a refund last week but haven\'t seen it in my account yet. Any updates?'
      },
      {
        id: 'm2',
        sender: 'Ruben Geidt',
        email: 'ruben@acme.com',
        time: 'Feb 4, 11:30 AM',
        initial: 'R',
        avatarColor: 'var(--pastelLightBlueBorderDefault)',
        body: 'Hi Alice,\n\nI\'ve checked the status and the refund was approved yesterday. It should appear in your account within 3-5 business days.'
      }
    ]
  },

  // --- Email: Unassigned (2) ---
  {
    id: 4,
    inbox: 'Email Support 01',
    type: 'Unassigned',
    sender: 'Emily Watson',
    initial: 'E',
    avatarColor: 'var(--pastelOrangeSurfaceDefault)',
    time: 'Feb 4, 05:10 PM',
    subject: 'Billing inquiry',
    preview: 'Why was I charged twice this month?',
    threadCount: 2,
    messages: [
      {
        id: 'm1',
        sender: 'Emily Watson',
        email: 'emily.w@shopify.com',
        time: 'Feb 4, 04:00 PM',
        initial: 'E',
        avatarColor: 'var(--pastelOrangeSurfaceDefault)',
        body: 'Hi,\n\nI noticed two separate charges from your service on my bank statement this morning. Can you please explain why?'
      },
      {
        id: 'm2',
        sender: 'System Bot',
        email: 'no-reply@acme.com',
        time: 'Feb 4, 04:05 PM',
        initial: 'S',
        avatarColor: '#94a3b8',
        body: 'Thank you for your inquiry. A support representative will be with you shortly to look into this billing discrepancy.'
      }
    ]
  },
  {
    id: 5,
    ticketId: 'TKT#7', // a ticket: email conversation with the ticket right panel
    inbox: 'Email Support 01',
    type: 'Unassigned',
    sender: 'David Chen',
    initial: 'D',
    avatarColor: 'var(--pastelPurpleTextBody)',
    time: 'Feb 4, 01:20 PM',
    subject: 'API documentation question',
    preview: 'How do I authenticate with the latest version?',
    threadCount: 3,
    messages: [
      {
        id: 'm1',
        sender: 'David Chen',
        email: 'david.chen@dell.com',
        time: 'Feb 4, 10:00 AM',
        initial: 'D',
        avatarColor: 'var(--pastelPurpleTextBody)',
        body: 'Hello,\n\nI\'m migrating to version 2 of your API but I\'m getting an auth error. The docs seem to only cover version 1.'
      },
      {
        id: 'm2',
        sender: 'Support Bot',
        email: 'support-bot@acme.com',
        time: 'Feb 4, 10:05 AM',
        initial: 'S',
        avatarColor: '#94a3b8',
        body: 'We have received your message. A technical support specialist will review your inquiry about API v2 authentication.'
      },
      {
        id: 'm3',
        sender: 'David Chen',
        email: 'david.chen@dell.com',
        time: 'Feb 4, 01:20 PM',
        initial: 'D',
        avatarColor: 'var(--pastelPurpleTextBody)',
        body: 'Any update on this? I\'m currently blocked on my development task.'
      }
    ]
  },

  // --- Email Support 02: Mine (2) ---
  {
    id: 21,
    inbox: 'Email Support 02',
    type: 'Mine',
    sender: 'George Baker',
    initial: 'G',
    avatarColor: 'var(--pastelVioletTextBody)',
    time: 'Feb 4, 10:20 AM',
    subject: 'Double charge refund',
    preview: 'I see a duplicate charge on my statement.',
    threadCount: 2,
    messages: [
      {
        id: 'm1',
        sender: 'George Baker',
        email: 'george@shopify.com',
        time: 'Feb 4, 09:00 AM',
        initial: 'G',
        avatarColor: 'var(--pastelVioletTextBody)',
        body: 'Hello,\n\nI was charged twice for my subscription this month. Can you please refund the second one?'
      },
      {
        id: 'm2',
        sender: 'Ruben Geidt',
        email: 'ruben@acme.com',
        time: 'Feb 4, 10:20 AM',
        initial: 'R',
        avatarColor: 'var(--pastelLightBlueBorderDefault)',
        body: 'Hi George,\n\nI\'ve processed the refund for the duplicate charge. It should reach your account in 3-5 days.'
      }
    ]
  },
  {
    id: 22,
    ticketId: 'TKT#12', // a ticket: email conversation with the ticket right panel
    inbox: 'Email Support 02',
    type: 'Mine',
    sender: 'Emma Stone',
    initial: 'E',
    avatarColor: 'var(--pastelPurpleTextBody)',
    time: 'Feb 3, 04:15 PM',
    subject: 'Return shipping refund',
    preview: 'Can I get a refund for the return labels?',
    threadCount: 2,
    messages: [
      {
        id: 'm1',
        sender: 'Emma Stone',
        email: 'emma@paypal.com',
        time: 'Feb 3, 02:00 PM',
        initial: 'E',
        avatarColor: 'var(--pastelPurpleTextBody)',
        body: 'Hi,\n\nI had to pay for return shipping because the item was faulty. Can this be reimbursed?'
      },
      {
        id: 'm2',
        sender: 'Ruben Geidt',
        email: 'ruben@acme.com',
        time: 'Feb 3, 04:15 PM',
        initial: 'R',
        avatarColor: 'var(--pastelLightBlueBorderDefault)',
        body: 'Yes Emma. Please upload the receipt and I will issue a credit to your account.'
      }
    ]
  },

  // --- Email Support 02: Unassigned (2) ---
  {
    id: 23,
    inbox: 'Email Support 02',
    type: 'Unassigned',
    sender: 'Customer Care',
    initial: 'C',
    avatarColor: 'var(--pastelGreenBorderDefault)',
    time: 'Feb 4, 11:00 AM',
    subject: 'Escalated refund request',
    preview: 'Customer is unhappy with the product.',
    threadCount: 2,
    messages: [
      {
        id: 'm1',
        sender: 'Customer Care',
        email: 'care@paypal.com',
        time: 'Feb 4, 08:30 AM',
        initial: 'C',
        avatarColor: 'var(--pastelGreenBorderDefault)',
        body: 'Team,\n\nCustomer #9928 wants a full refund. They say the item doesn\'t match the description. Please review.'
      },
      {
        id: 'm2',
        sender: 'Refund Bot',
        email: 'refunds@acme.com',
        time: 'Feb 4, 08:35 AM',
        initial: 'R',
        avatarColor: '#94a3b8',
        body: 'Request received. Analyzing product return history.'
      }
    ]
  },
  {
    id: 24,
    ticketId: 'TKT#15', // a ticket: email conversation with the ticket right panel
    inbox: 'Email Support 02',
    type: 'Unassigned',
    sender: 'Liam Neeson',
    initial: 'L',
    avatarColor: 'var(--pastelLightBlueTextBody)',
    time: 'Feb 4, 03:20 PM',
    subject: 'Membership cancellation refund',
    preview: 'I want a pro-rated refund for my annual plan.',
    threadCount: 2,
    messages: [
      {
        id: 'm1',
        sender: 'Liam Neeson',
        email: 'liam@airbnb.com',
        time: 'Feb 4, 01:00 PM',
        initial: 'L',
        avatarColor: 'var(--pastelLightBlueTextBody)',
        body: 'Hi,\n\nI am cancelling my service halfway through the year. I\'d like a refund for the remaining 6 months.'
      },
      {
        id: 'm2',
        sender: 'System Bot',
        email: 'support@acme.com',
        time: 'Feb 4, 01:05 PM',
        initial: 'S',
        avatarColor: '#94a3b8',
        body: 'Your cancellation and refund request has been logged.'
      }
    ]
  },

  // --- More tickets: 3 per Email inbox ---
  {
    id: 31,
    ticketId: 'TKT#18', // a ticket: email conversation with the ticket right panel
    inbox: "Email Support 01",
    type: "Mine",
    sender: "Nina Patel",
    initial: "N",
    avatarColor: "var(--pastelGreenBorderDefault)",
    time: "Feb 4, 03:05 PM",
    subject: "Export to CSV fails",
    preview: "The CSV export stops at 1,000 rows.",
    threadCount: 2,
    messages: [
      {
        id: 'm1',
        sender: "Nina Patel",
        email: "nina.patel@shopify.com",
        time: "Feb 4, 03:05 PM",
        initial: "N",
        avatarColor: "var(--pastelGreenBorderDefault)",
        body: "Hi Support,\n\nWhen I export our contacts to CSV, the file stops at 1,000 rows. We have around 4,200 contacts. Is there a limit?"
      },
      {
        id: 'm2',
        sender: "Ruben Geidt",
        email: "ruben@acme.com",
        time: "Feb 4, 03:05 PM",
        initial: "R",
        avatarColor: "var(--pastelLightBlueBorderDefault)",
        body: "Hi Nina,\n\nThanks for flagging this. I have raised a ticket with engineering and will update you as soon as the fix is out."
      }
    ]
  },
  {
    id: 32,
    ticketId: 'TKT#21', // a ticket: email conversation with the ticket right panel
    inbox: "Email Support 01",
    type: "Mine",
    sender: "Omar Haddad",
    initial: "O",
    avatarColor: "var(--pastelOrangeBorderDefault)",
    time: "Feb 3, 05:40 PM",
    subject: "Two-factor codes not arriving",
    preview: "I am not receiving the 2FA codes by SMS.",
    threadCount: 2,
    messages: [
      {
        id: 'm1',
        sender: "Omar Haddad",
        email: "omar@airbnb.com",
        time: "Feb 3, 05:40 PM",
        initial: "O",
        avatarColor: "var(--pastelOrangeBorderDefault)",
        body: "Hello,\n\nSince yesterday I am not receiving two-factor codes by SMS, so I cannot sign in. My number has not changed."
      },
      {
        id: 'm2',
        sender: "Ruben Geidt",
        email: "ruben@acme.com",
        time: "Feb 3, 05:40 PM",
        initial: "R",
        avatarColor: "var(--pastelLightBlueBorderDefault)",
        body: "Hi Omar,\n\nI have switched your account to email-based codes for now so you can sign in. We are checking the SMS provider."
      }
    ]
  },
  {
    id: 33,
    ticketId: 'TKT#24', // a ticket: email conversation with the ticket right panel
    inbox: "Email Support 01",
    type: "Unassigned",
    sender: "Clara Jensen",
    initial: "C",
    avatarColor: "var(--pastelVioletBorderDefault)",
    time: "Feb 4, 09:12 AM",
    subject: "Dashboard loads very slowly",
    preview: "The analytics dashboard takes over a minute to load.",
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: "Clara Jensen",
        email: "clara.jensen@paypal.com",
        time: "Feb 4, 09:12 AM",
        initial: "C",
        avatarColor: "var(--pastelVioletBorderDefault)",
        body: "Hi,\n\nOur analytics dashboard takes more than a minute to load every morning. It was fast last week. Can you take a look?"
      }
    ]
  },
  {
    id: 34,
    ticketId: 'TKT#27', // a ticket: email conversation with the ticket right panel
    inbox: "Email Support 02",
    type: "Mine",
    sender: "Hugo Martins",
    initial: "H",
    avatarColor: "var(--pastelPurpleBorderDefault)",
    time: "Feb 4, 02:30 PM",
    subject: "Invoice address is wrong",
    preview: "Our invoices still show our old office address.",
    threadCount: 2,
    messages: [
      {
        id: 'm1',
        sender: "Hugo Martins",
        email: "hugo@fedex.com",
        time: "Feb 4, 02:30 PM",
        initial: "H",
        avatarColor: "var(--pastelPurpleBorderDefault)",
        body: "Hello,\n\nOur last three invoices still show our old office address. We updated it in settings in January. Can you reissue them?"
      },
      {
        id: 'm2',
        sender: "Ruben Geidt",
        email: "ruben@acme.com",
        time: "Feb 4, 02:30 PM",
        initial: "R",
        avatarColor: "var(--pastelLightBlueBorderDefault)",
        body: "Hi Hugo,\n\nI have corrected the billing address and reissued the three invoices. You should have them in your inbox now."
      }
    ]
  },
  {
    id: 35,
    ticketId: 'TKT#30', // a ticket: email conversation with the ticket right panel
    inbox: "Email Support 02",
    type: "Mine",
    sender: "Priya Raman",
    initial: "P",
    avatarColor: "var(--pastelRedBorderDefault)",
    time: "Feb 3, 01:15 PM",
    subject: "Charged after cancelling",
    preview: "I cancelled last month but was charged again.",
    threadCount: 2,
    messages: [
      {
        id: 'm1',
        sender: "Priya Raman",
        email: "priya.raman@dell.com",
        time: "Feb 3, 01:15 PM",
        initial: "P",
        avatarColor: "var(--pastelRedBorderDefault)",
        body: "Hi,\n\nI cancelled our subscription on January 12, but we were charged again on February 1. Please refund this charge."
      },
      {
        id: 'm2',
        sender: "Ruben Geidt",
        email: "ruben@acme.com",
        time: "Feb 3, 01:15 PM",
        initial: "R",
        avatarColor: "var(--pastelLightBlueBorderDefault)",
        body: "Hi Priya,\n\nYou are right, the cancellation did not go through. I have refunded the February charge and closed the subscription."
      }
    ]
  },
  {
    id: 36,
    ticketId: 'TKT#33', // a ticket: email conversation with the ticket right panel
    inbox: "Email Support 02",
    type: "Unassigned",
    sender: "Sam Okoro",
    initial: "S",
    avatarColor: "var(--pastelLightBlueBorderDefault)",
    time: "Feb 4, 11:48 AM",
    subject: "Need a VAT invoice",
    preview: "We need invoices with our VAT number on them.",
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: "Sam Okoro",
        email: "sam.okoro@dell.com",
        time: "Feb 4, 11:48 AM",
        initial: "S",
        avatarColor: "var(--pastelLightBlueBorderDefault)",
        body: "Hello,\n\nOur finance team needs invoices that include our VAT number. Could you add it to our account and resend January's invoice?"
      }
    ]
  },
  // --- More emails (no tickets): pairs from the same domain, so they can be merged ---
  {
    id: 41,
    inbox: 'Email Support 01',
    type: 'Unassigned',
    sender: 'Sarah Miller',
    initial: 'S',
    avatarColor: 'var(--pastelVioletBorderDefault)',
    time: 'Feb 4, 11:05 AM',
    subject: 'Reports won\'t export to CSV',
    preview: 'The export button spins and nothing downloads.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Sarah Miller',
        email: 'sarah.miller@fedex.com',
        time: 'Feb 4, 11:05 AM',
        initial: 'S',
        avatarColor: 'var(--pastelVioletBorderDefault)',
        body: 'Hi team,\n\nWhen I try to export the monthly report to CSV, the button spins and nothing downloads. Can you take a look?'
      }
    ]
  },
  {
    id: 42,
    inbox: 'Email Support 01',
    type: 'Unassigned',
    sender: 'Kevin Park',
    initial: 'K',
    avatarColor: 'var(--pastelLightBlueBorderDefault)',
    time: 'Feb 4, 10:40 AM',
    subject: 'CSV export failing for our team',
    preview: 'Several of us at FedEx can\'t export reports.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Kevin Park',
        email: 'kevin.park@fedex.com',
        time: 'Feb 4, 10:40 AM',
        initial: 'K',
        avatarColor: 'var(--pastelLightBlueBorderDefault)',
        body: 'Hello,\n\nA few of us at FedEx are unable to export reports to CSV since this morning. Is this a known issue?'
      }
    ]
  },
  {
    id: 43,
    inbox: 'Email Support 01',
    type: 'Unassigned',
    sender: 'Rachel Green',
    initial: 'R',
    avatarColor: 'var(--pastelOrangeBorderDefault)',
    time: 'Feb 4, 09:55 AM',
    subject: 'Copy of January invoice',
    preview: 'Could you resend the January invoice?',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Rachel Green',
        email: 'rachel.green@shopify.com',
        time: 'Feb 4, 09:55 AM',
        initial: 'R',
        avatarColor: 'var(--pastelOrangeBorderDefault)',
        body: 'Hi,\n\nCould you resend the January invoice? Our accounts team can\'t find the original email.'
      }
    ]
  },
  {
    id: 44,
    inbox: 'Email Support 01',
    type: 'Mine',
    sender: 'Tom Hardy',
    initial: 'T',
    avatarColor: 'var(--pastelRedBorderDefault)',
    time: 'Feb 4, 08:30 AM',
    subject: 'SSO login is broken',
    preview: 'Our team gets an error when signing in with SSO.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Tom Hardy',
        email: 'tom.hardy@dell.com',
        time: 'Feb 4, 08:30 AM',
        initial: 'T',
        avatarColor: 'var(--pastelRedBorderDefault)',
        body: 'Hi,\n\nSince yesterday our team gets an "invalid assertion" error when signing in with SSO.'
      }
    ]
  },
  {
    id: 45,
    inbox: 'Email Support 01',
    type: 'Mine',
    sender: 'Lisa Wong',
    initial: 'L',
    avatarColor: 'var(--pastelVioletBorderDefault)',
    time: 'Feb 4, 08:10 AM',
    subject: 'New hires can\'t sign in',
    preview: 'SSO fails for the accounts we created this week.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Lisa Wong',
        email: 'lisa.wong@dell.com',
        time: 'Feb 4, 08:10 AM',
        initial: 'L',
        avatarColor: 'var(--pastelVioletBorderDefault)',
        body: 'Hello,\n\nThe accounts we created for new hires this week can\'t sign in through SSO. Older accounts work fine.'
      }
    ]
  },
  {
    id: 51,
    inbox: 'Email Support 02',
    type: 'Unassigned',
    sender: 'Oliver Brooks',
    initial: 'O',
    avatarColor: 'var(--pastelLightBlueBorderDefault)',
    time: 'Feb 4, 11:20 AM',
    subject: 'Shipment delayed',
    preview: 'Our order was due Monday and hasn\'t arrived.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Oliver Brooks',
        email: 'oliver.brooks@fedex.com',
        time: 'Feb 4, 11:20 AM',
        initial: 'O',
        avatarColor: 'var(--pastelLightBlueBorderDefault)',
        body: 'Hi,\n\nOur order was due to arrive on Monday and still hasn\'t shown up. Can you check where it is?'
      }
    ]
  },
  {
    id: 52,
    inbox: 'Email Support 02',
    type: 'Unassigned',
    sender: 'Mia Chen',
    initial: 'M',
    avatarColor: 'var(--pastelOrangeBorderDefault)',
    time: 'Feb 4, 10:15 AM',
    subject: 'Where is order #4471?',
    preview: 'Tracking hasn\'t updated in four days.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Mia Chen',
        email: 'mia.chen@fedex.com',
        time: 'Feb 4, 10:15 AM',
        initial: 'M',
        avatarColor: 'var(--pastelOrangeBorderDefault)',
        body: 'Hello,\n\nThe tracking for order #4471 hasn\'t updated in four days. Could you look into it?'
      }
    ]
  },
  {
    id: 53,
    inbox: 'Email Support 02',
    type: 'Unassigned',
    sender: 'Ethan Cole',
    initial: 'E',
    avatarColor: 'var(--pastelRedBorderDefault)',
    time: 'Feb 4, 09:30 AM',
    subject: 'Switch to annual billing',
    preview: 'We\'d like to move to the annual plan.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Ethan Cole',
        email: 'ethan.cole@paypal.com',
        time: 'Feb 4, 09:30 AM',
        initial: 'E',
        avatarColor: 'var(--pastelRedBorderDefault)',
        body: 'Hi,\n\nWe\'d like to move from monthly to annual billing. What do we need to do?'
      }
    ]
  },
  {
    id: 54,
    inbox: 'Email Support 02',
    type: 'Mine',
    sender: 'Zoe Adams',
    initial: 'Z',
    avatarColor: 'var(--pastelVioletBorderDefault)',
    time: 'Feb 4, 08:45 AM',
    subject: 'Hitting the API rate limit',
    preview: 'Our sync job is getting 429 errors.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Zoe Adams',
        email: 'zoe.adams@dell.com',
        time: 'Feb 4, 08:45 AM',
        initial: 'Z',
        avatarColor: 'var(--pastelVioletBorderDefault)',
        body: 'Hi,\n\nOur nightly sync job keeps getting 429 errors from the API. Can the limit be raised for our account?'
      }
    ]
  },
  {
    id: 55,
    inbox: 'Email Support 02',
    type: 'Mine',
    sender: 'Ryan Ford',
    initial: 'R',
    avatarColor: 'var(--pastelLightBlueBorderDefault)',
    time: 'Feb 4, 08:05 AM',
    subject: 'Rate limit during data sync',
    preview: 'Sync stops halfway with a rate-limit error.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Ryan Ford',
        email: 'ryan.ford@dell.com',
        time: 'Feb 4, 08:05 AM',
        initial: 'R',
        avatarColor: 'var(--pastelLightBlueBorderDefault)',
        body: 'Hello,\n\nOur data sync stops halfway through with a rate-limit error. Is there a way around this?'
      }
    ]
  },
  {
    id: 61,
    inbox: 'Email Support 01',
    type: 'Unassigned',
    sender: 'Priya Shah',
    initial: 'P',
    avatarColor: 'var(--pastelOrangeBorderDefault)',
    time: 'Feb 3, 06:50 PM',
    subject: 'Scheduled reports not sending',
    preview: 'Our weekly report email stopped arriving.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Priya Shah',
        email: 'priya.shah@fedex.com',
        time: 'Feb 3, 06:50 PM',
        initial: 'P',
        avatarColor: 'var(--pastelOrangeBorderDefault)',
        body: 'Hi,\n\nOur weekly scheduled report stopped arriving on Monday. Nothing has changed in the settings on our side.'
      }
    ]
  },
  {
    id: 62,
    inbox: 'Email Support 01',
    type: 'Unassigned',
    sender: 'Mark Lee',
    initial: 'M',
    avatarColor: 'var(--pastelLightBlueBorderDefault)',
    time: 'Feb 3, 05:15 PM',
    subject: 'Add two seats to our plan',
    preview: 'We have two designers joining next week.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Mark Lee',
        email: 'mark.lee@shopify.com',
        time: 'Feb 3, 05:15 PM',
        initial: 'M',
        avatarColor: 'var(--pastelLightBlueBorderDefault)',
        body: 'Hello,\n\nWe have two designers joining next week. Could you add two seats to our plan and send the updated quote?'
      }
    ]
  },
  {
    id: 63,
    inbox: 'Email Support 01',
    type: 'Unassigned',
    sender: 'Ana Lopez',
    initial: 'A',
    avatarColor: 'var(--pastelVioletBorderDefault)',
    time: 'Feb 3, 04:20 PM',
    subject: 'Dark mode makes charts unreadable',
    preview: 'Chart labels disappear in dark mode.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Ana Lopez',
        email: 'ana.lopez@paypal.com',
        time: 'Feb 3, 04:20 PM',
        initial: 'A',
        avatarColor: 'var(--pastelVioletBorderDefault)',
        body: 'Hi,\n\nWhen I switch to dark mode, the labels on the dashboard charts are almost invisible. Is there a fix?'
      }
    ]
  },
  {
    id: 64,
    inbox: 'Email Support 01',
    type: 'Unassigned',
    sender: 'Ben Carter',
    initial: 'B',
    avatarColor: 'var(--pastelRedBorderDefault)',
    time: 'Feb 3, 02:35 PM',
    subject: 'Webhook retries',
    preview: 'How many times do you retry a failed webhook?',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Ben Carter',
        email: 'ben.carter@airbnb.com',
        time: 'Feb 3, 02:35 PM',
        initial: 'B',
        avatarColor: 'var(--pastelRedBorderDefault)',
        body: 'Hello,\n\nOur endpoint was down for an hour last night. How many times do you retry a failed webhook, and over what period?'
      }
    ]
  },
  {
    id: 65,
    inbox: 'Email Support 01',
    type: 'Mine',
    sender: 'Nora Quinn',
    initial: 'N',
    avatarColor: 'var(--pastelLightBlueBorderDefault)',
    time: 'Feb 3, 01:10 PM',
    subject: 'SSO users missing from directory',
    preview: 'Users who signed in with SSO aren\'t listed.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Nora Quinn',
        email: 'nora.quinn@dell.com',
        time: 'Feb 3, 01:10 PM',
        initial: 'N',
        avatarColor: 'var(--pastelLightBlueBorderDefault)',
        body: 'Hi,\n\nPeople who signed in through SSO this week don\'t show up in the user directory. Can you check?'
      }
    ]
  },
  {
    id: 66,
    inbox: 'Email Support 01',
    type: 'Mine',
    sender: 'Chris Diaz',
    initial: 'C',
    avatarColor: 'var(--pastelOrangeBorderDefault)',
    time: 'Feb 3, 11:45 AM',
    subject: 'Update our SAML certificate',
    preview: 'Our identity provider certificate expires Friday.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Chris Diaz',
        email: 'chris.diaz@dell.com',
        time: 'Feb 3, 11:45 AM',
        initial: 'C',
        avatarColor: 'var(--pastelOrangeBorderDefault)',
        body: 'Hello,\n\nOur SAML signing certificate expires on Friday. What\'s the safest way to upload the new one without locking people out?'
      }
    ]
  },
  {
    id: 67,
    inbox: 'Email Support 01',
    type: 'Mine',
    sender: 'Fatima Ali',
    initial: 'F',
    avatarColor: 'var(--pastelVioletBorderDefault)',
    time: 'Feb 3, 10:05 AM',
    subject: 'Nonprofit discount',
    preview: 'Do you offer pricing for registered charities?',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Fatima Ali',
        email: 'fatima.ali@paypal.com',
        time: 'Feb 3, 10:05 AM',
        initial: 'F',
        avatarColor: 'var(--pastelVioletBorderDefault)',
        body: 'Hi,\n\nWe\'re a registered charity. Do you offer a nonprofit discount, and what do you need from us to apply?'
      }
    ]
  },
  {
    id: 71,
    inbox: 'Email Support 02',
    type: 'Unassigned',
    sender: 'Leo Martin',
    initial: 'L',
    avatarColor: 'var(--pastelRedBorderDefault)',
    time: 'Feb 3, 06:30 PM',
    subject: 'Damaged items in last delivery',
    preview: 'Three boxes arrived crushed.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Leo Martin',
        email: 'leo.martin@fedex.com',
        time: 'Feb 3, 06:30 PM',
        initial: 'L',
        avatarColor: 'var(--pastelRedBorderDefault)',
        body: 'Hi,\n\nThree boxes in yesterday\'s delivery arrived crushed and the items inside are damaged. Photos attached.'
      }
    ]
  },
  {
    id: 72,
    inbox: 'Email Support 02',
    type: 'Unassigned',
    sender: 'Grace Hill',
    initial: 'G',
    avatarColor: 'var(--pastelVioletBorderDefault)',
    time: 'Feb 3, 05:00 PM',
    subject: 'Change delivery address',
    preview: 'Please send future orders to our new warehouse.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Grace Hill',
        email: 'grace.hill@fedex.com',
        time: 'Feb 3, 05:00 PM',
        initial: 'G',
        avatarColor: 'var(--pastelVioletBorderDefault)',
        body: 'Hello,\n\nWe\'ve moved to a new warehouse. Please send all future orders to the address below from next week.'
      }
    ]
  },
  {
    id: 73,
    inbox: 'Email Support 02',
    type: 'Unassigned',
    sender: 'Sophie Turner',
    initial: 'S',
    avatarColor: 'var(--pastelOrangeBorderDefault)',
    time: 'Feb 3, 03:40 PM',
    subject: 'Tax ID missing on invoice',
    preview: 'Our invoices don\'t show our tax ID.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Sophie Turner',
        email: 'sophie.turner@paypal.com',
        time: 'Feb 3, 03:40 PM',
        initial: 'S',
        avatarColor: 'var(--pastelOrangeBorderDefault)',
        body: 'Hi,\n\nOur tax ID isn\'t printed on the invoices we receive. Our auditors need it there. Can you add it?'
      }
    ]
  },
  {
    id: 74,
    inbox: 'Email Support 02',
    type: 'Unassigned',
    sender: 'Jack Reed',
    initial: 'J',
    avatarColor: 'var(--pastelLightBlueBorderDefault)',
    time: 'Feb 3, 02:15 PM',
    subject: 'Bulk import of contacts',
    preview: 'Is there a limit on CSV contact imports?',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Jack Reed',
        email: 'jack.reed@shopify.com',
        time: 'Feb 3, 02:15 PM',
        initial: 'J',
        avatarColor: 'var(--pastelLightBlueBorderDefault)',
        body: 'Hello,\n\nWe want to import about 40,000 contacts from a CSV file. Is there a size limit we should know about?'
      }
    ]
  },
  {
    id: 75,
    inbox: 'Email Support 02',
    type: 'Mine',
    sender: 'Ivy Nguyen',
    initial: 'I',
    avatarColor: 'var(--pastelRedBorderDefault)',
    time: 'Feb 3, 12:50 PM',
    subject: 'API keys for staging',
    preview: 'Can we get separate keys for our staging setup?',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Ivy Nguyen',
        email: 'ivy.nguyen@dell.com',
        time: 'Feb 3, 12:50 PM',
        initial: 'I',
        avatarColor: 'var(--pastelRedBorderDefault)',
        body: 'Hi,\n\nCould we get a separate set of API keys for our staging environment so test traffic doesn\'t count against production?'
      }
    ]
  },
  {
    id: 76,
    inbox: 'Email Support 02',
    type: 'Mine',
    sender: 'Hannah Moore',
    initial: 'H',
    avatarColor: 'var(--pastelOrangeBorderDefault)',
    time: 'Feb 3, 11:20 AM',
    subject: 'Order history export',
    preview: 'We need a full export of last year\'s orders.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Hannah Moore',
        email: 'hannah.moore@shopify.com',
        time: 'Feb 3, 11:20 AM',
        initial: 'H',
        avatarColor: 'var(--pastelOrangeBorderDefault)',
        body: 'Hello,\n\nFor our year-end review we need a full export of last year\'s orders. Is that something you can send over?'
      }
    ]
  },
  {
    id: 77,
    inbox: 'Email Support 02',
    type: 'Mine',
    sender: 'Lucas Gray',
    initial: 'L',
    avatarColor: 'var(--pastelVioletBorderDefault)',
    time: 'Feb 3, 09:40 AM',
    subject: 'Two-week trial extension',
    preview: 'We need a bit more time to evaluate.',
    threadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'Lucas Gray',
        email: 'lucas.gray@airbnb.com',
        time: 'Feb 3, 09:40 AM',
        initial: 'L',
        avatarColor: 'var(--pastelVioletBorderDefault)',
        body: 'Hi,\n\nOur evaluation is taking longer than planned. Could you extend our trial by two weeks?'
      }
    ]
  }
];
