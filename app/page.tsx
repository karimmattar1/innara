'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  MessageSquare,
  BarChart3,
  Users,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Check
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    hotelName: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setSubmitted(true)
    setIsSubmitting(false)

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false)
      setFormData({ name: '', email: '', hotelName: '', message: '' })
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/80 border-b border-navy/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-light to-gold rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-navy">INNARA</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-navy/70 hover:text-navy transition-colors">Features</a>
            <a href="#demo" className="text-navy/70 hover:text-navy transition-colors">Demo</a>
            <a href="#contact" className="text-navy/70 hover:text-navy transition-colors">Contact</a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-gradient-to-r from-gold-light to-gold text-white rounded-full font-semibold shadow-lg hover:shadow-glow-gold transition-all"
            >
              Get Started
            </motion.a>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-6 px-6 py-2 bg-gold/10 border border-gold/30 rounded-full"
            >
              <span className="text-gold font-semibold">AI-Powered Hotel Guest Experience</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold text-navy mb-6 leading-tight">
              Transform Your Hotel's
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-light via-gold to-gold-hover">
                Guest Experience
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-navy/70 mb-12 leading-relaxed">
              INNARA brings AI-powered concierge services to your guests' fingertips.
              <br />
              Instant requests, seamless communication, happier guests.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="#demo"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-gold-light to-gold text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-glow-gold-strong transition-all flex items-center justify-center gap-2"
              >
                View Live Demo
                <ArrowRight className="w-5 h-5" />
              </motion.a>

              <motion.a
                href="#contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white border-2 border-navy text-navy rounded-full font-semibold text-lg shadow-lg hover:bg-navy hover:text-white transition-all"
              >
                Schedule Demo
              </motion.a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-gold mb-2">55%</div>
                <div className="text-navy/70">Guest Adoption</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-gold mb-2">2.5x</div>
                <div className="text-navy/70">Response Speed</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-gold mb-2">90%</div>
                <div className="text-navy/70">Satisfaction</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section with Screenshots */}
      <section id="features" className="py-20 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-navy mb-4">
              Two Sides, One Experience
            </h2>
            <p className="text-xl text-navy/70 max-w-2xl mx-auto">
              Seamless communication between guests and staff powered by AI
            </p>
          </motion.div>

          {/* Guest Side Screenshots */}
          <div className="mb-20">
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-navy mb-8 flex items-center gap-3"
            >
              <MessageSquare className="w-8 h-8 text-gold" />
              For Your Guests
            </motion.h3>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Guest Screenshot 1 - Chat Interface */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-gold-light to-gold rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition-all"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-navy/10">
                  <div className="aspect-[9/16] bg-gradient-to-br from-navy/5 to-gold/5 flex items-center justify-center">
                    <div className="text-center p-8">
                      <MessageSquare className="w-16 h-16 text-gold mx-auto mb-4" />
                      <h4 className="text-2xl font-bold text-navy mb-2">AI Chat Concierge</h4>
                      <p className="text-navy/70">Natural conversation, instant responses</p>
                    </div>
                  </div>
                  <div className="p-6 bg-white border-t border-navy/10">
                    <h4 className="font-bold text-navy mb-2">Intelligent Conversations</h4>
                    <ul className="space-y-2 text-sm text-navy/70">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span>Natural language understanding</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span>Contextual recommendations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span>Instant service requests</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Guest Screenshot 2 - Room Service */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="group relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-gold-light to-gold rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition-all"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-navy/10">
                  <div className="aspect-[9/16] bg-gradient-to-br from-navy/5 to-gold/5 flex items-center justify-center">
                    <div className="text-center p-8">
                      <Sparkles className="w-16 h-16 text-gold mx-auto mb-4" />
                      <h4 className="text-2xl font-bold text-navy mb-2">Room Service</h4>
                      <p className="text-navy/70">Order anything, anytime</p>
                    </div>
                  </div>
                  <div className="p-6 bg-white border-t border-navy/10">
                    <h4 className="font-bold text-navy mb-2">Seamless Ordering</h4>
                    <ul className="space-y-2 text-sm text-navy/70">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span>Visual menu with photos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span>Real-time order tracking</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span>Contactless payment</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Hotel Staff Side Screenshots */}
          <div>
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-navy mb-8 flex items-center gap-3"
            >
              <Users className="w-8 h-8 text-gold" />
              For Your Team
            </motion.h3>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Dashboard Screenshot */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-gold-light to-gold rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition-all"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-navy/10">
                  <div className="aspect-video bg-gradient-to-br from-navy/5 to-gold/5 flex items-center justify-center">
                    <div className="text-center p-8">
                      <BarChart3 className="w-16 h-16 text-gold mx-auto mb-4" />
                      <h4 className="text-2xl font-bold text-navy mb-2">Live Dashboard</h4>
                      <p className="text-navy/70">Real-time request management</p>
                    </div>
                  </div>
                  <div className="p-6 bg-white border-t border-navy/10">
                    <h4 className="font-bold text-navy mb-2">Centralized Control</h4>
                    <ul className="space-y-2 text-sm text-navy/70">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span>Track all guest requests</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span>Assign to team members</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span>Monitor response times</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Analytics Screenshot */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="group relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-gold-light to-gold rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition-all"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-navy/10">
                  <div className="aspect-video bg-gradient-to-br from-navy/5 to-gold/5 flex items-center justify-center">
                    <div className="text-center p-8">
                      <BarChart3 className="w-16 h-16 text-gold mx-auto mb-4" />
                      <h4 className="text-2xl font-bold text-navy mb-2">AI Insights</h4>
                      <p className="text-navy/70">Data-driven decisions</p>
                    </div>
                  </div>
                  <div className="p-6 bg-white border-t border-navy/10">
                    <h4 className="font-bold text-navy mb-2">Smart Analytics</h4>
                    <ul className="space-y-2 text-sm text-navy/70">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span>Guest behavior patterns</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span>Revenue opportunities</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span>Performance metrics</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Links Section */}
      <section id="demo" className="py-20 px-6 bg-gradient-to-br from-navy via-navy-dark to-navy">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              See INNARA in Action
            </h2>
            <p className="text-xl text-white/70 mb-12">
              Experience both sides of the platform
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                whileHover={{ scale: 1.05, y: -10 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-left"
              >
                <MessageSquare className="w-12 h-12 text-gold mb-4" />
                <h3 className="text-2xl font-bold text-white mb-3">Guest Experience</h3>
                <p className="text-white/70 mb-6">
                  Try the mobile app as a hotel guest. Chat with AI, order room service, explore features.
                </p>
                <Link
                  href="/guest"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-light to-gold text-white rounded-full font-semibold hover:shadow-glow-gold transition-all"
                >
                  Launch Guest App
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -10 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-left"
              >
                <BarChart3 className="w-12 h-12 text-gold mb-4" />
                <h3 className="text-2xl font-bold text-white mb-3">Staff Dashboard</h3>
                <p className="text-white/70 mb-6">
                  See how your team manages requests, tracks performance, and uses AI insights.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-light to-gold text-white rounded-full font-semibold hover:shadow-glow-gold transition-all"
                >
                  Launch Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-navy mb-4">
              Ready to Transform Your Hotel?
            </h2>
            <p className="text-xl text-navy/70">
              Get in touch to schedule a personalized demo
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-navy/10"
          >
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-navy/20 focus:border-gold focus:outline-none transition-colors"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-navy/20 focus:border-gold focus:outline-none transition-colors"
                      placeholder="john@hotel.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">
                    Hotel Name *
                  </label>
                  <input
                    type="text"
                    value={formData.hotelName}
                    onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-navy/20 focus:border-gold focus:outline-none transition-colors"
                    placeholder="Grand Hotel & Resorts"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-navy/20 focus:border-gold focus:outline-none transition-colors h-32 resize-none"
                    placeholder="Tell us about your hotel and what you're looking for..."
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-gold-light to-gold text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-glow-gold-strong transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Mail className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-gold-light to-gold rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-navy mb-3">Thank You!</h3>
                <p className="text-xl text-navy/70">
                  We've received your message and will be in touch shortly.
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Contact Info */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <motion.div
              whileHover={{ y: -5 }}
              className="text-center p-6 bg-white rounded-2xl shadow-lg border border-navy/10"
            >
              <Mail className="w-8 h-8 text-gold mx-auto mb-3" />
              <h4 className="font-semibold text-navy mb-1">Email</h4>
              <a href="mailto:hello@innara.ai" className="text-navy/70 hover:text-gold transition-colors">
                hello@innara.ai
              </a>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="text-center p-6 bg-white rounded-2xl shadow-lg border border-navy/10"
            >
              <Phone className="w-8 h-8 text-gold mx-auto mb-3" />
              <h4 className="font-semibold text-navy mb-1">Phone</h4>
              <a href="tel:+971501234567" className="text-navy/70 hover:text-gold transition-colors">
                +971 50 123 4567
              </a>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="text-center p-6 bg-white rounded-2xl shadow-lg border border-navy/10"
            >
              <MapPin className="w-8 h-8 text-gold mx-auto mb-3" />
              <h4 className="font-semibold text-navy mb-1">Location</h4>
              <p className="text-navy/70">
                Dubai, UAE
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-gold-light to-gold rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">INNARA</span>
              </div>
              <p className="text-white/70 text-sm">
                AI-powered hospitality platform transforming guest experiences.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#features" className="hover:text-gold transition-colors">Features</a></li>
                <li><a href="#demo" className="hover:text-gold transition-colors">Demo</a></li>
                <li><a href="/guest" className="hover:text-gold transition-colors">Guest App</a></li>
                <li><a href="/dashboard" className="hover:text-gold transition-colors">Dashboard</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#contact" className="hover:text-gold transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-gold transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-sm text-white/70">
            <p>© 2025 INNARA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
