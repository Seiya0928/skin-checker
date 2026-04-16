import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SkinChecker - 化粧品成分をAIで解析',
  description: '化粧品・スキンケアの成分をAIが解析。刺激成分・危険成分を即チェック。成分表を貼るだけで安全性を確認できます。',
  openGraph: {
    title: 'SkinChecker - 化粧品成分をAIで解析',
    description: '成分表を貼るだけでAIが安全性を解析。刺激成分・避けるべき成分をチェック。',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary',
    title: 'SkinChecker - 化粧品成分をAIで解析',
    description: '成分表を貼るだけでAIが安全性を解析。刺激成分・避けるべき成分をチェック。',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={geist.className}>
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <div className="max-w-lg mx-auto px-4 py-6 w-full flex-1">
          <header className="mb-6">
            <a href="/" className="text-xl font-bold text-gray-900">
              🧴 SkinChecker
            </a>
          </header>
          <main>{children}</main>
        </div>
        <footer className="max-w-lg mx-auto px-4 py-4 w-full border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            SkinCheckerは医療・薬事的な診断を行うものではありません。<br />
            本アプリはスキンケア選びの参考情報を提供するツールです。<br />
            肌トラブルがある場合は皮膚科医にご相談ください。
          </p>
        </footer>
      </body>
    </html>
  );
}
