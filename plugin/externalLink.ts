import type { RehypePlugin } from '@astrojs/markdown-remark';
import { visit } from 'unist-util-visit';
import type { Element } from 'hast';

interface Options {
  domains: string[];
}

export const externalLink: RehypePlugin = (options?: Options) => {
  const domains = options?.domains ?? [];

  return (tree) => {
    visit(tree, (node) => {
      if (node.type != 'element') {
        return;
      }

      const element = node as Element;

      if (!isAnchor(element)) {
        return;
      }

      const url = getUrl(element);

      if (isExternal(url, domains)) {
        element.properties!['target'] = '_blank';
      }
    });
  };
};

const isAnchor = (element: Element) =>
  element.tagName == 'a' && element.properties && 'href' in element.properties;

const getUrl = (element: Element) => {
  if (!element.properties) {
    return '';
  }

  const url = element.properties['href'];

  if (!url) {
    return '';
  }

  return url.toString();
};

const isExternal = (url: string, domains: string[]) => {
  console.log(url, domains);
  return (
    url.startsWith('http') && !domains.some((domain) => url.includes(domain))
  );
};
