declare module '@huddle01/iframe' {
  import { FC, HTMLAttributes } from 'react';

  export interface HuddleIframeProps extends HTMLAttributes<HTMLIFrameElement> {
    roomUrl: string;
    className?: string;
  }

  export const HuddleIframe: FC<HuddleIframeProps>;

  export const iframeApi: {
    initialize: (options: {
      logoUrl?: string;
      background?: string;
      redirectUrlOnLeave?: string;
    }) => void;
  };
} 