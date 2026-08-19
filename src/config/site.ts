/**
 * Single source of truth for identity, links and section registry.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS IS THE ONLY FILE YOU NEED TO EDIT to personalise links and contact info.
 * Replace the `YOUR_*` placeholders below with real URLs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const GITHUB_URL = 'https://github.com/Aakash-twr';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/aakash-tiwary-1187b1223/';
export const LEETCODE_URL = 'https://leetcode.com/u/Takash/';
export const EMAIL = 'tiwaryakash0308@gmail.com';
export const RESUME_URL = '/26_Akash.pdf';

/** A link is treated as unresolved while it still holds its placeholder value. */
export const isPlaceholder = (url: string): boolean => url.startsWith('YOUR_');

export const site = {
  name: 'Akash Tiwary',
  role: 'Full Stack Developer',
  company: 'Seven Robotics',
  companyTenure: 'July 2023 — Present',
  yearsExperience: 3,
  location: 'India',
  /** Used by the footer copyright. */
  copyrightYear: 2026,
  /** Update after deploying so canonical/OG URLs and the sitemap match. */
  domain: 'https://akashtiwary.dev',
  tagline: 'Full Stack Developer building high-performance interfaces and real-time systems.',
  availability: {
    label: `Currently building at Seven Robotics`,
    /** Flip to false to hide the "open to opportunities" line in Contact. */
    openToWork: true,
  },
} as const;

export type SocialLink = {
  id: 'github' | 'linkedin' | 'leetcode' | 'email';
  label: string;
  /** Shown in the ⌘K menu and tooltips. */
  handleHint: string;
  href: string;
  external: boolean;
};

export const socialLinks: readonly SocialLink[] = [
  {
    id: 'github',
    label: 'GitHub',
    handleHint: 'Source code and side projects',
    href: GITHUB_URL,
    external: true,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handleHint: 'Work history and contact',
    href: LINKEDIN_URL,
    external: true,
  },
  {
    id: 'leetcode',
    label: 'LeetCode',
    handleHint: 'Data structures and algorithms',
    href: LEETCODE_URL,
    external: true,
  },
  {
    id: 'email',
    label: 'Email',
    handleHint: EMAIL,
    href: `mailto:${EMAIL}`,
    external: false,
  },
] as const;

export type SectionId =
  | 'work'
  | 'about'
  | 'experience'
  | 'spatial'
  | 'impact'
  | 'projects'
  | 'stack'
  | 'approach'
  | 'contact';

export type NavItem = {
  id: SectionId;
  label: string;
  /** Kept out of the desktop bar to protect the horizontal rhythm. */
  navHidden?: boolean;
};

/**
 * Drives the header, the scroll-spy indicator and the ⌘K menu from one list so
 * they can never drift apart.
 */
export const navItems: readonly NavItem[] = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'spatial', label: '3D' },
  { id: 'impact', label: 'Impact', navHidden: true },
  { id: 'projects', label: 'Projects' },
  { id: 'stack', label: 'Stack' },
  { id: 'approach', label: 'Approach', navHidden: true },
  { id: 'contact', label: 'Contact' },
] as const;
