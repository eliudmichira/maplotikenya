import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Video, 
  Building2, 
  Search, 
  TrendingUp, 
  Award, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Phone, 
  Mail, 
  MessageCircle, 
  FileText, 
  Compass, 
  Clock, 
  Sparkles,
  ChevronDown,
  Layers,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const services = [
  {
    id: 'land-verify',
    category: 'buyers',
    badge: 'Due Diligence',
    title: 'Land & Plot Due Diligence (Maploti Verify™)',
    icon: Compass,
    tagline: 'Never buy land blindly. We verify before you invest.',
    description: 'Comprehensive legal and physical validation of plots and land parcels across all 47 counties before you commit your hard-earned capital.',
    deliverables: [
      'Official Ardhisasa & Ardhi House Registry Search',
      'On-site Beacon Inspection by Registered Surveyors',
      'Green Card & Encumbrance / Dispute Verification',
      'Geo-referenced Aerial Drone Footage & Boundary Map',
      'Legal Due Diligence Report signed by Conveyance Advocates'
    ],
    turnaround: '3 to 5 Business Days',
    idealFor: 'Plot buyers, diaspora investors, commercial developers'
  },
  {
    id: 'media-production',
    category: 'creators',
    badge: 'Media & Marketing',
    title: 'Cinematic TikTok Tours & Real Estate Media',
    icon: Video,
    tagline: 'Properties shown properly sell and rent 4x faster.',
    description: 'High-production 4K vertical tours, drone videography, and architectural photography tailored for TikTok, Instagram Reels, and YouTube Shorts.',
    deliverables: [
      '4K 60fps Vertical Walkthrough with professional audio',
      'High-resolution HDR interior & exterior photography',
      'FAA/KCAA-compliant 4K Drone Aerial Topography',
      'Distribution across Maploti channels (500K+ reach)',
      'Direct WhatsApp inquiry link overlay on viral videos'
    ],
    turnaround: '24 to 48 Hours',
    idealFor: 'Landlords, property managers, real estate agencies'
  },
  {
    id: 'property-management',
    category: 'landlords',
    badge: 'RentaKenya Suite',
    title: 'Automated Property Management & Rent Collection',
    icon: Building2,
    tagline: 'Zero rent collection headaches. Direct M-Pesa STK push.',
    description: 'Transform rental properties with our complete cloud management suite. Automate rent tracking, tenant screening, vacancy filling, and maintenance.',
    deliverables: [
      'Automated M-Pesa STK Push rent reminders & collection',
      'Instant SMS & email receipts with automated ledgers',
      'Live Vacancy Tracker syndicated to verified home seekers',
      'Digital tenant KYC and legally binding lease agreements',
      'Maintenance ticketing and contractor dispatch portal'
    ],
    turnaround: 'Instant Setup',
    idealFor: 'Apartment building owners, estate managers, individual landlords'
  },
  {
    id: 'sales-leasing',
    category: 'buyers',
    badge: 'Brokerage',
    title: 'Property Sales & Luxury Leasing Advisory',
    icon: Search,
    tagline: 'Curated homes, apartments, and commercial sanctuaries.',
    description: 'Direct access to vetted properties across Nairobi (Kilimani, Westlands, Karen, Kileleshwa) and key growth corridors (Ruiru, Kiambu, Mombasa).',
    deliverables: [
      'Curated verified listings with guaranteed real availability',
      'Private physical & live-streamed guided viewing appointments',
      'Buyer price negotiation based on real transactional benchmarks',
      'Assistance with sale agreements, stamp duty, and title transfer'
    ],
    turnaround: 'Active Pipeline',
    idealFor: 'Home buyers, tenants, corporate relocations'
  },
  {
    id: 'valuation-advisory',
    category: 'landlords',
    badge: 'Valuation & Research',
    title: 'Property Valuation & Investment Feasibility',
    icon: TrendingUp,
    tagline: 'Data-driven pricing based on real local market movements.',
    description: 'Certified valuation reports, rental yield analysis, and developmental feasibility studies recognized by financial institutions and investors.',
    deliverables: [
      'Comparative Market Analysis (CMA) by Licensed Valuers',
      'Rental yield calculation & capital appreciation forecast',
      'Highest and best use (HBU) developmental study',
      'Zoning bylaws, plot ratio, and county planning guidance'
    ],
    turnaround: '3 to 7 Business Days',
    idealFor: 'Property owners, mortgage seekers, institutional funds'
  },
  {
    id: 'agent-verification',
    category: 'agents',
    badge: 'Partner Network',
    title: 'Verified Agent Certification & Lead Engine',
    icon: ShieldCheck,
    tagline: 'Stand out from unverified brokers with the Maploti Blue Badge.',
    description: 'Join Kenya’s premier network of credible property professionals. Gain access to verified buyers, professional CRM tools, and featured media spots.',
    deliverables: [
      'Official Maploti Verified Agent digital badge and profile',
      'Priority ranking on home page and Maploti property search',
      'Integrated lead manager with WhatsApp and call tracking',
      'Discounts on TikTok tour production and marketing packages'
    ],
    turnaround: '24 Hours Approval',
    idealFor: 'Registered estate agents, realtors, property firms'
  }
];

