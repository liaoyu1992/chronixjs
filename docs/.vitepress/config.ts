import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'en-US',
  title: 'Chronix',
  description: 'Framework-agnostic component library — Gantt, Table, UI, CX Kit',
  base: '/chronixjs/',
  head: [['link', { rel: 'icon', href: '/chronixjs/favicon.ico' }]],
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Chronix',

    nav: [
      { text: 'Guide', link: '/getting-started/installation' },
      { text: 'Gantt', link: '/gantt/' },
      { text: 'Table', link: '/table/' },
      { text: 'UI', link: '/ui/' },
      { text: 'CX Kit', link: '/cx-kit/' },
      {
        text: 'v0.1 (alpha)',
        items: [
          { text: 'GitHub', link: 'https://github.com/liaoyu1992/chronixjs' },
          { text: 'npm', link: 'https://www.npmjs.com/org/chronixjs' },
        ],
      },
    ],

    sidebar: {
      '/gantt/': [
        { text: 'Overview', link: '/gantt/' },
        { text: 'Getting Started', link: '/gantt/getting-started' },
        {
          text: 'Features',
          collapsed: false,
          items: [
            { text: 'Bars', link: '/gantt/bars' },
            { text: 'Links & Dependencies', link: '/gantt/links' },
            { text: 'Timeline Views', link: '/gantt/views' },
            { text: 'Theme', link: '/gantt/theme' },
          ],
        },
        {
          text: 'API Reference',
          link: '/gantt/api',
        },
      ],
      '/table/': [
        { text: 'Overview', link: '/table/' },
        { text: 'Getting Started', link: '/table/getting-started' },
        {
          text: 'Features',
          collapsed: false,
          items: [
            { text: 'Columns', link: '/table/columns' },
            { text: 'Rows & Data', link: '/table/rows' },
            { text: 'Sorting', link: '/table/sorting' },
            { text: 'Filtering', link: '/table/filtering' },
            { text: 'Inline Editing', link: '/table/editing' },
            { text: 'Tree Data', link: '/table/tree-data' },
            { text: 'Pinned Columns/Rows', link: '/table/pinned' },
            { text: 'Export (CSV)', link: '/table/export' },
            { text: 'Theme', link: '/table/theme' },
          ],
        },
        { text: 'API Reference', link: '/table/api' },
      ],
      '/ui/': [
        { text: 'Overview', link: '/ui/' },
        { text: 'Getting Started', link: '/ui/getting-started' },
        { text: 'Theme System', link: '/ui/theme' },
        {
          text: 'Components',
          collapsed: false,
          items: [
            { text: 'Button', link: '/ui/components/button' },
            { text: 'Tag', link: '/ui/components/tag' },
            { text: 'Badge', link: '/ui/components/badge' },
            { text: 'Input', link: '/ui/components/input' },
            { text: 'Checkbox', link: '/ui/components/checkbox' },
            { text: 'Switch', link: '/ui/components/switch' },
            { text: 'Radio', link: '/ui/components/radio' },
            { text: 'Avatar', link: '/ui/components/avatar' },
            { text: 'Typography', link: '/ui/components/typography' },
          ],
        },
      ],
      '/cx-kit/': [
        { text: 'Overview', link: '/cx-kit/' },
        { text: 'Getting Started', link: '/cx-kit/getting-started' },
        { text: 'Virtual List', link: '/cx-kit/virtual-list' },
        { text: 'Slider', link: '/cx-kit/slider' },
        { text: 'Input Range', link: '/cx-kit/input-range' },
        { text: 'Color Picker', link: '/cx-kit/color-picker' },
        { text: 'Autocomplete', link: '/cx-kit/autocomplete' },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/liaoyu1992/chronixjs' }],

    editLink: {
      pattern: 'https://github.com/liaoyu1992/chronixjs/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2024-present liaoyu1992',
    },
  },
});
