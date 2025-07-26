type Nav = { url: string; title: string; dotColor: string };

export type LayoutProps = {
  title?: string;
  description?: string;
  navs?: Nav[];
  hasAnimation?: boolean;
  frontmatter?: Record<string, any>;
};
