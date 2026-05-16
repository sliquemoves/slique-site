// src/pages/Programs.jsx
// Phoenix driver-recruitment landing page at /programs.
//
// Editorial / Apple-Nike-Bloomberg-quality aesthetic on top of the existing
// site's design system: pure black, Cormorant Garamond for editorial type,
// system sans for body, a single warm-terracotta accent (#C66B3D) for CTAs
// and highlights. Mobile-first (Phoenix drivers will see this on a phone
// after tapping an Instagram ad).
//
// All sections live in this one file as local components. Form submits to
// the /api/applications endpoint (Resend-backed notifications).

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Fuel, ShieldCheck, Wrench, Hammer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import FooterSection from '@/components/landing/FooterSection';

// ────────────────────────────────────────────────────────────────────────────
// Design tokens
// ────────────────────────────────────────────────────────────────────────────
const ACCENT = '#C66B3D';

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif";

// ────────────────────────────────────────────────────────────────────────────
// SEO + analytics
// ────────────────────────────────────────────────────────────────────────────
function useSeoMeta({ title, description, ogImage }) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    // Track which tags we created so we can clean them up on unmount.
    const created = [];

    const setMeta = (selector, attrs) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        for (const [k, v] of Object.entries(attrs)) {
          if (k !== 'content') el.setAttribute(k, v);
        }
        document.head.appendChild(el);
        created.push(el);
      }
      el.setAttribute('content', attrs.content);
    };

    setMeta('meta[name="description"]', { name: 'description', content: description });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    setMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'Slique Moves' });
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    if (ogImage) {
      setMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage });
      setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImage });
    }

    return () => {
      document.title = previousTitle;
      for (const el of created) el.parentNode?.removeChild(el);
    };
  }, [title, description, ogImage]);
}

