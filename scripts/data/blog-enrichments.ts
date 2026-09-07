export const BLOG_ENRICHMENTS = {
  '/2018/04/02/reading-list.html': {
    relationships: [
      { label: 'Continued in', collection: 'blog', id: 'mustread-books-for' },
      { label: 'Related skill', collection: 'skills', id: 'goodreads-export' },
    ],
  },
  '/2018/11/27/playlists.html': {
    relationships: [
      { label: 'Continued in', collection: 'blog', id: '2019-playlists' },
      {
        label: 'Another personal archive',
        collection: 'blog',
        id: 'reading-list',
      },
    ],
  },
  '/2019/05/30/listwithme.html': {
    relatedProject: 'listwithme',
    relationships: [
      { label: 'Built as', collection: 'projects', id: 'listwithme' },
      { label: 'Rebuilt later', collection: 'blog', id: 'listwithme-returns' },
    ],
  },
  '/2019/06/04/wwdc-day-1.html': {
    relationships: [
      { label: 'Next day', collection: 'blog', id: 'wwdc-day-2' },
      { label: 'Week in review', collection: 'blog', id: 'wwdc-review' },
    ],
  },
  '/2019/06/06/wwdc-day-2.html': {
    relationships: [
      { label: 'Previous day', collection: 'blog', id: 'wwdc-day-1' },
      { label: 'Next day', collection: 'blog', id: 'wwdc-day-3' },
      { label: 'Week in review', collection: 'blog', id: 'wwdc-review' },
    ],
  },
  '/2019/06/07/wwdc-day-3.html': {
    relationships: [
      { label: 'Previous day', collection: 'blog', id: 'wwdc-day-2' },
      { label: 'Next day', collection: 'blog', id: 'wwdc-day-4' },
      { label: 'Week in review', collection: 'blog', id: 'wwdc-review' },
    ],
  },
  '/2019/06/08/wwdc-day-4.html': {
    relationships: [
      { label: 'Previous day', collection: 'blog', id: 'wwdc-day-3' },
      { label: 'Week in review', collection: 'blog', id: 'wwdc-review' },
    ],
  },
  '/2019/06/09/wwdc-review.html': {
    relationships: [
      {
        label: 'Where the week began',
        collection: 'blog',
        id: 'wwdc-day-1',
      },
      {
        label: 'How the week ended',
        collection: 'blog',
        id: 'wwdc-day-4',
      },
    ],
  },
  '/2020/02/10/2019-playlists.html': {
    relationships: [
      { label: 'Earlier playlists', collection: 'blog', id: 'playlists' },
      { label: 'Another annual list', collection: 'blog', id: 'reading-list' },
    ],
  },
  '/2020/05/23/mac_apps.html': {
    relationships: [
      {
        label: 'Current notes tool',
        collection: 'app-library',
        id: 'obsidian',
      },
      {
        label: 'One developer workflow',
        collection: 'blog',
        id: 'safari-inspecting-simulators',
      },
      {
        label: 'Later tools thinking',
        collection: 'blog',
        id: 'notion-for-software',
      },
    ],
  },
  '/2020/05/29/safari-inspecting-simulators.html': {
    relationships: [
      { label: 'Part of the toolkit', collection: 'blog', id: 'mac_apps' },
      {
        label: 'Another iOS test workflow',
        collection: 'blog',
        id: 'accessibility-testing-in',
      },
    ],
  },
  '/2020/09/28/next-chapter.html': {
    relationships: [
      {
        label: 'What came next',
        collection: 'blog',
        id: '2-years-at-illuminate',
      },
      {
        label: 'More healthcare software',
        collection: 'blog',
        id: 'healthql-sql-for-healthkit',
      },
    ],
  },
  '/2022/11/07/2-years-at-illuminate.html': {
    relationships: [
      {
        label: 'Where the chapter began',
        collection: 'blog',
        id: 'next-chapter',
      },
      {
        label: 'Later healthcare software',
        collection: 'blog',
        id: 'healthql-sql-for-healthkit',
      },
    ],
  },
  '/2023/01/02/mustread-books-for.html': {
    relationships: [
      { label: 'Earlier reading list', collection: 'blog', id: 'reading-list' },
      { label: 'Related skill', collection: 'skills', id: 'goodreads-export' },
    ],
  },
  '/2023/01/14/notion-for-software.html': {
    relationships: [
      { label: 'What I use now', collection: 'app-library', id: 'obsidian' },
      { label: 'Earlier tools list', collection: 'blog', id: 'mac_apps' },
    ],
  },
  '/2023/02/01/expo-app-config.html': {
    relationships: [
      {
        label: 'Built on this stack',
        collection: 'blog',
        id: 'healthql-react-native',
      },
      {
        label: 'Another mobile workflow',
        collection: 'blog',
        id: 'accessibility-testing-in',
      },
    ],
  },
  '/2023/05/15/using-act-to.html': {
    relationships: [
      {
        label: 'Another CI test workflow',
        collection: 'blog',
        id: 'accessibility-testing-in',
      },
      {
        label: 'Another release workflow',
        collection: 'blog',
        id: 'expo-app-config',
      },
    ],
  },
  '/2023/07/19/accessibility-testing-in.html': {
    relationships: [
      {
        label: 'Related mobile setup',
        collection: 'blog',
        id: 'expo-app-config',
      },
      {
        label: 'Related local CI workflow',
        collection: 'blog',
        id: 'using-act-to',
      },
      {
        label: 'Earlier iOS testing',
        collection: 'blog',
        id: 'safari-inspecting-simulators',
      },
    ],
  },
  '/2026/02/01/healthql-sql-for-healthkit.html': {
    relatedProject: 'healthql',
    relationships: [
      { label: 'Built as', collection: 'projects', id: 'healthql' },
      {
        label: 'Expanded in',
        collection: 'blog',
        id: 'healthql-react-native',
      },
    ],
  },
  '/2026/02/07/healthql-react-native.html': {
    relatedProject: 'healthql',
    relationships: [
      { label: 'Built as', collection: 'projects', id: 'healthql' },
      {
        label: 'Built on',
        collection: 'blog',
        id: 'healthql-sql-for-healthkit',
      },
      {
        label: 'Related Expo setup',
        collection: 'blog',
        id: 'expo-app-config',
      },
    ],
  },
  '/2026/02/24/listwithme-returns.html': {
    kind: 'Build log',
    titleAccent: 'ListWithMe',
    featuredArt: {
      src: 'evidence/listwithme-hand.png',
      alt: 'A fine blue halftone drawing of a hand holding a pen',
      decorative: false,
    },
    relatedProject: 'listwithme',
    numberHeadings: true,
    relationships: [
      { label: 'Built as', collection: 'projects', id: 'listwithme' },
      { label: 'Earlier chapter', collection: 'blog', id: 'listwithme' },
    ],
  },
  '/2026/09/01/skill-thief.html': {
    relationships: [
      {
        label: 'Related authored skill',
        collection: 'skills',
        id: 'write-like-grant',
      },
      {
        label: 'Related authored skill',
        collection: 'skills',
        id: 'goodreads-export',
      },
    ],
  },
  '/2026/09/01/vampire.html': {
    relationships: [
      { label: 'Earlier Mac toolkit', collection: 'blog', id: 'mac_apps' },
      {
        label: 'Another Swift project',
        collection: 'blog',
        id: 'healthql-sql-for-healthkit',
      },
      {
        label: 'Another app revival',
        collection: 'blog',
        id: 'listwithme-returns',
      },
    ],
  },
} as const;
