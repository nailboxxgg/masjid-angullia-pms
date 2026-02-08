"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowRight, MapPin, ShieldCheck, Heart, Calendar, Clock, BookOpen, Lock, Bell, Smartphone, Eye, EyeOff, ThumbsUp, MessageCircle, Share2, MoreHorizontal, ZoomIn } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getAnnouncements } from "@/lib/announcements";
import { Announcement } from "@/lib/types";
import PrayerTimesWidget from "@/components/PrayerTimesWidget";
import { auth } from "@/lib/firebase";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import Footer from "@/components/layout/Footer";
import { getEvents } from "@/lib/events";
import { Event, Donation } from "@/lib/types";
import { getDonations } from "@/lib/donations";
import EventRegistrationModal from "@/components/events/EventRegistrationModal";
import SubscriptionModal from "@/components/ui/SubscriptionModal";
import { cn, formatTimeAgo } from "@/lib/utils";
import { motion } from "framer-motion";
import SocialPost from "@/components/feed/SocialPost";
import ImageModal from "@/components/ui/ImageModal";

const Modal = dynamic(() => import("@/components/ui/modal"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [selectedFullImage, setSelectedFullImage] = useState<{ src: string, alt: string } | null>(null);

  useEffect(() => {
    const fetchUpdates = async () => {
      const [announcementData, eventData, donationData] = await Promise.all([
        getAnnouncements(3),
        getEvents(3),
        getDonations(5)
      ]);
      setAnnouncements(announcementData);
      setEvents(eventData);
      setRecentDonations(donationData);
    };
    fetchUpdates();
  }, []);


  // Filter out placeholder/test content
  const filteredAnnouncements = announcements.filter(a =>
    !a.title.toLowerCase().includes('test') &&
    !a.content.toLowerCase().includes('test')
  );


  const handleRegister = (event: Event) => {
    setSelectedEvent(event);
    setIsRegistrationOpen(true);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch (err: unknown) {
      console.error(err);
      setLoginError("Invalid admin credentials.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col animate-fade-in">
      {/* ... Hero Section remains ... */}
      <section className="relative w-full h-[800px] flex items-center justify-center text-center text-white">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="absolute inset-0">
          <Image
            src="/images/mosque.png"
            alt="Masjid Angullia"
            fill
            sizes="125vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="relative z-20 max-w-4xl px-4 flex flex-col items-center gap-6">
          <AnimationWrapper animation="reveal" duration={1} withScroll={false}>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight font-heading drop-shadow-lg">
              Masjid Angullia
            </h1>
          </AnimationWrapper>
          <AnimationWrapper animation="reveal" delay={0.2} duration={1} withScroll={false}>
            <p className="text-xl md:text-2xl font-light text-secondary-100 drop-shadow-md max-w-2xl">
              A beacon of faith and community in the heart of Alaminos City.
            </p>
          </AnimationWrapper>

          {/* Prayer Times Widget */}
          <AnimationWrapper animation="reveal" delay={0.4} duration={1} withScroll={false} className="mt-8 w-full max-w-3xl">
            <PrayerTimesWidget />
          </AnimationWrapper>
        </div>
      </section>

      {/* Community Hub & Donations Section */}
      <section className="py-10 md:py-16 bg-secondary-50 dark:bg-secondary-950 relative overflow-hidden transition-colors duration-300">
        <AnimationWrapper withScroll animation="reveal" duration={0.8} className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
            <div>
              <h2 className="text-3xl font-bold text-secondary-900 dark:text-secondary-50 font-heading">Community Hub</h2>
              <p className="text-secondary-600 dark:text-secondary-400 mt-1">Updates, events, and contributions from our jama&apos;ah.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsSubscriptionOpen(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300 font-medium rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
              >
                <Bell className="w-4 h-4" /> Get SMS Alerts
              </button>
              <Link href="/updates" className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors px-4 py-2">
                View All Updates <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Announcements & Events (Span 2) */}
            <div className="lg:col-span-2 space-y-8">

              {filteredAnnouncements.length > 0 ? (
                <div className="space-y-6">
                  {filteredAnnouncements.map((post) => (
                    <SocialPost key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-secondary-200">
                  <p className="text-secondary-500">No updates at the moment.</p>
                </div>
              )}
            </div>

            {/* Right Column: Recent Donations & Quick Stats (Span 1) */}
            <div className="space-y-8">
              {/* Donations Card */}
              <div className={cn(
                "bg-gradient-to-br from-primary-900 to-secondary-900 dark:from-primary-950 dark:to-secondary-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden transition-all duration-500",
                recentDonations.length === 0 ? "min-h-[400px]" : "min-h-[240px]"
              )}>
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold font-heading mb-6 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-pink-500 fill-pink-500 animate-pulse" />
                    Recent Giving
                  </h3>

                  <div className="relative">
                    {recentDonations.length === 0 ? (
                      <div className="text-center py-8 text-secondary-300 italic text-sm">
                        Join our community of donors to support Masjid Angullia.
                      </div>
                    ) : (
                      <motion.div
                        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x touch-pan-x cursor-grab active:cursor-grabbing"
                        drag="x"
                        dragConstraints={{ right: 0, left: -((recentDonations.length - 1) * 200) }} // Rough estimate for constraints
                      >
                        {recentDonations.map((donation, idx) => (
                          <div
                            key={idx}
                            className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col gap-2 border border-white/5 hover:bg-white/20 transition-colors group min-w-[180px] snap-center shrink-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-300 font-bold text-xs uppercase shrink-0">
                                {(donation.isAnonymous ? "A" : donation.donorName[0])}
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-medium text-sm text-secondary-100 truncate">
                                  {donation.isAnonymous ? "Anonymous" : donation.donorName}
                                </p>
                                <p className="text-[10px] text-secondary-400 truncate">{donation.type}</p>
                              </div>
                            </div>
                            <div className="flex justify-between items-end mt-1">
                              <span className="font-bold text-secondary-100 text-sm">₱{donation.amount.toLocaleString()}</span>
                              <span className="text-[10px] text-secondary-400 group-hover:text-secondary-300 transition-colors">{formatTimeAgo(donation.date)}</span>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {recentDonations.length === 0 && (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center animate-fade-in">
                      <p className="text-secondary-300 text-sm mb-3">Support our masjid & community</p>
                      <Link href="/donations" className="block w-full py-3 bg-white text-primary-900 font-bold rounded-xl hover:bg-secondary-100 transition-colors shadow-lg">
                        Donate Now
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Events List */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-secondary-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-heading text-secondary-900">Upcoming Events</h3>
                  <Calendar className="w-5 h-5 text-primary-600" />
                </div>

                <div className="space-y-4">
                  {events.length > 0 ? (
                    events.map(event => (
                      <div key={event.id} className="group relative pl-4 border-l-2 border-secondary-200 hover:border-primary-500 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-secondary-900 line-clamp-1">{event.title}</h4>
                            <p className="text-xs text-secondary-500 mb-1">{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {event.time}</p>
                          </div>
                          {event.registrationOpen && (
                            <button
                              onClick={() => handleRegister(event)}
                              className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded hover:bg-primary-100 transition-colors"
                            >
                              Register
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-secondary-500 italic">No upcoming events.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AnimationWrapper>
      </section>

      {/* SMS Subscription Section */}
      <section className="py-12 bg-primary-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left max-w-2xl">
            <h2 className="text-3xl font-bold font-heading mb-3">Stay Connected with Masjid Update</h2>
            <p className="text-primary-100 text-lg">
              Get instant SMS alerts for prayer times, urgent announcements, and community events directly to your phone.
            </p>
          </div>
          <button
            onClick={() => setIsSubscriptionOpen(true)}
            className="bg-white text-primary-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-primary-50 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Smartphone className="w-6 h-6" />
            Subscribe for Free
          </button>
        </div>
      </section>



      {/* About Section */}
      <section className="py-12 md:py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center border-t border-secondary-200">
        <AnimationWrapper withScroll animation="reveal" delay={0.2} duration={0.9}>
          <div className="space-y-6">
            <h2 className="text-4xl font-bold font-heading">About Our Mosque</h2>
            <div className="flex items-center font-medium">
              <MapPin className="w-5 h-5 mr-2" />
              <span>Brgy. Pogo, Alaminos City, Pangasinan</span>
            </div>
            <p className="text-lg leading-relaxed font-body">
              Located along the Alaminos-Bani road, Masjid Angullia stands as a spiritual home for the Muslim community in Western Pangasinan.
              Whether you are a resident or a traveler passing through, our doors are open for prayer, community events, and spiritual growth.
            </p>
          </div>
        </AnimationWrapper>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="cursor-pointer group/img"
            onClick={() => setSelectedFullImage({ src: "/images/mosque2.png", alt: "Prayer Hall" })}
          >
            <AnimationWrapper
              withScroll
              animation="reveal"
              delay={0.3}
              className="relative h-64 rounded-2xl overflow-hidden shadow-lg transform translate-y-8"
            >
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 z-10 transition-colors flex items-center justify-center">
                <ZoomIn className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity w-8 h-8" />
              </div>
              <Image
                src="/images/mosque2.png"
                alt="Prayer Hall"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover/img:scale-110"
              />
            </AnimationWrapper>
          </div>
          <div
            className="cursor-pointer group/img"
            onClick={() => setSelectedFullImage({ src: "/images/prayer.png", alt: "Community Event" })}
          >
            <AnimationWrapper
              withScroll
              animation="reveal"
              delay={0.5}
              className="relative h-64 rounded-2xl overflow-hidden shadow-lg"
            >
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 z-10 transition-colors flex items-center justify-center">
                <ZoomIn className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity w-8 h-8" />
              </div>
              <Image
                src="/images/prayer.png"
                alt="Community Event"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover/img:scale-110"
              />
            </AnimationWrapper>
          </div>
        </div>
      </section>

      <Footer onAdminClick={() => setIsAdminLoginOpen(true)} />

      <ImageModal
        isOpen={!!selectedFullImage}
        onClose={() => setSelectedFullImage(null)}
        src={selectedFullImage?.src || ""}
        alt={selectedFullImage?.alt || ""}
      />

      <EventRegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        event={selectedEvent}
      />

      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
      />

      <Modal
        // ... (keep modal)
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        title=""
        className="max-w-md bg-secondary-900 border-secondary-800"
      >
        <div className="text-center flex flex-col items-center mb-6">
          <div className="bg-primary-500/10 p-3 rounded-full mb-4">
            <ShieldCheck className="w-10 h-10 text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-secondary-400">
            Restricted access for authorized personnel only
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleAdminLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-md border-0 py-3 px-3 text-white bg-secondary-800 ring-1 ring-inset ring-secondary-700 placeholder:text-secondary-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
                placeholder="Admin Email"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type={showAdminPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="relative block w-full rounded-md border-0 py-3 pl-3 pr-10 text-white bg-secondary-800 ring-1 ring-inset ring-secondary-700 placeholder:text-secondary-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 hover:text-white transition-colors"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
              >
                {showAdminPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {loginError && (
            <div className="text-red-400 text-sm text-center bg-red-950/30 p-2 rounded border border-red-900/50">
              {loginError}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-primary-600 px-3 py-3 text-sm font-semibold text-white hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-70 transition-all shadow-lg hover:shadow-primary-500/20"
            >
              {isLoading ? "Verifying..." : "Access Dashboard"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