const faqs = [
  {
    q: 'How does Maploti verify land and title deeds?',
    a: 'Our due diligence team performs an official registry search via Ardhisasa and the Ministry of Lands, coordinates an on-site beacon inspection with licensed surveyors to ensure coordinates match the survey map, and investigates the registry green card to detect any encumbrances, court disputes, or duplicate titles.'
  },
  {
    q: 'Can you shoot a TikTok property tour outside Nairobi?',
    a: 'Yes. While our primary media team is based in Nairobi covering suburbs like Westlands, Kilimani, Karen, Kileleshwa, and Kiambu Road, we regularly travel across all 47 counties including Mombasa, Nakuru, Eldoret, Kisumu, and Naivasha.'
  },
  {
    q: 'How does rent collection with RentaKenya work?',
    a: 'Tenants receive automated M-Pesa STK push prompts or payment instructions on the rent due date. Once approved on their phone, the payment is instantly reconciled against the unit ledger, an SMS receipt is dispatched, and funds settle directly into the landlord’s bank or till account.'
  },
  {
    q: 'Are your valuation reports accepted by Kenyan banks?',
    a: 'Yes. All formal property valuations are conducted and stamped by certified, registered members of the Institution of Surveyors of Kenya (ISK) and Valuers Registration Board (VRB).'
  }
];

