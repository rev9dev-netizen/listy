import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  SparklesIcon,
  KeyIcon,
  FileTextIcon,
  CheckCircleIcon,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Listy</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              AI-Powered Amazon Listing Builder
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Generate compliant, keyword-smart Amazon listings without
              stuffing. Let AI handle the optimization while you focus on
              selling.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Building Free
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              How It Works
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <KeyIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">
                  Keyword Generation
                </h3>
                <p className="text-muted-foreground">
                  Extract and analyze keywords from competitor ASINs and seed
                  phrases. Get smart clustering and classification.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <FileTextIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Listing Creation</h3>
                <p className="text-muted-foreground">
                  AI generates compelling titles, bullets, and descriptions with
                  natural keyword placement.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <CheckCircleIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Compliance Check</h3>
                <p className="text-muted-foreground">
                  Real-time validation ensures your listing meets Amazon&apos;s
                  policies and character limits.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold">
                Ready to optimize your listings?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join sellers who are creating better Amazon listings with AI.
              </p>
              <Link href="/sign-up">
                <Button size="lg">Start Your Free Project</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Listy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
