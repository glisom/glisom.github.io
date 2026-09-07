export interface ListWithMeLink {
  text: string;
  href: string;
}

export type ListWithMeBlock =
  | { kind: 'heading'; level: 2 | 3; text: string; id: string }
  | { kind: 'paragraph'; text: string; links: readonly ListWithMeLink[] }
  | {
      kind: 'list';
      ordered: boolean;
      items: readonly {
        text: string;
        links: readonly ListWithMeLink[];
      }[];
    };

export interface ListWithMeUtilityPage {
  title: string;
  lastUpdated?: string;
  contactPath: string;
  backPath: string;
  blocks: readonly ListWithMeBlock[];
}

const contactPath = 'mailto:grant.isom@gmail.com';
const backPath = '/listwithme/';

export const LISTWITHME_SUPPORT = {
  title: 'ListWithMe Support',
  contactPath,
  backPath,
  blocks: [
    {
      kind: 'heading',
      level: 2,
      text: 'Getting Started',
      id: 'getting-started',
    },
    {
      kind: 'paragraph',
      text: 'ListWithMe is an iMessage app that lets you create and share lists with anyone in your conversations.',
      links: [],
    },
    {
      kind: 'heading',
      level: 3,
      text: 'How to Open ListWithMe',
      id: 'how-to-open-listwithme',
    },
    {
      kind: 'list',
      ordered: true,
      items: [
        { text: 'Open the Messages app', links: [] },
        { text: 'Start or open a conversation', links: [] },
        {
          text: 'Tap the + button (or Apps icon) next to the text field',
          links: [],
        },
        { text: 'Find and tap ListWithMe', links: [] },
      ],
    },
    {
      kind: 'heading',
      level: 3,
      text: 'Creating Your First List',
      id: 'creating-your-first-list',
    },
    {
      kind: 'list',
      ordered: true,
      items: [
        { text: 'Tap New List and give it a name', links: [] },
        { text: 'Tap on the list to open it', links: [] },
        {
          text: 'Type an item name and press return to add it',
          links: [],
        },
        {
          text: 'Tap Send List to share it in the conversation',
          links: [],
        },
      ],
    },
    { kind: 'heading', level: 2, text: 'Features', id: 'features' },
    {
      kind: 'heading',
      level: 3,
      text: 'Smart Quantity Input',
      id: 'smart-quantity-input',
    },
    {
      kind: 'paragraph',
      text: 'Type quantities naturally: "3 apples", "milk x2", or "eggs x12" and ListWithMe will automatically set the item quantity.',
      links: [],
    },
    {
      kind: 'heading',
      level: 3,
      text: 'Priorities & Due Dates',
      id: 'priorities-and-due-dates',
    },
    {
      kind: 'paragraph',
      text: 'Tap the info button (ⓘ) on any item to set priority levels and due dates.',
      links: [],
    },
    {
      kind: 'heading',
      level: 3,
      text: 'Categories',
      id: 'categories',
    },
    {
      kind: 'paragraph',
      text: 'Organize items by category (Produce, Dairy, etc.) for easier shopping.',
      links: [],
    },
    {
      kind: 'heading',
      level: 3,
      text: 'Sorting & Searching',
      id: 'sorting-and-searching',
    },
    {
      kind: 'paragraph',
      text: 'Use the sort menu to organize by name, category, priority, or due date. Use the search bar to find items quickly.',
      links: [],
    },
    {
      kind: 'heading',
      level: 3,
      text: 'Batch Selection',
      id: 'batch-selection',
    },
    {
      kind: 'paragraph',
      text: 'Tap the menu (⋯) and select "Select Items" to choose multiple items for batch complete or delete.',
      links: [],
    },
    { kind: 'heading', level: 2, text: 'FAQ', id: 'faq' },
    {
      kind: 'paragraph',
      text: "Q: Where is the app on my home screen? A: ListWithMe is an iMessage-only app. It lives inside the Messages app and doesn't appear on your home screen.",
      links: [],
    },
    {
      kind: 'paragraph',
      text: "Q: Can I use ListWithMe without sending a message? A: Yes! You can create and manage lists without sending them. They're stored locally until you choose to share.",
      links: [],
    },
    {
      kind: 'paragraph',
      text: 'Q: Is my data synced across devices? A: Yes, your lists sync via iCloud to all your devices signed into the same Apple ID.',
      links: [],
    },
    {
      kind: 'paragraph',
      text: 'Q: Can I share lists with Android users? A: ListWithMe requires iMessage, so both users need Apple devices.',
      links: [],
    },
    { kind: 'heading', level: 2, text: 'Contact', id: 'contact' },
    {
      kind: 'paragraph',
      text: 'Having issues or have suggestions? Email me at grant.isom@gmail.com',
      links: [{ text: 'grant.isom@gmail.com', href: contactPath }],
    },
    { kind: 'heading', level: 2, text: 'Privacy', id: 'privacy' },
    {
      kind: 'paragraph',
      text: "ListWithMe stores your lists locally on your device and syncs via iCloud. We don't collect any personal data or analytics. Your lists are your own.",
      links: [],
    },
    {
      kind: 'paragraph',
      text: 'View Privacy Policy',
      links: [{ text: 'View Privacy Policy', href: '/listwithme/privacy/' }],
    },
  ],
} as const satisfies ListWithMeUtilityPage;

