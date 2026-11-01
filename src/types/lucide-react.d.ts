declare module 'lucide-react' {
  import * as React from 'react';

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }

  export type LucideIcon = React.FC<LucideProps>;

  export const Globe: LucideIcon;
  export const Globe2: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowDown: LucideIcon;
  export const Check: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Shield: LucideIcon;
  export const Database: LucideIcon;
  export const Bot: LucideIcon;
  export const Handshake: LucideIcon;
  export const Plus: LucideIcon;
  export const Trash2: LucideIcon;
  export const Edit: LucideIcon;
  export const FileText: LucideIcon;
  export const Upload: LucideIcon;
  export const Link: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Eye: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Users: LucideIcon;
  export const Clock: LucideIcon;
  export const LogOut: LucideIcon;
  export const Mail: LucideIcon;
  export const Video: LucideIcon;
  export const Pause: LucideIcon;
  export const Play: LucideIcon;
  export const Asterisk: LucideIcon;
}
