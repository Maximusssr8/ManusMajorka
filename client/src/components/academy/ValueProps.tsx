import { motion } from 'framer-motion';
import { Database, Globe2, TrendingUp } from 'lucide-react';

const PROPS = [
  {
    icon: Database,
    title: 'Built on Real Data',
    body:
      'Every lesson references the 10,000+ live AliExpress products Majorka tracks. No theory — only patterns that hold up in a live dashboard.',
  },
  {
    icon: Globe2,
    title: 'Made for AU, US & UK Markets',
    body:
      'Region-specific shipping windows, ad-spend benchmarks, AOV targets, and compliance — instead of generic "just run ads" advice.',
  },
  {
    icon: TrendingUp,
    title: 'From Zero to Scaling',
    body:
      'A curriculum that covers your first product pick, your first winning ad, and the day you cross $30k/month — without padding.',
  },
];

export function ValueProps() {
  return (
    <section className="border-t border-white/[0.05] py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-5 px-5 md:grid-cols-3 md:gap-6 md:px-8">
        {PROPS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.55, delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="rounded-2xl border p-7 transition-colors"
            style={{
              borderColor: 'rgba(79,142,247,0.08)',
              background: '#0d1117',
            }}
          >
            <div
              className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                background: 'rgba(79,142,247,0.1)',
                border: '1px solid rgba(79,142,247,0.25)',
              }}
            >
              <p.icon size={20} className="text-[#4f8ef7]" strokeWidth={1.75} />
            </div>
            <div
              className="mb-2 text-lg font-semibold text-[#E0E0E0]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {p.title}
            </div>
            <div className="text-sm leading-relaxed text-[#9CA3AF]">{p.body}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
