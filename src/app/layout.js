import './globals.css';

export const metadata = { title: 'bejpoChats', description: 'Virtual Number Messaging' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0a192f] text-white antialiased">{children}</body>
    </html>
  );
}