export default function ServicesPage() {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedService, setSelectedService] = useState('land-verify');
  const [openFaq, setOpenFaq] = useState(null);

  const [formData, setFormData] = useState({
    name: currentUser?.displayName || '',
    phone: '',
    email: currentUser?.email || '',
    serviceId: 'land-verify',
    location: '',
    notes: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredServices = activeCategory === 'all' 
    ? services 
    : services.filter(s => s.category === activeCategory);

  const handleSubmitInquiry = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  const handleWhatsAppDirect = () => {
    const sObj = services.find(s => s.id === formData.serviceId) || services[0];
    const text = `Hello Maploti! I would like to inquire about your service: *${sObj.title}*. My name is ${formData.name || 'a client'} (Phone: ${formData.phone || 'N/A'}). Details/Location: ${formData.location || 'N/A'}.`;
    window.open(`https://wa.me/254700000000?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className={`min-h-screen pt-24 pb-24 transition-colors duration-300 ${
      isDark ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'
    }`}>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 lg:px-16 pt-12 pb-16 max-w-7xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 bg-black/5 dark:bg-white/10 border border-zinc-200 dark:border-white/15 backdrop-blur-md shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
          <span>Premier Real Estate & Land Services</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight"
        >
          End-to-End Property Solutions Built for Kenya
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          From certified title deed search and on-site beacon surveying to viral TikTok property walkthroughs and automated M-Pesa rent collection. Everything you need under one roof.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <a 
            href="#booking-form"
            className="px-8 py-4 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            Request a Service
          </a>
          <a 
            href="#all-services"
            className="px-8 py-4 rounded-full bg-zinc-200/80 dark:bg-white/10 text-zinc-900 dark:text-white font-semibold text-sm hover:bg-zinc-300/80 dark:hover:bg-white/20 transition-all border border-zinc-300 dark:border-white/20 backdrop-blur-md"
          >
            Explore All Services
          </a>
        </motion.div>
      </section>

      {/* Category Filter Pills */}
      <section id="all-services" className="px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto mb-12">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {[
            { id: 'all', label: 'All Services' },
            { id: 'buyers', label: 'For Buyers & Land Seekers' },
            { id: 'creators', label: 'Media & TikTok Tours' },
            { id: 'landlords', label: 'Landlords & Property Managers' },
            { id: 'agents', label: 'Agents & Developers' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeCategory === tab.id
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                  : 'bg-zinc-200/60 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-300 dark:border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Services Grid */}
      <section className="px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service, idx) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className={`p-7 rounded-3xl border flex flex-col justify-between transition-all duration-300 hover:shadow-2xl ${
                  isDark
                    ? 'bg-zinc-950/70 border-white/10 hover:border-white/30 backdrop-blur-xl'
                    : 'bg-white border-zinc-200 hover:border-zinc-400 shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3.5 rounded-2xl ${
                      isDark ? 'bg-white/10 text-white' : 'bg-black text-white'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/15">
                      {service.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-2 leading-snug">
                    {service.title}
                  </h3>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-4">
                    {service.tagline}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-6 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="space-y-2.5 mb-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Deliverables Included:
                    </p>
                    {service.deliverables.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100 dark:border-white/10 mt-4">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {service.turnaround}
                    </span>
                    <span className="truncate max-w-[140px]" title={service.idealFor}>
                      {service.idealFor}
                    </span>
                  </div>

                  <a
                    href="#booking-form"
                    onClick={() => {
                      setSelectedService(service.id);
                      setFormData(prev => ({ ...prev, serviceId: service.id }));
                    }}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                      isDark
                        ? 'bg-white text-black hover:bg-zinc-200'
                        : 'bg-black text-white hover:bg-zinc-800'
                    }`}
                  >
                    <span>Book This Service</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto mb-24">
        <div className={`p-8 sm:p-12 rounded-3xl border ${
          isDark 
            ? 'bg-gradient-to-b from-zinc-900/60 to-black/80 border-white/10' 
            : 'bg-gradient-to-b from-zinc-100 to-white border-zinc-200'
        }`}>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
              Why Real Estate Stakeholders Trust Maploti
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              We combine Kenya Ministry of Lands compliance, licensed surveyors, and high-tech software to remove uncertainty.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Official Registry Grounded',
                desc: 'All land checks are vetted directly against Ardhisasa, physical green cards, and registry folios.',
                icon: ShieldCheck
              },
              {
                title: 'Transparent Pricing',
                desc: 'No hidden broker fees or surprise charges. Upfront agreements and clear deliverables.',
                icon: FileText
              },
              {
                title: 'Viral Social Distribution',
                desc: 'Over 500,000 monthly viewers across TikTok, Instagram, and web for your listings.',
                icon: Video
              },
              {
                title: 'Licensed Professionals',
                desc: 'Reports signed by registered ISK valuers, licensed land surveyors, and conveyance advocates.',
                icon: Award
              }
            ].map((pillar, idx) => {
              const PIcon = pillar.icon;
              return (
                <div key={idx} className="p-5 rounded-2xl bg-white/5 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10">
                  <PIcon className="w-6 h-6 mb-3 text-zinc-900 dark:text-white" />
                  <h4 className="text-base font-bold mb-2">{pillar.title}</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Booking & Inquiry Form */}
      <section id="booking-form" className="px-4 sm:px-8 lg:px-16 max-w-4xl mx-auto mb-24">
        <div className={`p-8 sm:p-12 rounded-3xl border shadow-2xl ${
          isDark 
            ? 'bg-zinc-950 border-white/15' 
            : 'bg-white border-zinc-200'
        }`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 bg-zinc-100 dark:bg-white/10 text-zinc-800 dark:text-zinc-200">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Direct Booking & Quote</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Request Your Service Consultation
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Fill out the details below. Our field and media coordinators respond within 2 hours.
            </p>
          </div>

          {submitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Inquiry Received!</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto mb-6">
                Thank you! Our dedicated service coordinator will contact you via WhatsApp and phone shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold text-xs"
              >
                Submit Another Request
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmitInquiry} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-zinc-700 dark:text-zinc-300">
                  Select Required Service
                </label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData(p => ({ ...p, serviceId: e.target.value }))}
                  className="w-full px-4 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-white/15 text-sm font-medium focus:outline-none focus:border-zinc-500 dark:focus:border-white"
                  required
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-zinc-700 dark:text-zinc-300">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. John Kamau"
                    className="w-full px-4 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-white/15 text-sm focus:outline-none focus:border-zinc-500 dark:focus:border-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-zinc-700 dark:text-zinc-300">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+254 700 000 000"
                    className="w-full px-4 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-white/15 text-sm focus:outline-none focus:border-zinc-500 dark:focus:border-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-zinc-700 dark:text-zinc-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-white/15 text-sm focus:outline-none focus:border-zinc-500 dark:focus:border-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-zinc-700 dark:text-zinc-300">
                    Property Location / Suburb
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Kilimani, Karen, Ruiru, Diani"
                    className="w-full px-4 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-white/15 text-sm focus:outline-none focus:border-zinc-500 dark:focus:border-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-zinc-700 dark:text-zinc-300">
                  Notes / Specific Requirements
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Provide any details about the plot, deed number, apartment units, or video shoot schedule..."
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-white/15 text-sm focus:outline-none focus:border-zinc-500 dark:focus:border-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 px-6 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? 'Submitting Request...' : 'Submit Service Request'}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppDirect}
                  className="py-4 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="px-4 sm:px-8 lg:px-16 max-w-4xl mx-auto mb-20">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className={`rounded-2xl border transition-all ${
                isDark 
                  ? 'bg-zinc-950/60 border-white/10' 
                  : 'bg-white border-zinc-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-sm sm:text-base"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 shrink-0 ml-4 ${
                  openFaq === idx ? 'rotate-180' : ''
                }`} />
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-white/5 leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto text-center">
        <div className={`p-10 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 ${
          isDark ? 'bg-zinc-900/50 border-white/10' : 'bg-zinc-100 border-zinc-300'
        }`}>
          <div className="text-left">
            <h3 className="text-2xl font-bold mb-1">Looking to buy, rent, or explore listings?</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Discover verified homes, plots, and apartments across all 47 counties.</p>
          </div>
          <Link
            to="/properties"
            className="shrink-0 px-8 py-3.5 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold text-sm hover:scale-105 transition-all shadow-md"
          >
            Browse Properties
          </Link>
        </div>
      </section>

    </div>
  );
}
