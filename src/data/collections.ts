export const COLLECTIONS = {
  blog: {
    label: 'Blog',
    title: "Things I've written.",
    description:
      'Posts, build logs, playlists, and whatever else seemed worth writing down.',
  },
  'app-library': {
    label: 'App Library',
    title: 'Apps in my toolkit.',
    description: 'Notes on the apps in my setup and what I use them for.',
  },
  projects: {
    label: 'My Apps',
    title: 'Apps and libraries I’ve built.',
    description:
      'Mobile apps, Mac utilities, and open source projects, with descriptions and links to their product pages or source code.',
  },
  'skill-library': {
    label: 'Skill Library',
    title: 'AI skills from other people.',
    description:
      'Reusable instructions that help AI tools handle specific tasks, with credit to their creators.',
  },
  skills: {
    label: 'My Skills',
    title: 'AI skills I’ve made.',
    description:
      'Instructions for tasks I keep coming back to. Some are public; others are personal tools described here.',
  },
} as const;