// Fire a Lead event to whatever analytics is loaded on the page.
// The user wires fbq/gtag via index.html or a head-injection step;
// this just calls them safely if present.
function fireLeadEvent({ reference } = {}) {
  if (typeof window === 'undefined') return;
  try {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', { content_name: 'phoenix_driver_application', reference });
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'generate_lead', {
        event_category: 'application',
        event_label: 'phoenix_driver',
        reference,
      });
    }
  } catch (err) {
    // Never let analytics break the page.
    console.warn('[programs] analytics error', err);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Hero
// ────────────────────────────────────────────────────────────────────────────
function Hero() {
  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="relative overflow-hidden flex items-center"
      style={{
        minHeight: '62svh',
        // Warm desert gradient — terracotta haze top-left fading into deep
        // near-black navy bottom-right. Replace with a Prius hero shot when
        // the photography arrives by adding a backgroundImage layer above.
        background:
          'radial-gradient(120% 90% at 8% 10%, rgba(198,107,61,0.30) 0%, rgba(198,107,61,0.10) 25%, rgba(0,0,0,0) 55%), linear-gradient(135deg, #1a0e08 0%, #0a0a14 55%, #050510 100%)',
      }}
    >
      {/* TODO: replace with hero image — full-bleed 21:9 (or background-attachment fixed Prius shot)
          when the photography is available. The radial-gradient above acts as a placeholder
          backdrop tuned to the page's amber accent. */}

      {/* Subtle film-grain dot pattern at very low opacity */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='2' cy='2' r='0.7'/%3E%3Ccircle cx='22' cy='12' r='0.6'/%3E%3Ccircle cx='8' cy='28' r='0.55'/%3E%3Ccircle cx='34' cy='32' r='0.7'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-16 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="inline-flex items-center gap-3 mb-5 sm:mb-7"
            style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.4em' }}
          >
            <span
              className="inline-block w-6 h-px"
              style={{ background: ACCENT }}
              aria-hidden="true"
            />
            <span style={{ color: ACCENT, textTransform: 'uppercase', fontWeight: 600 }}>
              Phoenix · Now Hiring
            </span>
          </div>

          <h1
            className="text-white"
            style={{
              fontFamily: SERIF,
              fontWeight: 300,
              lineHeight: 0.98,
              letterSpacing: '-0.01em',
              fontSize: 'clamp(48px, 9vw, 116px)',
              maxWidth: '14ch',
            }}
          >
            Just drive.{' '}
            <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.78)' }}>
              We handle the rest.
            </span>
          </h1>

          <p
            className="mt-5 sm:mt-7 text-white/72"
            style={{
              fontFamily: SANS,
              fontSize: 'clamp(16px, 1.6vw, 20px)',
              lineHeight: 1.55,
              maxWidth: '52ch',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.72)',
            }}
          >
            Phoenix drivers are earning $1,800 a week behind the wheel of our
            Priuses. No gas. No insurance. No repairs. 100% of your earnings,
            kept.
          </p>

          <div className="mt-5 sm:mt-7 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-7">
            <a
              href="#apply"
              onClick={scrollTo('apply')}
              className="inline-flex items-center justify-center gap-3 transition-transform"
              style={{
                background: ACCENT,
                color: '#0a0a0a',
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '18px 30px',
                textDecoration: 'none',
                borderRadius: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Apply in 2 minutes
              <ArrowRight size={16} aria-hidden="true" />
            </a>

            <a
              href="#how-it-works"
              onClick={scrollTo('how-it-works')}
              className="inline-flex items-center gap-2 group self-center sm:self-auto"
              style={{
                fontFamily: SANS,
                color: 'rgba(255,255,255,0.7)',
                fontSize: 14,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.4)',
                  paddingBottom: 2,
                }}
              >
                See how it works
              </span>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Bottom hairline accent so the hero ends with a deliberate edge */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)' }}
      />
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Numbers strip
// ────────────────────────────────────────────────────────────────────────────
function NumbersStrip() {
  const stats = [
    { value: '$1,800', label: 'Average weekly driver earnings in Phoenix' },
    { value: '$0',     label: 'What you pay for gas, insurance, or repairs' },
  ];

  return (
    <section
      className="bg-black px-6 sm:px-8 lg:px-16 py-8 sm:py-10 lg:py-14"
      aria-label="Driver economics at a glance"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-x-6 sm:gap-x-12">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.value}
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="text-white"
              style={{
                fontFamily: SERIF,
                // Side-by-side on mobile means each column is narrow,
                // so the lower bound is dialed in to fit "$1,800" on a
                // 320 px phone without wrapping.
                fontSize: 'clamp(42px, 11vw, 96px)',
                fontWeight: 300,
                lineHeight: 0.95,
                letterSpacing: '-0.02em',
              }}
            >
              {stat.value}
            </div>
            <div
              className="mt-4 sm:mt-5 mx-auto md:mx-0 max-w-[28ch]"
              style={{
                fontFamily: SANS,
                fontSize: 13,
                letterSpacing: '0.04em',
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Placeholder image slot (between sections)
// ────────────────────────────────────────────────────────────────────────────
function HeroImagePlaceholder() {
  return (
    <section className="bg-black px-6 sm:px-8 lg:px-16 pb-20 sm:pb-28">
      <div className="max-w-7xl mx-auto">
        {/* TODO: replace with hero image — 21:9 Prius shot (parked, golden hour, Phoenix backdrop).
            Recommended dimensions: 2400 x 1029, JPEG/WebP, ≤ 600 KB. */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: '21 / 9',
            background:
              'linear-gradient(135deg, rgba(198,107,61,0.20) 0%, rgba(10,10,20,0.95) 60%), repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 14px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: '0.55em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            Hero photograph · Replace with Prius shot
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// What you don't pay for
// ────────────────────────────────────────────────────────────────────────────
function WhatYouDontPayFor() {
  const items = [
    { icon: Fuel,       title: 'Gas',         body: 'We fuel the fleet.' },
    { icon: ShieldCheck, title: 'Insurance',  body: 'Commercial coverage included.' },
    { icon: Wrench,     title: 'Maintenance', body: 'Oil, tires, brakes, all on us.' },
    { icon: Hammer,     title: 'Repairs',     body: 'Something breaks, we fix it. You keep driving.' },
  ];

  return (
    <section className="bg-black px-6 sm:px-8 lg:px-16 py-8 sm:py-10 lg:py-14">
      <div className="max-w-6xl mx-auto">
        <div className="text-center">
          <SectionEyebrow text="Operating costs" />
          <SectionTitle centered>
            What you <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>don&apos;t</span> pay for
          </SectionTitle>
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-px bg-white/10">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                className="bg-black p-5 sm:p-9 text-center"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: i * 0.06 }}
              >
                <Icon
                  size={26}
                  strokeWidth={1.4}
                  style={{ color: ACCENT, marginBottom: 14, marginLeft: 'auto', marginRight: 'auto', display: 'block' }}
                  aria-hidden="true"
                />
                <h3
                  className="text-white"
                  style={{
                    fontFamily: SERIF,
                    fontSize: 'clamp(22px, 3.5vw, 36px)',
                    fontWeight: 300,
                    letterSpacing: '0.01em',
                    textDecoration: 'line-through',
                    textDecorationThickness: '1px',
                    textDecorationColor: 'rgba(255,255,255,0.35)',
                    margin: 0,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  className="mt-3 mx-auto"
                  style={{
                    fontFamily: SANS,
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: 'rgba(255,255,255,0.65)',
                    maxWidth: '32ch',
                  }}
                >
                  {item.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// How it works
// ────────────────────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Apply',
      body: 'Fill out the form below. Takes 2 minutes.',
    },
    {
      n: '02',
      title: 'Get approved',
      body: 'We verify your license and rideshare eligibility within 48 hours.',
    },
    {
      n: '03',
      title: 'Pick up your Prius',
      body: 'Meet our team in Phoenix, get your keys, start earning.',
    },
  ];

  return (
    <section
      id="how-it-works"
      className="bg-black px-6 sm:px-8 lg:px-16 py-8 sm:py-10 lg:py-14"
    >
      <div className="max-w-6xl mx-auto text-center">
        <SectionEyebrow text="The process" />
        <SectionTitle centered>
          How it <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>works</span>
        </SectionTitle>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
            >
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 60,
                  lineHeight: 1,
                  fontWeight: 300,
                  color: ACCENT,
                  letterSpacing: '-0.02em',
                }}
                aria-hidden="true"
              >
                {step.n}
              </div>
              <div
                className="mt-3 mb-4 h-px w-10 mx-auto"
                style={{ background: 'rgba(255,255,255,0.2)' }}
                aria-hidden="true"
              />
              <h3
                className="text-white"
                style={{
                  fontFamily: SERIF,
                  fontSize: 'clamp(26px, 3vw, 34px)',
                  fontWeight: 300,
                  letterSpacing: '0.01em',
                  margin: 0,
                }}
              >
                {step.title}
              </h3>
              <p
                className="mt-3 mx-auto"
                style={{
                  fontFamily: SANS,
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: 'rgba(255,255,255,0.65)',
                  maxWidth: '34ch',
                }}
              >
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Who qualifies
// ────────────────────────────────────────────────────────────────────────────
function WhoQualifies() {
  const criteria = [
    'Valid driver’s license (any U.S. state)',
    '25+ years old',
    'Clean driving record (past 3 years)',
    'Approved or approvable on Uber or Lyft',
    'Phoenix metro area resident',
    'Smartphone with data plan',
  ];

  return (
    <section className="bg-black px-6 sm:px-8 lg:px-16 py-8 sm:py-10 lg:py-14">
      <div className="max-w-6xl mx-auto">
        <SectionEyebrow text="Eligibility" />
        <SectionTitle>
          Who <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>qualifies</span>
        </SectionTitle>

        <ul className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 sm:gap-x-14">
          {criteria.map((line, i) => (
            <motion.li
              key={line}
              className="flex items-start gap-4"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
            >
              <span
                className="flex-none mt-1 flex items-center justify-center"
                style={{
                  width: 22,
                  height: 22,
                  border: `1px solid ${ACCENT}`,
                  borderRadius: 999,
                }}
                aria-hidden="true"
              >
                <Check size={12} strokeWidth={2.5} style={{ color: ACCENT }} />
              </span>
              <span
                className="text-white"
                style={{
                  fontFamily: SANS,
                  fontSize: 16,
                  lineHeight: 1.5,
                  letterSpacing: '0.01em',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                {line}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// FAQ
// ────────────────────────────────────────────────────────────────────────────
function Faq() {
  const items = [
    {
      q: 'What does it actually cost me?',
      a: 'Nothing to drive. A weekly program fee is deducted from your rideshare earnings, structured so drivers consistently net well above traditional rideshare after expenses. We’ll break down the math during onboarding.',
    },
    {
      q: 'Whose name is the insurance under?',
      a: 'Slique Moves carries commercial rideshare insurance on the vehicle. You’re covered while driving.',
    },
    {
      q: 'Can I drive for both Uber and Lyft?',
      a: 'Yes. Drive on whichever platforms you’re approved for. Stack them if you want.',
    },
    {
      q: 'What if the car breaks down?',
      a: 'Call us. We’ll arrange a replacement vehicle so your earnings don’t stop.',
    },
    {
      q: 'Is there a contract?',
      a: 'Yes, a vehicle rental and liability agreement. We’ll walk through every clause with you before you sign.',
    },
    {
      q: 'How fast can I start?',
      a: 'Most drivers are on the road within 3–5 days of applying.',
    },
  ];

  return (
    <section className="bg-black px-6 sm:px-8 lg:px-16 py-8 sm:py-10 lg:py-14">
      <div className="max-w-3xl mx-auto">
        <SectionEyebrow text="Frequently asked" />
        <SectionTitle>
          The <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>fine print</span>, plainly
        </SectionTitle>

        <Accordion type="single" collapsible className="mt-6 sm:mt-8">
          {items.map((item, i) => (
            <AccordionItem
              key={item.q}
              value={`faq-${i}`}
              className="border-b border-white/12"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <AccordionTrigger
                className="text-left text-white hover:no-underline py-4"
                style={{
                  fontFamily: SERIF,
                  fontSize: 'clamp(20px, 2.4vw, 26px)',
                  fontWeight: 300,
                  letterSpacing: '0.01em',
                }}
              >
                {item.q}
              </AccordionTrigger>
              <AccordionContent
                className="pb-5"
                style={{
                  fontFamily: SANS,
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Application form
// ────────────────────────────────────────────────────────────────────────────
function ApplicationForm() {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    currently_driving: '',
    experience: '',
    start_when: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const update = (k) => (v) =>
    setForm((f) => ({ ...f, [k]: typeof v === 'string' ? v : v?.target?.value ?? '' }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.full_name.trim() || !form.phone.trim() || !form.email.trim()) {
      setError('Name, phone, and email are required.');
      return;
    }
    if (!form.currently_driving || !form.experience || !form.start_when) {
      setError('Please answer the driving / experience / start-time questions.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Something went wrong. Please try again or call us.');
        setSubmitting(false);
        return;
      }
      fireLeadEvent({ reference: data.reference });
      setDone(true);
    } catch (err) {
      setError('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: '#fff',
    borderRadius: 0,
    height: 48,
    fontSize: 15,
    fontFamily: SANS,
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    letterSpacing: '0.32em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 10,
    fontFamily: SANS,
    fontWeight: 600,
  };

  return (
    <section
      id="apply"
      className="bg-black px-6 sm:px-8 lg:px-16 py-8 sm:py-10 lg:py-14"
      style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="max-w-3xl mx-auto">
        <p
          style={{
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: ACCENT,
            fontWeight: 600,
            marginBottom: 18,
            lineHeight: 1.7,
          }}
        >
          {/* Mobile: "Phoenix only" bracketed by orange dots on its own line,
              "Limited slots..." stacked below. */}
          <span className="sm:hidden">
            · Phoenix only ·
            <br />
            Limited slots in this rollout
          </span>
          {/* Desktop: single line with one middle separator. */}
          <span className="hidden sm:inline">
            Phoenix only · Limited slots in this rollout
          </span>
        </p>
        <SectionTitle>
          Apply to <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>drive</span>
        </SectionTitle>

        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6 sm:mt-8"
            role="status"
            aria-live="polite"
            style={{
              padding: '40px 32px',
              border: `1px solid ${ACCENT}`,
              background: 'rgba(198,107,61,0.08)',
            }}
          >
            <h3
              className="text-white"
              style={{
                fontFamily: SERIF,
                fontSize: 'clamp(28px, 3.5vw, 38px)',
                fontWeight: 300,
                margin: 0,
                letterSpacing: '0.01em',
              }}
            >
              Got it.
            </h3>
            <p
              className="mt-4"
              style={{
                fontFamily: SANS,
                fontSize: 16,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.7)',
                maxWidth: '52ch',
              }}
            >
              We&rsquo;ll call you within 48 hours to verify your license and rideshare
              eligibility. Watch for a call from a 612 number, that&rsquo;s us.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 sm:mt-8 space-y-5">
            <div>
              <label htmlFor="full_name" style={labelStyle}>Full name</label>
              <Input
                id="full_name"
                type="text"
                required
                autoComplete="name"
                value={form.full_name}
                onChange={update('full_name')}
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
              <div>
                <label htmlFor="phone" style={labelStyle}>Phone</label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={update('phone')}
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="email" style={labelStyle}>Email</label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={update('email')}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <span style={labelStyle}>Are you currently driving for Uber or Lyft?</span>
              <RadioGroup
                value={form.currently_driving}
                onValueChange={update('currently_driving')}
                className="mt-2 flex flex-col sm:flex-row gap-3 sm:gap-6"
              >
                {[
                  { v: 'yes', l: 'Yes' },
                  { v: 'no', l: 'No' },
                  { v: 'approved_inactive', l: 'Approved but not active' },
                ].map((opt) => (
                  <Label
                    key={opt.v}
                    htmlFor={`driving-${opt.v}`}
                    className="flex items-center gap-3 cursor-pointer"
                    style={{
                      fontFamily: SANS,
                      fontSize: 15,
                      color: 'rgba(255,255,255,0.85)',
                      letterSpacing: 0,
                      padding: '10px 16px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      flex: 1,
                    }}
                  >
                    <RadioGroupItem
                      id={`driving-${opt.v}`}
                      value={opt.v}
                      className="text-white border-white/40"
                    />
                    {opt.l}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
              <div>
                <label style={labelStyle}>Years driving</label>
                <Select value={form.experience} onValueChange={update('experience')}>
                  <SelectTrigger style={{ ...inputStyle, height: 48 }}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2">1–2 years</SelectItem>
                    <SelectItem value="3-5">3–5 years</SelectItem>
                    <SelectItem value="6-10">6–10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label style={labelStyle}>How soon can you start?</label>
                <Select value={form.start_when} onValueChange={update('start_when')}>
                  <SelectTrigger style={{ ...inputStyle, height: 48 }}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this_week">This week</SelectItem>
                    <SelectItem value="two_weeks">Within 2 weeks</SelectItem>
                    <SelectItem value="one_month">Within a month</SelectItem>
                    <SelectItem value="exploring">Just exploring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label htmlFor="notes" style={labelStyle}>Anything else we should know? (optional)</label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={update('notes')}
                rows={4}
                style={{
                  ...inputStyle,
                  height: 'auto',
                  minHeight: 120,
                  padding: 14,
                  lineHeight: 1.5,
                  resize: 'vertical',
                }}
              />
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  fontFamily: SANS,
                  fontSize: 14,
                  color: '#ffb09a',
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed transition-transform"
              style={{
                background: ACCENT,
                color: '#0a0a0a',
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                padding: '20px 30px',
                border: 'none',
                cursor: submitting ? 'wait' : 'pointer',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit Application'}
              {!submitting && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section helpers (eyebrow + title — keep type system consistent)
// ────────────────────────────────────────────────────────────────────────────
function SectionEyebrow({ text }) {
  return (
    <p
      style={{
        fontFamily: SANS,
        fontSize: 11,
        letterSpacing: '0.4em',
        textTransform: 'uppercase',
        color: ACCENT,
        fontWeight: 600,
        margin: 0,
      }}
    >
      {text}
    </p>
  );
}

function SectionTitle({ children, centered = false }) {
  return (
    <h2
      className="mt-3 text-white"
      style={{
        fontFamily: SERIF,
        fontSize: 'clamp(36px, 6vw, 64px)',
        fontWeight: 300,
        lineHeight: 1.04,
        letterSpacing: '-0.005em',
        marginTop: 12,
        marginBottom: 0,
        marginLeft: centered ? 'auto' : 0,
        marginRight: centered ? 'auto' : 0,
        maxWidth: '20ch',
      }}
    >
      {children}
    </h2>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Disclaimer line — slotted right above the reused FooterSection
// ────────────────────────────────────────────────────────────────────────────
function ProgramsDisclaimer() {
  return (
    <div
      className="bg-black px-6 sm:px-8 lg:px-16 pb-10"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-6xl mx-auto pt-8">
        <p
          style={{
            fontFamily: SANS,
            fontSize: 12,
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.02em',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Slique Moves is a vehicle rental and partnership program. Drivers are
          independent contractors on Uber/Lyft.
        </p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Page root
// ────────────────────────────────────────────────────────────────────────────
export default function Programs() {
  useSeoMeta({
    title: 'Drive in Phoenix — Slique Moves',
    description:
      'Phoenix drivers earning $1,800/week. We supply the Prius and cover gas, insurance, and repairs. You keep every dollar you earn.',
    ogImage: 'https://sliquemoves.com/slique.png',
  });

  return (
    <main className="bg-black text-white" style={{ fontFamily: SANS }}>
      {/* Brand mark — same wordmark the footer uses, slotted at the very top
          of the page so identity is established before the headline. */}
      <header className="bg-black text-center pt-6 pb-3 px-6">
        <a
          href="/"
          aria-label="Slique Moves home"
          style={{
            display: 'inline-block',
            fontFamily: SERIF,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            fontSize: 24,
            textDecoration: 'none',
          }}
        >
          SLIQUE
        </a>
      </header>

      <Hero />
      <NumbersStrip />
      {/* HeroImagePlaceholder intentionally not rendered. Re-enable once a
          real Prius hero shot exists; the component still lives above. */}
      <WhatYouDontPayFor />
      <HowItWorks />
      <WhoQualifies />
      <ApplicationForm />
      <Faq />
      <ProgramsDisclaimer />
      <FooterSection
        areaDescription="Premium chauffeur services in the United States. Where every journey becomes an experience."
        locationLabel="Phoenix, AZ"
      />
    </main>
  );
}
