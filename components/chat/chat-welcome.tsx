"use client";

import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from "@/lib/constants";
import { Compass, Shield, Heart, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Shield,
    title: "Anonymous & Safe",
    description:
      "Your conversations are private and stored only on your device.",
  },
  {
    icon: Heart,
    title: "Empathetic Support",
    description: "CBT-based exercises and techniques tailored to your needs.",
  },
  {
    icon: Globe,
    title: "Culturally Aware",
    description: "Localized resources and crisis support for your region.",
  },
] as const;

export function ChatWelcome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8 md:py-12 px-6 text-center max-w-4xl mx-auto">
      {/* Logo and Branding - Always Centered */}
      <div className="rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 p-4 md:p-5 mb-4 md:mb-6 shadow-sm">
        <Compass className="size-10 md:size-12 text-primary" />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 md:mb-3">
        {APP_NAME}
      </h1>

      {/* Features - Desktop Only */}
      <div className="hidden sm:grid grid-cols-3 gap-3 w-full max-w-3xl">
        {FEATURES.map((feature) => (
          <Card
            key={feature.title}
            className="text-left border-dashed hover:border-solid transition-all hover:shadow-sm"
          >
            <CardContent className="space-y-2 p-4">
              <div className="rounded-lg bg-primary/10 w-fit p-2">
                <feature.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">{feature.title}</h3>
              <p className="text-xs text-muted-foreground/90 leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile - Simple Call to Action */}
      <div className="sm:hidden text-sm text-muted-foreground/70 max-w-xs">
        <p>
          Start a conversation to explore mental wellness support tailored for
          you.
        </p>
      </div>
    </div>
  );
}
