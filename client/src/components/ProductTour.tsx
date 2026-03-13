/**
 * ProductTour — Driver.js powered product tour for new users.
 * Triggered on first login (localStorage: majorka_tour_completed).
 * Re-triggerable from Settings page via startTour().
 */

import { type DriveStep, driver } from 'driver.js';
import { useCallback, useEffect, useRef } from 'react';
import 'driver.js/dist/driver.css';
import { useLocation } from 'wouter';

const TOUR_KEY = 'majorka_tour_completed';

function buildSteps(navigate: (path: string) => void): DriveStep[] {
  return [
    {
      element: "[data-tour='dashboard']",
      popover: {
        title: 'Welcome to Majorka \u{1F1E6}\u{1F1FA}',
        description:
          "Australia's most powerful ecommerce AI. Let us show you around \u2014 takes 90 seconds.",
        side: 'bottom',
        align: 'center',
        nextBtnText: "Let's Go \u2192",
        showButtons: ['next', 'close'],
      },
    },
    {
      element: "[data-tour='sidebar-nav']",
      popover: {
        title: 'Your AI Toolbox',
        description:
          "Everything's organised by what you're doing: Research \u2192 Build \u2192 Launch \u2192 Grow. Start with Research.",
        side: 'right',
        align: 'start',
      },
    },
    {
      element: "[data-tour='nav-product-discovery']",
      popover: {
        title: 'Find Your Winning Product',
        description:
          "Tell our AI your budget and niche. It'll find products with real AU demand, supplier prices in AUD, and margin estimates. This is where most sellers start.",
        side: 'right',
        align: 'start',
        nextBtnText: 'Next \u2192',
      },
    },
    {
      element: "[data-tour='nav-brand-dna']",
      popover: {
        title: 'Build Your Brand in 60 Seconds',
        description:
          'Paste your niche and our AI generates your entire brand identity: name, colours, voice, logo direction \u2014 all AU-native.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: "[data-tour='nav-website-generator']",
      popover: {
        title: 'Your Store, Ready to Launch',
        description:
          'Choose a template, describe your brand, and get production-ready Shopify Liquid files. Download and upload directly to Shopify \u2014 no coding required.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: "[data-tour='nav-meta-ads']",
      popover: {
        title: 'Ads That Actually Convert',
        description:
          'AU-specific Meta ad copy with Afterpay mentions, ACCC-compliant claims, and AEST-timed posting suggestions. 5 variations, ready to run.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: "[data-tour='nav-ai-chat']",
      popover: {
        title: 'Your AI Business Partner',
        description:
          'Ask anything about your ecommerce business. Product ideas, supplier questions, pricing strategy, marketing \u2014 your AI knows the AU market inside out.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: "[data-tour='dashboard']",
      popover: {
        title: "You're Ready. Let's Make Money. \u{1F4B0}",
        description:
          'Most users find their first winning product within 20 minutes. Start with Product Discovery \u2192',
        side: 'bottom',
        align: 'center',
        nextBtnText: 'Start Product Discovery',
        showButtons: ['next', 'close'],
        onNextClick: () => {
          navigate('/app/product-discovery');
        },
      },
    },
  ];
}

export function useProductTour() {
  const [, setLocation] = useLocation();
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const startTour = useCallback(() => {
    // Small delay to let DOM settle
    setTimeout(() => {
      const d = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        stagePadding: 6,
        stageRadius: 12,
        popoverClass: 'majorka-tour-popover',
        overlayColor: 'rgba(0,0,0,0.75)',
        steps: buildSteps(setLocation),
        onDestroyStarted: () => {
          localStorage.setItem(TOUR_KEY, 'true');
          d.destroy();
        },
      });
      driverRef.current = d;
      d.drive();
    }, 400);
  }, [setLocation]);

  const shouldAutoStart = useCallback(() => {
    return !localStorage.getItem(TOUR_KEY);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_KEY);
  }, []);

  return { startTour, shouldAutoStart, resetTour };
}

/**
 * ProductTour component — auto-starts tour on first visit.
 * Include this inside Dashboard.
 */
export default function ProductTour() {
  const { startTour, shouldAutoStart } = useProductTour();

  useEffect(() => {
    // Only auto-start if user hasn't completed the tour AND has completed onboarding/welcome
    const welcomed = localStorage.getItem('majorka_welcomed');
    if (shouldAutoStart() && welcomed) {
      startTour();
    }
  }, [startTour, shouldAutoStart]);

  return null;
}
