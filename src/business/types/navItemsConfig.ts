export type NavDropdownItemConfig = {
  label: string;
  href: string;
};

export type NavDropdownGroupConfig = NavDropdownItemConfig & {
  items: NavDropdownItemConfig[];
};

export type NavItemConfig =
  | { name: string; link: string; dropdown?: never }
  | { name: string; link?: never; dropdown: NavDropdownItemConfig[] }
  | {
      name: string;
      link?: never;
      dropdownGroups: NavDropdownGroupConfig[];
      dropdownFooter: NavDropdownItemConfig;
    };
