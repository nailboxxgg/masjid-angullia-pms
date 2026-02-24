"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowRight, MapPin, Heart, Clock, Lock, Smartphone, Eye, EyeOff, ZoomIn, Zap } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
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
import DonationModal from "@/components/ui/DonationModal";
import { cn, formatTimeAgo } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import SocialPost from "@/components/feed/SocialPost";
import ImageModal from "@/components/ui/ImageModal";
import FamilyRegistrationModal from "@/components/families/FamilyRegistrationModal";
import AnnouncementCard from "@/components/feed/AnnouncementCard";
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
  const [combinedUpdates, setCombinedUpdates] = useState<(Announcement | Event)[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventRegistrationOpen, setIsEventRegistrationOpen] = useState(false);
  const [isFamilyRegistrationOpen, setIsFamilyRegistrationOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [selectedFullImage, setSelectedFullImage] = useState<{ src: string, alt: string } | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const fetchUpdates = async () => {
      const [announcementData, eventData, donationData] = await Promise.all([
        getAnnouncements(5),
        getEvents(5),
        getDonations(5)
      ]);
      setAnnouncements(announcementData || []);
      setEvents(eventData || []);
      setRecentDonations(donationData || []);

      // Merge and sort
      const merged = [
        ...(announcementData || []),
        ...(eventData || [])
      ].sort((a, b) => {
        const timeA = a.createdAt || (('date' in a && !isNaN(Date.parse((a as any).date))) ? Date.parse((a as any).date) : 0);
        const timeB = b.createdAt || (('date' in b && !isNaN(Date.parse((b as any).date))) ? Date.parse((b as any).date) : 0);
        return timeB - timeA;
      });
      setCombinedUpdates(merged.slice(0, 4));
    };
    fetchUpdates();

    // Listen for login modal trigger from Navbar
    const handleOpenLogin = () => setIsLoginModalOpen(true);
    window.addEventListener('open-login-modal', handleOpenLogin);

    // Listen for family registration modal
    const handleOpenRegistration = () => setIsFamilyRegistrationOpen(true);
    window.addEventListener('open-family-registration-modal', handleOpenRegistration);

    // Auth Listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => {
      window.removeEventListener('open-login-modal', handleOpenLogin);
      window.removeEventListener('open-family-registration-modal', handleOpenRegistration);
      unsubscribe();
    };
  }, []);


  const handleRegister = (event: Event) => {
    setSelectedEvent(event);
    setIsEventRegistrationOpen(true);
  };


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

      // Check user role from the dedicated STAFF collection
      let userDoc = await getDoc(doc(db, "staff", uid));

      // Resiliency: If not found by UID, try looking up by email (legacy ID)
      if (!userDoc.exists()) {
        const staffRef = collection(db, "staff");
        const qEmail = query(staffRef, where("email", "==", email.toLowerCase()), limit(1));
        const emailSnapshot = await getDocs(qEmail);
        if (!emailSnapshot.empty) {
          userDoc = emailSnapshot.docs[0] as any;
        }
      }

      if (!userDoc.exists()) {
        // Not in staff collection, check if they are the super admin seed
        if (email !== process.env.NEXT_PUBLIC_ADMIN_SEED_EMAIL) {
          throw new Error(`Access denied. No admin account found with this email.`);
        }
      }

      // Auto-setup seed admin in staff collection if not present
      if (email === process.env.NEXT_PUBLIC_ADMIN_SEED_EMAIL) {
        if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
          await setDoc(doc(db, "staff", uid), {
            email: email,
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
            name: "Super Admin",
            uid: uid
          }, { merge: true });
        }
      }

      // Perform Clock In
      try {
        const displayName = user.displayName || user.email?.split('@')[0] || "User";
        await clockIn(uid, displayName, email, 'admin');
        console.log("Auto clocked in successfully");
      } catch (clockErr) {
        // Ignore "already clocked in" errors or others during login, don't block login
        console.log("Clock in status:", clockErr);
      }

      // Redirect to Admin Portal
      console.log("Redirecting to admin portal...");
      router.push("/admin");

    } catch (err: unknown) {
      console.error(err);
      setLoginError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="text-5xl md:text-8xl font-black tracking-tight font-heading drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80 leading-tight">
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

        </div>
      </section>



      {/* Community Hub & Donations Section */}
      <section className="py-24 bg-secondary-50/50 dark:bg-secondary-950 relative overflow-hidden transition-colors duration-300">
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
            <AnimationWrapper withScroll animation="reveal" duration={0.8} delay={0.5} className="lg:col-span-2 flex flex-col h-full">
              <div className={cn(
                "rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all duration-500 border border-white/50 dark:border-white/5 shadow-2xl backdrop-blur-sm flex-1 flex flex-col",
                "bg-white/90", // Standard (Light Mode)
                "dark:bg-secondary-900/90", // Standard (Dark Mode)
              )}>
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-secondary-500/5 dark:bg-secondary-500/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold font-heading flex items-center gap-2">
                      <Zap className="w-6 h-6 text-accent-500 fill-accent-500" />
                      Latest Updates
                    </h3>
                    <Link href="/updates" className="text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1">
                      View All <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {mounted && combinedUpdates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {combinedUpdates.slice(0, 4).map((post: Announcement | Event, idx: number) => (
                        <AnnouncementCard
                          key={post.id}
                          post={post}
                          delay={0.5 + (idx * 0.1)}
                          onClick={() => {
                            if ('location' in post) {
                              setSelectedEvent(post as Event);
                              setIsEventRegistrationOpen(true);
                            } else {
                              setSelectedAnnouncement(post as Announcement);
                            }
                          }}
                        />
                      ))}
                    </div>
                  ) : mounted ? (
                    <div
                      className="text-center py-20 bg-secondary-50 dark:bg-white/5 rounded-3xl border border-dashed border-secondary-200 dark:border-secondary-800 transition-colors duration-300 flex-1 flex items-center justify-center"
                    >
                      <p className="text-secondary-500 dark:text-secondary-400 font-medium">No updates at the moment.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-64 bg-secondary-100 dark:bg-white/5 animate-pulse rounded-3xl" />
                      ))}
                    </div>
                  )}

                  {/* Footer Action used to be separate, now integrated or removed if Header link is enough */}
                </div>
              </div>
            </AnimationWrapper>

            {/* Right Column: Recent Donations & Quick Stats (Span 1) */}
            <AnimationWrapper withScroll animation="reveal" duration={0.8} delay={0.7} className="flex flex-col h-full">
              <div className="space-y-8 flex-1 flex flex-col">


                {/* Donations Card */}
                <div
                  className={cn(
                    "rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all duration-500 border border-white/50 dark:border-white/5 shadow-2xl backdrop-blur-sm flex-1 flex flex-col",
                    "bg-white/90", // Standard (Light Mode)
                    "dark:bg-secondary-900/90", // Standard (Dark Mode)
                    (!mounted || recentDonations.length === 0) ? "min-h-[200px]" : "min-h-[240px]"
                  )}>
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold font-heading flex items-center gap-2">
                        <Heart className="w-6 h-6 text-pink-500 fill-pink-500 animate-pulse" />
                        Recent Donations
                      </h3>

                    </div>

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

                    {recentDonations.length > 0 && (
                      <div className="mt-6">
                        <button
                          onClick={() => setIsDonationModalOpen(true)}
                          className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-4 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary-600/30"
                        >
                          <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-10 mix-blend-overlay"></div>
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="text-left">
                              <span className="block text-[10px] font-bold uppercase tracking-widest text-primary-200 mb-0.5">Make an Impact</span>
                              <span className="block text-xl font-black font-heading">Donate Now</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                              <Heart className="w-5 h-5 fill-white" />
                            </div>
                          </div>
                        </button>
                      </div>
                    )}

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
      <section className="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center border-t border-secondary-200 dark:border-secondary-800" >
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

      <Footer onAdminClick={() => setIsLoginModalOpen(true)} onFeedbackClick={() => window.dispatchEvent(new CustomEvent('open-feedback-modal'))} />


      <ImageModal
        isOpen={!!selectedFullImage}
        onClose={() => setSelectedFullImage(null)}
        src={selectedFullImage?.src || ""}
        alt={selectedFullImage?.alt || ""}
      />

      <EventRegistrationModal
        isOpen={isEventRegistrationOpen}
        onClose={() => setIsEventRegistrationOpen(false)}
        event={selectedEvent}
      />

      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
      />

      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        fundName="General Fund"
      />

      <FamilyRegistrationModal
        isOpen={isFamilyRegistrationOpen}
        onClose={() => setIsFamilyRegistrationOpen(false)}
      />



      <Modal
        isOpen={!!selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        title=""
        className="max-w-2xl p-0 bg-transparent border-none shadow-none"
        hideScrollbar={true}
      >
        {selectedAnnouncement && <SocialPost post={selectedAnnouncement} currentUser={currentUser} />}
      </Modal>

      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
        }}
        title=""
        className="max-w-md bg-white/90 dark:bg-secondary-900/90 backdrop-blur-xl border-secondary-200 dark:border-secondary-800 shadow-2xl rounded-[2rem]"
        hideScrollbar={true}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center flex flex-col items-center mb-8">
            <div className="bg-primary-500/10 dark:bg-primary-500/20 p-4 rounded-3xl mb-4 text-primary-600 dark:text-primary-400">
              <Lock className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-secondary-900 dark:text-white font-heading">
              Admin Portal
            </h2>
            <p className="mt-2 text-sm font-medium text-secondary-500 dark:text-secondary-400">
              Please enter your credentials
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-secondary-500">Email Address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-2xl border-0 py-4 px-5 text-secondary-900 dark:text-white bg-secondary-100 dark:bg-secondary-800/50 ring-1 ring-inset ring-secondary-200 dark:ring-secondary-700 placeholder:text-secondary-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 text-base sm:text-sm transition-all shadow-inner"
                  placeholder="name@example.com"
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-secondary-500">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full rounded-2xl border-0 py-4 pl-5 pr-12 text-secondary-900 dark:text-white bg-secondary-100 dark:bg-secondary-800/50 ring-1 ring-inset ring-secondary-200 dark:ring-secondary-700 placeholder:text-secondary-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 text-base sm:text-sm transition-all shadow-inner"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-secondary-400 hover:text-primary-500 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 dark:text-red-400 text-xs font-bold text-center bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/50"
              >
                {loginError}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-2xl bg-primary-600 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-70 transition-all shadow-xl shadow-primary-500/25 hover:shadow-primary-500/35 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? "Authenticating..." : "Sign In & Access"}
            </button>
          </form>
        </motion.div>
      </Modal>
    </div>
  );
}
