export type NavItemConfig =
  | { name: string; link: string; dropdown?: never }
  | { name: string; link?: never; dropdown: { label: string; href: string }[] };
