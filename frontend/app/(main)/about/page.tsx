import type { Metadata } from "next";
import { AboutPageClient } from "./AboutPageClient";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
    return <AboutPageClient />;
}