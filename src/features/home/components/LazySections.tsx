import React from "react";
import { motion, useInView } from "framer-motion";
import { Star, ArrowRight, BadgeCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Review, formatReviewDate, shuffle } from "@/lib/reviews";

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "20px" });
  const skipAnim =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <motion.div
      ref={ref}
      initial={skipAnim ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: skipAnim ? 0 : delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PromoBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#040d1a]">
          <div className="absolute -right-16 -bottom-16 h-80 w-80 rounded-full bg-[#1E5F8B]/30 blur-3xl" />
          <div className="absolute right-48 top-0 h-56 w-56 rounded-full bg-[#0d5ea6]/20 blur-3xl" />
          <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-[#0B3C5D]/40 blur-3xl" />

          <div className="relative grid md:grid-cols-2 gap-10 items-center p-10 sm:p-16">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#5b9bd5]/80 font-bold">
                This Week at AQ Beds
              </span>
              <h2 className="font-display font-black text-4xl sm:text-5xl mt-4 leading-tight text-white">
                Up to 32% OFF
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b9bd5] to-white">
                  Bestselling Beds.
                </span>
              </h2>
              <p className="mt-5 text-white/60 text-base max-w-md leading-relaxed">
                Build your bed in 4 steps — fabric, colour, size, storage. Free UK delivery, a free
                mattress with every bed, Cash on Delivery, and Next Day Free Replacement.
              </p>
              <Link
                to="/shop"
                className="inline-flex mt-8 items-center gap-2 h-12 px-8 rounded-2xl bg-white text-[#0B3C5D] font-bold text-sm hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                Build Your Bed <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="hidden md:grid grid-cols-2 gap-4">
              {[
                { val: "32%", label: "Max Discount" },
                { val: "Free", label: "UK Delivery" },
                { val: "COD", label: "Cash on Delivery" },
                { val: "Next Day", label: "Free Replacement" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/8 text-center hover:bg-white/8 transition-colors"
                >
                  <div className="font-display font-black text-3xl text-white">{s.val}</div>
                  <div className="text-xs text-white/50 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function Testimonials({ reviews }: { reviews: Review[] }) {
  const avg = reviews.length
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;
  const avgLabel = (Math.round(avg * 100) / 100).toFixed(2);
  const stars = Math.round(avg);
  const [order, setOrder] = useState<number[] | null>(null);
  const [start, setStart] = useState(0);

  useEffect(() => {
    setOrder(shuffle(reviews.map((_, i) => i)));
    const id = window.setInterval(() => setStart((s) => s + 1), 5000);
    return () => window.clearInterval(id);
  }, [reviews]);

  const idx = order ?? reviews.map((_, i) => i);
  const visible = Array.from(
    { length: Math.min(3, reviews.length) },
    (_, k) => reviews[idx[(start + k) % idx.length]],
  );
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24">
      <Reveal className="text-center mb-14">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand/60 mb-2">
          Testimonials
        </p>
        <h2 className="font-display font-black text-3xl sm:text-5xl">What Our Sleepers Say</h2>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
          Join 10,000+ happy customers who transformed their bedrooms with AQ Beds.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.06] px-4 py-2">
          <span className="text-brand text-sm tracking-tight" aria-hidden="true">
            {"★".repeat(stars)}
            {"☆".repeat(5 - stars)}
          </span>
          <span className="text-sm font-semibold text-foreground/80">
            {avgLabel}/5 from {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </span>
          <span className="text-xs text-muted-foreground">from customers on this site</span>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          {reviews.length} reviews across AQ Beds
        </p>
      </Reveal>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visible.map((r) => (
          <Reveal key={`${r.author}-${r.date}`} delay={0.1}>
            <div className="relative h-full bg-card border border-border rounded-3xl p-8 hover:border-brand/30 hover:shadow-luxury transition-all duration-300 group overflow-hidden">
              <div className="absolute top-6 right-6 text-7xl text-brand/4 font-serif font-black leading-none select-none">
                "
              </div>
              <div className="flex gap-1 mb-5">
                {[...Array(r.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="font-semibold text-sm mb-2 relative z-10">{r.title}</p>
              <p className="text-foreground/85 leading-relaxed text-sm mb-7 italic relative z-10 line-clamp-5">
                "{r.body}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-blue-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {r.author.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-brand truncate">{r.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.country} · {formatReviewDate(r.date)}
                  </p>
                </div>
              </div>
              {r.verified && (
                <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>
          </Reveal>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link
          to="/reviews"
          className="inline-flex h-11 items-center rounded-2xl bg-brand text-brand-foreground px-6 text-sm font-black hover:opacity-90 transition-opacity"
        >
          Read all {reviews.length} reviews
        </Link>
      </div>
    </section>
  );
}
