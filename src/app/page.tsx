"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowRight, MapPin, ShieldCheck, Heart, Calendar, Clock, BookOpen, Lock } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getAnnouncements } from "@/lib/announcements";
import { Announcement } from "@/lib/types";
import PrayerTimesWidget from "@/components/PrayerTimesWidget";
import { auth } from "@/lib/firebase";
import AnimationWrapper from "@/components/ui/AnimationWrapper";
import Footer from "@/components/layout/Footer";
import { getEvents } from "@/lib/events";
import { Event } from "@/lib/types";
import EventRegistrationModal from "@/components/events/EventRegistrationModal";

const Modal = dynamic(() => import("@/components/ui/modal"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  useEffect(() => {
    const fetchUpdates = async () => {
      const [announcementData, eventData] = await Promise.all([
        getAnnouncements(3),
        getEvents(3)
      ]);
      setAnnouncements(announcementData);
      setEvents(eventData);
    };
    fetchUpdates();
  }, []);

  const featuredPost = announcements.find(a => a.type === 'Urgent') || announcements[0];
  const otherPosts = announcements.filter(a => a.id !== featuredPost?.id).slice(0, 2);

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
      <section className="relative w-full h-[500px] flex items-center justify-center text-center text-white">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="absolute inset-0">
          <Image
            src="/images/mosque.png"
            alt="Masjid Angullia"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="relative z-20 max-w-4xl px-4 flex flex-col items-center gap-6">
          <AnimationWrapper animation="reveal" duration={1} withScroll={false}>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-heading drop-shadow-lg">
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
      <section className="py-16 bg-secondary-50 relative overflow-hidden">
        <AnimationWrapper withScroll animation="reveal" duration={0.8} className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-secondary-900 font-heading">Community Hub</h2>
              <p className="text-secondary-600 mt-1">Updates, events, and contributions from our jama&apos;ah.</p>
            </div>
            <button className="text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1 transition-colors">
              View All Updates <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Announcements & Events (Span 2) */}
            <div className="lg:col-span-2 space-y-8">

              {announcements.length > 0 ? (
                <>
                  {/* Featured / Hero Card */}
                  {featuredPost && (
                    <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm border border-secondary-100 group hover:shadow-md transition-all h-[400px]">
                      <Image
                        src={featuredPost.imageUrl || "/images/mosque2.png"}
                        alt="Featured"
                        fill
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 w-fit ${featuredPost.type === 'Urgent' ? 'bg-red-600' : 'bg-primary-600'
                          }`}>
                          {featuredPost.type === 'Event' ? 'Upcoming Event' : featuredPost.type}
                        </span>
                        <h3 className="text-3xl font-bold font-heading mb-2">{featuredPost.title}</h3>
                        <p className="text-secondary-200 line-clamp-2 mb-4">
                          {featuredPost.content}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-secondary-300">
                          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(featuredPost.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-grid for smaller updates */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {otherPosts.map((post) => (
                      <div key={post.id} className="bg-white p-6 rounded-3xl shadow-sm border border-secondary-100 hover:shadow-md transition-all h-full">
                        <div className="flex items-center justify-between mb-4">
                          <span className={`w-10 h-10 rounded-full flex items-center justify-center ${post.type === 'Urgent' ? 'bg-red-50 text-red-600' : 'bg-secondary-50 text-secondary-600'
                            }`}>
                            <ShieldCheck className="w-5 h-5" />
                          </span>
                          <span className="text-xs text-secondary-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-xl font-bold text-secondary-900 mb-2 line-clamp-1">{post.title}</h4>
                        <p className="text-secondary-600 text-sm mb-4 line-clamp-2">{post.content}</p>
                        {/* <Link href="#" className="text-primary-600 text-sm font-semibold hover:underline">Read More</Link> */}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-secondary-200">
                  <p className="text-secondary-500">No updates at the moment.</p>
                </div>
              )}
            </div>

            {/* Right Column: Recent Donations & Quick Stats (Span 1) */}
            <div className="space-y-8">
              {/* Donations Card */}
              <div className="bg-gradient-to-br from-primary-900 to-secondary-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden h-full min-h-[500px]">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold font-heading mb-6 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-pink-500 fill-pink-500 animate-pulse" />
                    Recent Giving
                  </h3>

                  <div className="space-y-4 mb-8">
                    {[
                      { name: "Brother Abdullah", amount: "₱5,000", time: "2h ago", type: "Zakat" },
                      { name: "Sister Fatima", amount: "₱2,500", time: "5h ago", type: "Sadaqah" },
                      { name: "Anonymous", amount: "₱1,000", time: "Yesterday", type: "General" },
                      { name: "Kareem Family", amount: "₱10,000", time: "2 days ago", type: "Construction" },
                      { name: "Anonymous", amount: "₱500", time: "2 days ago", type: "Sadaqah" },
                    ].map((donation, idx) => (
                      <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between border border-white/5 hover:bg-white/20 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-300 font-bold text-xs">
                            {donation.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-secondary-100 line-clamp-1">{donation.name}</p>
                            <p className="text-[10px] text-secondary-400">{donation.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block font-bold text-secondary-400 text-sm">{donation.amount}</span>
                          <span className="text-xs text-secondary-500 group-hover:text-secondary-300 transition-colors">{donation.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                    <p className="text-secondary-300 text-sm mb-3">Support our masjid & community</p>
                    <Link href="/donations" className="block w-full py-3 bg-white text-primary-900 font-bold rounded-xl hover:bg-secondary-100 transition-colors shadow-lg">
                      Donate Now
                    </Link>
                  </div>
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



      {/* About Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center border-t border-secondary-200">
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
          <AnimationWrapper withScroll animation="reveal" delay={0.3} className="relative h-64 rounded-2xl overflow-hidden shadow-lg transform translate-y-8">
            <Image
              src="/images/mosque2.png"
              alt="Prayer Hall"
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover hover:scale-110 transition-transform duration-700"
            />
          </AnimationWrapper>
          <AnimationWrapper withScroll animation="reveal" delay={0.5} className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/images/prayer.png"
              alt="Community Event"
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover hover:scale-110 transition-transform duration-700"
            />
          </AnimationWrapper>
        </div>
      </section>

      <Footer onAdminClick={() => setIsAdminLoginOpen(true)} />

      <EventRegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        event={selectedEvent}
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
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-md border-0 py-3 px-3 text-white bg-secondary-800 ring-1 ring-inset ring-secondary-700 placeholder:text-secondary-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
                placeholder="Password"
              />
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