export const LISTWITHME_PRIVACY = {
  title: 'ListWithMe Privacy Policy',
  lastUpdated: '2026-02-24',
  contactPath,
  backPath,
  blocks: [
    {
      kind: 'paragraph',
      text: 'Last updated: February 24, 2026',
      links: [],
    },
    { kind: 'heading', level: 2, text: 'Overview', id: 'overview' },
    {
      kind: 'paragraph',
      text: "ListWithMe is designed with privacy in mind. We believe your shopping lists are personal, and we've built the app to keep them that way.",
      links: [],
    },
    {
      kind: 'heading',
      level: 2,
      text: 'Data Collection',
      id: 'data-collection',
    },
    {
      kind: 'paragraph',
      text: 'We do not collect any personal data.',
      links: [],
    },
    {
      kind: 'paragraph',
      text: 'ListWithMe does not:',
      links: [],
    },
    {
      kind: 'list',
      ordered: false,
      items: [
        { text: 'Collect analytics or usage data', links: [] },
        { text: 'Track your location', links: [] },
        { text: 'Access your contacts', links: [] },
        { text: 'Store data on external servers', links: [] },
        { text: 'Include any third-party tracking SDKs', links: [] },
      ],
    },
    {
      kind: 'heading',
      level: 2,
      text: 'Data Storage',
      id: 'data-storage',
    },
    {
      kind: 'paragraph',
      text: 'Your lists are stored:',
      links: [],
    },
    {
      kind: 'list',
      ordered: false,
      items: [
        { text: 'Locally on your device using Core Data', links: [] },
        {
          text: 'In iCloud if you have iCloud enabled, for syncing across your Apple devices',
          links: [],
        },
      ],
    },
    {
      kind: 'paragraph',
      text: "All data stays within Apple's ecosystem. We never see or have access to your lists.",
      links: [],
    },
    { kind: 'heading', level: 2, text: 'iMessage', id: 'imessage' },
    {
      kind: 'paragraph',
      text: "When you share a list in iMessage, the list reference is sent through Apple's iMessage system. We do not have access to your messages or conversations.",
      links: [],
    },
    {
      kind: 'heading',
      level: 2,
      text: 'Third-Party Services',
      id: 'third-party-services',
    },
    {
      kind: 'paragraph',
      text: 'ListWithMe does not use any third-party services, analytics platforms, or advertising networks.',
      links: [],
    },
    {
      kind: 'heading',
      level: 2,
      text: "Children's Privacy",
      id: 'childrens-privacy',
    },
    {
      kind: 'paragraph',
      text: 'ListWithMe does not knowingly collect any information from children under 13.',
      links: [],
    },
    {
      kind: 'heading',
      level: 2,
      text: 'Changes to This Policy',
      id: 'changes-to-this-policy',
    },
    {
      kind: 'paragraph',
      text: 'If we make changes to this privacy policy, we will update the "Last updated" date above.',
      links: [],
    },
    { kind: 'heading', level: 2, text: 'Contact', id: 'contact' },
    {
      kind: 'paragraph',
      text: 'If you have questions about this privacy policy, contact me at grant.isom@gmail.com.',
      links: [{ text: 'grant.isom@gmail.com', href: contactPath }],
    },
  ],
} as const satisfies ListWithMeUtilityPage;
