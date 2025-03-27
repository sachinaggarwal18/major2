declare module '*.jsx' {
  import React from 'react';
  const component: React.ComponentType<any>;
  export default component;
}

declare module '*.tsx' {
  import React from 'react';
  const component: React.ComponentType<any>;
  export default component;
}

declare module '*.css' {
  const css: { [key: string]: string };
  export default css;
}

declare module '*.svg' {
  import React from 'react';
  const SVG: React.VFC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}