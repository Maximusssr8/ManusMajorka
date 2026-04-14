import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const FAQS = [
  {
    q: 'Is the Academy really free?',
    a: "Yes. All 48 lessons are free forever. A handful of premium deep-dives require Majorka Builder, but every foundational module is unlocked without a card.",
  },
  {
    q: 'Do I need prior e-commerce experience?',
    a: "No. Module 1 assumes zero background. If you've never seen a Shopify admin, you will still be productive by lesson 6.",
  },
  {
    q: 'Which market is it built for?',
    a: 'AU is the anchor, but every lesson carries US and UK-specific callouts — ad costs, shipping windows, AOV targets, compliance, and payment stacks.',
  },
  {
    q: 'How long does it take to finish?',
    a: 'About 8 focused hours across the 48 lessons. Most operators finish the free core modules in a weekend and dip into advanced modules as they scale.',
  },
  {
    q: 'Will this actually help me make money?',
    a: 'The Academy gives you the playbook. Majorka gives you the live data. The two together reliably collapse "months of wheel-spinning" into "first sale in weeks".',
  },
  {
    q: 'Can I earn a certificate?',
    a: 'Yes — once you finish the final lesson of Module 8, Majorka issues the "Majorka Certified Product Intelligence Analyst" credential. Shareable on LinkedIn.',
  },
  {
    q: 'What if I get stuck?',
    a: "Every lesson has an inline comment thread. Premium subscribers can also ask Maya, Majorka's AI, directly inside any dashboard.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="border-t border-white/[0.05] py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.55 }}
          className="mb-10 text-center md:mb-14"
        >
          <div className="mb-3 text-[10px] font-mono uppercase tracking-widest text-[#d4af37]">
            Frequently Asked
          </div>
          <h2
            className="text-3xl font-bold tracking-tight text-[#E0E0E0] md:text-5xl"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Questions, answered.
          </h2>
        </motion.div>

        <div className="space-y-2">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className="overflow-hidden rounded-2xl border"
                style={{ borderColor: 'rgba(212,175,55,0.1)', background: '#111111' }}
              >
                <button
                  type="button"
                  onClick={() => setOpen((cur) => (cur === i ? null : i))}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02]"
                >
                  <span className="text-[15px] font-medium text-[#E0E0E0]">{f.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className="text-[#9CA3AF]">
                    <ChevronDown size={18} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="a"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-5 pb-5 text-sm leading-relaxed text-[#9CA3AF]">{f.a}</div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
