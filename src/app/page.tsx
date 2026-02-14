"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowRight, MapPin, ShieldCheck, Heart, Calendar, Clock, BookOpen, Lock, Bell, Smartphone, Eye, EyeOff, ThumbsUp, MessageCircle, Share2, MoreHorizontal, ZoomIn } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getAnnouncements } from "@/lib/announcements";
import { Announcement } from "@/lib/types";
import PrayerTimesWidget from "@/components/PrayerTimesWidget";
import { auth, db } from "@/lib/firebase";
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
import AttendancePortal from "@/components/attendance/AttendancePortal";
import AnnouncementCard from "@/components/feed/AnnouncementCard";
import FeedbackModal from "@/components/modules/FeedbackModal";
import { clockIn } from "@/lib/attendance";

const Modal = dynamic(() => import("@/components/ui/modal"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [selectedFullImage, setSelectedFullImage] = useState<{ src: string, alt: string } | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

    // Listen for login modal trigger from Navbar
    const handleOpenLogin = () => setIsLoginModalOpen(true);
    window.addEventListener('open-login-modal', handleOpenLogin);
    return () => window.removeEventListener('open-login-modal', handleOpenLogin);
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

  const [loginRole, setLoginRole] = useState<'staff' | 'volunteer' | 'admin'>('staff');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const uid = user.uid;

      // Check user role from DB to confirm privileges
      const userDoc = await getDoc(doc(db, "families", uid));
      let finalRole = loginRole;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          finalRole = 'admin';
        }
      }

      // Check specifically for seed admin to upgrade if needed
      if (email === process.env.NEXT_PUBLIC_ADMIN_SEED_EMAIL) {
        finalRole = 'admin';
        if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
          await setDoc(doc(db, "families", uid), {
            email: email,
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
            name: "Super Admin",
            familyMembers: []
          }, { merge: true });
        }
      }

      // Perform Clock In
      try {
        const displayName = user.displayName || user.email?.split('@')[0] || "User";
        // Convert to compatible role string
        await clockIn(uid, displayName, email, finalRole as 'volunteer' | 'staff' | 'admin');
        console.log("Auto clocked in successfully");
      } catch (clockErr) {
        // Ignore "already clocked in" errors or others during login, don't block login
        console.log("Clock in status:", clockErr);
      }

      // Redirect to Admin Portal for all authorized staff/roles
      console.log(`Redirecting to portal as ${finalRole}...`);
      router.push("/admin");

    } catch (err: unknown) {
      console.error(err);
      setLoginError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };


  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  const handleAttendanceSuccess = () => {
    // Keep modal open briefly to show success state from component
    setTimeout(() => {
      setIsAttendanceOpen(false);
    }, 3000);
  };

  if (!mounted) {
    return <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 opacity-0" />;
  }

  return (
    <div className="flex min-h-screen flex-col animate-fade-in">
      {/* ... Hero Section remains ... */}
      <section className="relative w-full min-h-[100svh] md:h-[800px] flex items-center justify-center text-center text-white overflow-hidden py-20 md:py-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 z-10" />
        <div className="absolute inset-0">
          <Image
            src="/images/mosque.png"
            alt="Masjid Angullia"
            fill
            sizes="125vw"
            className="object-cover scale-105 animate-slow-zoom"
            priority
          />
        </div>

        <div className="relative z-20 max-w-5xl px-4 flex flex-col items-center gap-6 md:gap-8">
          <AnimationWrapper animation="reveal" duration={1.2} withScroll={false}>
            <h1 className="text-4xl md:text-8xl font-bold tracking-tight font-heading drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/90 leading-tight">
              Masjid Angullia
            </h1>
          </AnimationWrapper>
          <AnimationWrapper animation="reveal" delay={0.3} duration={1} withScroll={false}>
            <p className="text-lg md:text-3xl font-light text-secondary-100 drop-shadow-lg max-w-3xl leading-relaxed tracking-wide px-4">
              A beacon of faith and community in the heart of Alaminos City.
            </p>
          </AnimationWrapper>

          {/* Prayer Times Widget */}
          <AnimationWrapper animation="reveal" delay={0.4} duration={1} withScroll={false} className="mt-6 md:mt-8 w-full max-w-3xl">
            <PrayerTimesWidget />
          </AnimationWrapper>

          {/* Attendance Quick Access Button */}
          <AnimationWrapper animation="reveal" delay={0.6} duration={0.8} withScroll={false} className="w-full max-w-lg flex justify-center mt-6">
            <button
              onClick={() => setIsAttendanceOpen(true)}
              className="flex items-center gap-4 md:gap-5 px-6 py-4 md:px-8 md:py-6 bg-white dark:bg-secondary-900 rounded-[2rem] shadow-2xl shadow-primary-900/5 hover:shadow-3xl hover:shadow-primary-500/20 border border-white/50 dark:border-secondary-800 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden w-full md:w-auto justify-between md:justify-start"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300 shrink-0">
                  <Clock className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div className="text-left relative z-10">
                  <h3 className="text-lg md:text-xl font-bold text-secondary-900 dark:text-white leading-tight mb-0.5">Record your attendance</h3>
                  <p className="text-xs md:text-sm font-medium text-secondary-500 dark:text-secondary-400">Mark your attendance today</p>
                </div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center ml-2 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300 shrink-0">
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform" />
              </div>
            </button>
          </AnimationWrapper>
        </div>
      </section>



      {/* Community Hub & Donations Section */}
      <section className="py-12 md:py-24 bg-secondary-50/50 dark:bg-secondary-950 relative overflow-hidden transition-colors duration-300">
        {/* Subtle Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary-500/5 rounded-full blur-[100px]" />
          <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-secondary-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="mb-8 md:mb-12 flex flex-col md:flex-row items-end justify-between gap-6 md:gap-0">
            <AnimationWrapper withScroll animation="reveal" duration={0.8} delay={0.1}>
              <div className="max-w-2xl">
                <span className="text-primary-600 dark:text-primary-400 font-bold tracking-widest text-xs uppercase mb-2 block">Community Updates</span>
                <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white font-heading tracking-tight leading-tight">Community Hub</h2>
                <p className="text-secondary-600 dark:text-secondary-400 mt-3 md:mt-4 text-base md:text-lg leading-relaxed">
                  Stay connected with the latest announcements, upcoming events, and contributions from our jama&apos;ah.
                </p>
              </div>
            </AnimationWrapper>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column: Announcements & Events (Span 2) */}
            <AnimationWrapper withScroll animation="reveal" duration={0.8} delay={0.5} className="lg:col-span-2">
              <div className="space-y-6 md:space-y-8">
                {mounted && filteredAnnouncements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {filteredAnnouncements.slice(0, 2).map((post, idx) => (
                      <AnnouncementCard
                        key={post.id}
                        post={post}
                        delay={0.5 + (idx * 0.1)}
                        onClick={() => setSelectedAnnouncement(post)}
                      />
                    ))}
                  </div>
                ) : mounted ? (
                  <div
                    className="text-center py-20 bg-white dark:bg-secondary-900/50 rounded-3xl border border-dashed border-secondary-200 dark:border-secondary-800 transition-colors duration-300"
                  >
                    <p className="text-secondary-500 dark:text-secondary-400 font-medium">No updates at the moment.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-64 bg-secondary-100 dark:bg-secondary-800 animate-pulse rounded-3xl" />
                    ))}
                  </div>
                )}

                {mounted && filteredAnnouncements.length > 2 && (
                  <div className="flex justify-center pt-2 md:pt-4">
                    <Link
                      href="/updates"
                      className="group flex items-center gap-2 px-8 py-4 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 text-secondary-900 dark:text-white font-bold rounded-2xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all shadow-lg shadow-secondary-200/20 dark:shadow-none w-full md:w-auto justify-center"
                    >
                      View All Updates
                      <div className="w-6 h-6 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors ml-2">
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </AnimationWrapper>

            {/* Right Column: Recent Donations & Quick Stats (Span 1) */}
            <AnimationWrapper withScroll animation="reveal" duration={0.8} delay={0.7}>
              <div className="space-y-8">
                {/* Donations Card */}
                <div
                  className={cn(
                    "rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all duration-500 border border-white/50 dark:border-white/5 shadow-2xl backdrop-blur-sm",
                    "bg-white/90", // Standard (Light Mode)
                    "dark:bg-secondary-900/90", // Standard (Dark Mode)
                    (!mounted || recentDonations.length === 0) ? "min-h-[200px]" : "min-h-[240px]"
                  )}>
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl"></div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold font-heading mb-6 flex items-center gap-2">
                      <Heart className="w-6 h-6 text-pink-500 fill-pink-500 animate-pulse" />
                      Recent Donations
                    </h3>

                    <div className="relative overflow-hidden group/marquee">
                      {!mounted ? (
                        <div className="space-y-4 animate-pulse">
                          <div className="h-16 bg-secondary-50 dark:bg-white/5 rounded-xl" />
                          <div className="h-16 bg-secondary-50 dark:bg-white/5 rounded-xl" />
                        </div>
                      ) : recentDonations.length === 0 ? (
                        <div className="text-center py-8 text-secondary-300 italic text-sm">
                          Join our community of donors to support Masjid Angullia.
                        </div>
                      ) : (
                        <div className="flex overflow-hidden no-scrollbar">
                          <motion.div
                            className="flex gap-4 pr-4"
                            animate={{
                              x: ["0%", "-50%"]
                            }}
                            transition={{
                              duration: 20,
                              ease: "linear",
                              repeat: Infinity,
                            }}
                            whileHover={{ animationPlayState: "paused" }}
                          >
                            {/* Duplicate items for seamless loop */}
                            {[...recentDonations, ...recentDonations].map((donation, idx) => (
                              <div
                                key={`${donation.id}-${idx}`}
                                className={cn(
                                  "rounded-xl p-3 flex flex-col gap-2 border transition-colors group min-w-[200px] shrink-0",
                                  "bg-secondary-50 border-secondary-100 hover:bg-secondary-100", // Standard Light
                                  "dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10" // Standard Dark
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-300 dark:text-primary-600 font-bold text-xs uppercase shrink-0">
                                    {(donation.isAnonymous ? "A" : donation.donorName[0])}
                                  </div>
                                  <div className="overflow-hidden">
                                    <p className="font-medium text-sm text-secondary-900 dark:text-secondary-100 truncate">
                                      {donation.isAnonymous ? "Anonymous" : donation.donorName}
                                    </p>
                                    <p className="text-[10px] text-secondary-400 dark:text-secondary-500 truncate">{donation.type}</p>
                                  </div>
                                </div>
                                <div className="flex justify-between items-end mt-1">
                                  <span className="font-bold text-secondary-900 dark:text-secondary-100 text-sm">₱{donation.amount.toLocaleString()}</span>
                                  <span className="text-[10px] text-secondary-400 dark:text-secondary-500 group-hover:text-secondary-300 dark:group-hover:text-secondary-700 transition-colors">{formatTimeAgo(donation.date)}</span>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        </div>
                      )}
                    </div>

                    {recentDonations.length === 0 && (
                      <div className={cn(
                        "rounded-2xl p-4 border text-center animate-fade-in",
                        "bg-secondary-50 border-secondary-100", // Standard Light
                        "dark:bg-white/5 dark:border-white/10" // Standard Dark
                      )}>
                        <p className="text-secondary-300 dark:text-secondary-600 text-sm mb-3 font-medium">Support our masjid & community</p>
                        <Link
                          href="/donations"
                          className="block w-full py-3 bg-primary-600 dark:bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg"
                        >
                          Donate Now
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AnimationWrapper>
          </div>
        </div >
      </section >

      {/* SMS Subscription Section */}
      < section className="py-12 bg-primary-900 text-white relative overflow-hidden" >
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
      </section >



      {/* About Section */}
      < section className="py-12 md:py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center border-t border-secondary-200" >
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
      </section >

      <Footer onAdminClick={() => setIsLoginModalOpen(true)} onFeedbackClick={() => setIsFeedbackOpen(true)} />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

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
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        title=""
        className="max-w-md p-0 bg-transparent border-none shadow-none"
        hideScrollbar={true}
      >
        <AttendancePortal onSuccess={handleAttendanceSuccess} />
      </Modal>

      <Modal
        isOpen={!!selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        title=""
        className="max-w-2xl p-0 bg-transparent border-none shadow-none"
      >
        {selectedAnnouncement && <SocialPost post={selectedAnnouncement} />}
      </Modal>

      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title=""
        className="max-w-md bg-secondary-900 border-secondary-800"
      >
        <div className="text-center flex flex-col items-center mb-6">
          <div className="bg-primary-500/10 p-3 rounded-full mb-4">
            <Lock className="w-10 h-10 text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
            Sign In
          </h2>
          <p className="mt-2 text-sm text-secondary-400">
            Access your account
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-xl border-0 py-3.5 px-4 text-white bg-secondary-800 ring-1 ring-inset ring-secondary-700 placeholder:text-secondary-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-500 text-base sm:text-sm sm:leading-6 transition-all"
                placeholder="Email Address"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="relative block w-full rounded-xl border-0 py-3.5 pl-4 pr-10 text-white bg-secondary-800 ring-1 ring-inset ring-secondary-700 placeholder:text-secondary-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-500 text-base sm:text-sm sm:leading-6 transition-all"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Role Selection for Non-Admins (Implicit via UI) */}
            <div>
              <label className="text-xs font-bold text-secondary-400 uppercase tracking-widest mb-2 block">Login As</label>
              <div className="grid grid-cols-3 gap-2">
                {(['staff', 'volunteer', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setLoginRole(r)}
                    className={cn(
                      "py-2 px-1 border rounded-lg text-xs font-bold uppercase transition-all",
                      loginRole === r
                        ? "bg-primary-600 border-primary-500 text-white"
                        : "border-secondary-700 text-secondary-400 hover:bg-secondary-800"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loginError && (
            <div className="text-red-400 text-sm text-center bg-red-950/30 p-2 rounded border border-red-900/50">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-md bg-primary-600 px-3 py-3 text-sm font-semibold text-white hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-70 transition-all shadow-lg hover:shadow-primary-500/20"
          >
            {isLoading ? "Signing In..." : "Sign In & Clock In"}
          </button>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className="text-xs text-secondary-400 hover:text-white transition-colors"
            >
              Need an account? <span className="underline">Contact Admin</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
