import { useMemo, useState } from 'react';

import Styles from './BlogSearch.module.css';
import type { MarkdownInstance } from 'astro';

const Tag = ({ tag }: { tag: string }) => {
  return <div className={Styles.tag}>{tag}</div>;
};

const BlogSearch = ({
  posts,
}: {
  posts: MarkdownInstance<Record<string, any>>[];
}) => {
  return (
    <div id={Styles.posts}>
      {posts.map((post) => {
        console.log({ post });
        return (
          <div key={post.url} className={Styles.post}>
            <img src={post.frontmatter.heroImagePath} />
            <div className={Styles.info}>
              <a href={post.url}>
                <h2 className={Styles.title}>{post.frontmatter.title}</h2>
              </a>
              <h3 className={Styles.subtitle}>{post.frontmatter.subtitle}</h3>
              <h6 className={Styles.date}>{post.frontmatter.date}</h6>
              {/* <div set:html={post.compiledContent()} /> */}
              <div className={Styles.tags}>
                {post.frontmatter.tags.map((tag: string) => {
                  return <Tag key={tag} tag={tag} />;
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BlogSearch;
