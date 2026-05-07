import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "万能导入 - 多模板自动导入下单系统",
  description: "支持多种Excel模板的自动识别与导入，完成批量下单流程",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
