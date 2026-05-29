import "./globals.css";

export const metadata = {
  title: "Student Dashboard",
  description: "Student dashboard"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
