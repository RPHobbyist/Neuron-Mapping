/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { sanitizeImageUrl, sanitizeUrl } from '@/utils/common';

const safeUrl = (url: string, key: string) => (key === 'src' ? sanitizeImageUrl(url) : sanitizeUrl(url)) ?? '';

const NotesMarkdown = ({ text }: { text: string }) => (
  <div className="notes-markdown">
    <Markdown
      remarkPlugins={[remarkGfm]}
      urlTransform={safeUrl}
      components={{
        a: ({ href, children }) => (href
          ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
          : <span>{children}</span>),
      }}
    >
      {text}
    </Markdown>
  </div>
);

export default NotesMarkdown;
