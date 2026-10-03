declare module 'react-native-svg' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface SvgProps extends ViewProps {
    width?: number | string;
    height?: number | string;
    viewBox?: string;
    color?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number | string;
    strokeLinecap?: 'butt' | 'round' | 'square';
    strokeLinejoin?: 'miter' | 'round' | 'bevel';
    opacity?: number | string;
  }

  export const Svg: React.FC<SvgProps>;
  export default Svg;
  export const Path: React.FC<any>;
  export const Rect: React.FC<any>;
  export const Circle: React.FC<any>;
  export const Line: React.FC<any>;
  export const G: React.FC<any>;
  export const Polygon: React.FC<any>;
  export const Polyline: React.FC<any>;
  export const Defs: React.FC<any>;
  export const Stop: React.FC<any>;
  export const LinearGradient: React.FC<any>;
  export const RadialGradient: React.FC<any>;
}
