import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Driveway Mechanics — Honest Auto Repair, At Your Home",
  description:
    "On-demand mobile auto repair across South Florida. See your exact price before we touch your car — and never lose a day at the shop. Miami · West Palm Beach · Port St. Lucie.",
  openGraph: {
    title: "Driveway Mechanics — Honest Auto Repair, At Your Home",
    description:
      "A licensed mechanic comes to your driveway. Upfront fixed pricing, live ETA, in-app payment.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
