// app/layout.tsx 에 추가 (서버 컴포넌트에 있어야 함)
import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#070707',
};
