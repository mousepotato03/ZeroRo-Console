"use client";

import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../components/Layout';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    // 로그아웃 처리 - 실제 구현에서는 세션/토큰 삭제
    router.push('/');
  };

  return (
    <DashboardLayout onLogout={handleLogout}>
      {children}
    </DashboardLayout>
  );
}
