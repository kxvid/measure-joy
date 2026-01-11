"use client"

import type React from "react"
import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Wrench, Camera, Send, Check, Clock, Shield, Sparkles, CircleDollarSign, ChevronDown } from "lucide-react"

const serviceTypes = [
  { value: "repair", label: "Camera Repair", description: "Fix issues with your camera" },
  { value: "restoration", label: "Full Restoration", description: "Complete refurbishment" },
  { value: "cleaning", label: "Sensor Cleaning", description: "Professional deep clean" },
  { value: "quote", label: "Quote Request", description: "Get an estimate first" },
]

const cameraBrands = ["Sony", "Canon", "Fujifilm", "Olympus", "Nikon", "Kodak", "Casio", "Panasonic", "Other"]

const commonIssues = [
  "Won't turn on",
  "Lens stuck/jammed",
  "LCD screen issues",
  "Flash not working",
  "Battery problems",
  "Image quality issues",
  "Buttons not responding",
  "Memory card errors",
  "Cosmetic damage",
  "Other",
]

export default function RepairPage() {
  const [submitted, setSubmitted] = useState(false)
  const [selectedService, setSelectedService] = useState("")
  const [selectedIssues, setSelectedIssues] = useState<string[]>([])

  const toggleIssue = (issue: string) => {
    setSelectedIssues((prev) => (prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Build email body
    const name = formData.get("name")
    const email = formData.get("email")
    const phone = formData.get("phone")
    const brand = formData.get("brand")
    const model = formData.get("model")
    const description = formData.get("description")

    const subject = `Camera ${selectedService || "Service"} Request - ${brand} ${model}`
    const body = `
Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}

Camera Details:
- Brand: ${brand}
- Model: ${model}

Service Type: ${selectedService || "Not specified"}

Issues: ${selectedIssues.length > 0 ? selectedIssues.join(", ") : "Not specified"}

Description:
${description}
    `.trim()

    // Open email client
    window.location.href = `mailto:christianvelasquez363@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero section */}
      <section className="bg-foreground text-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8">
            <Breadcrumbs items={[{ label: "Repair Services" }]} />
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-pop-pink px-4 py-2 mb-6">
                <Wrench className="h-4 w-4" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">Camera Service</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-black uppercase leading-none">
                We Fix
                <br />
                <span className="text-pop-yellow">Y2K Cameras</span>
              </h1>
              <p className="text-background/70 mt-6 text-lg max-w-md">
                Expert repair and restoration services for your vintage digital cameras. Bring your beloved tech back to
                life.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-10">
                <div>
                  <p className="text-3xl font-black text-pop-yellow">500+</p>
                  <p className="text-xs font-mono uppercase text-background/50 mt-1">Cameras Fixed</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-pop-pink">48hr</p>
                  <p className="text-xs font-mono uppercase text-background/50 mt-1">Avg Turnaround</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-pop-teal">90 Day</p>
                  <p className="text-xs font-mono uppercase text-background/50 mt-1">Warranty</p>
                </div>
              </div>
            </div>

            {/* Service cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-pop-yellow p-6 text-foreground">
                <Wrench className="h-8 w-8 mb-4" />
                <h3 className="font-bold text-lg">Repairs</h3>
                <p className="text-sm mt-2 text-foreground/70">Lens jams, LCD issues, power problems & more</p>
              </div>
              <div className="bg-pop-pink p-6 text-foreground">
                <Sparkles className="h-8 w-8 mb-4" />
                <h3 className="font-bold text-lg">Restoration</h3>
                <p className="text-sm mt-2 text-foreground/70">Full refurb to like-new condition</p>
              </div>
              <div className="bg-pop-teal p-6 text-foreground">
                <Camera className="h-8 w-8 mb-4" />
                <h3 className="font-bold text-lg">Cleaning</h3>
                <p className="text-sm mt-2 text-foreground/70">Sensor & lens deep cleaning service</p>
              </div>
              <div className="bg-background/10 p-6 text-background border border-background/20">
                <CircleDollarSign className="h-8 w-8 mb-4" />
                <h3 className="font-bold text-lg">Free Quotes</h3>
                <p className="text-sm mt-2 text-background/70">No obligation estimates</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-12 border-b-4 border-foreground">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pop-yellow flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-sm">90-Day Warranty</p>
                <p className="text-xs text-muted-foreground">On all repairs</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pop-pink flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-sm">Fast Turnaround</p>
                <p className="text-xs text-muted-foreground">Usually 2-5 days</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pop-teal flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-sm">Expert Techs</p>
                <p className="text-xs text-muted-foreground">Y2K specialists</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center shrink-0">
                <CircleDollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-sm">Fair Pricing</p>
                <p className="text-xs text-muted-foreground">No hidden fees</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intake form section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Form info */}
            <div>
              <h2 className="text-3xl lg:text-4xl font-black uppercase">Request a Repair</h2>
              <p className="text-muted-foreground mt-4 max-w-md">
                Fill out the form and we'll get back to you within 24 hours with an assessment and quote. No commitment
                required.
              </p>

              {/* Process steps */}
              <div className="mt-10 space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-pop-yellow text-foreground flex items-center justify-center shrink-0 font-black">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold">Submit Your Request</h3>
                    <p className="text-sm text-muted-foreground mt-1">Tell us about your camera and what's wrong</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-pop-pink text-foreground flex items-center justify-center shrink-0 font-black">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold">Get Your Quote</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We'll email you a detailed estimate within 24 hours
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-pop-teal text-foreground flex items-center justify-center shrink-0 font-black">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold">Ship Your Camera</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Send it in with our prepaid label (if approved)
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center shrink-0 font-black">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold">Get It Back Better</h3>
                    <p className="text-sm text-muted-foreground mt-1">We'll fix it up and ship it back to you</p>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="mt-10 p-6 bg-secondary">
                <h3 className="font-bold mb-2">Questions?</h3>
                <p className="text-sm text-muted-foreground">
                  Email us directly at{" "}
                  <a
                    href="mailto:christianvelasquez363@gmail.com"
                    className="text-pop-pink font-medium hover:underline"
                  >
                    christianvelasquez363@gmail.com
                  </a>
                </p>
              </div>
            </div>

            {/* Form */}
            <div>
              <div className="bg-card border-4 border-foreground p-6 lg:p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-pop-teal flex items-center justify-center mx-auto">
                      <Check className="h-10 w-10 text-foreground" />
                    </div>
                    <h3 className="text-2xl font-black uppercase mt-6">Request Sent!</h3>
                    <p className="text-muted-foreground mt-3">
                      Your email app should have opened with the repair request. If not, please email us directly at
                      christianvelasquez363@gmail.com
                    </p>
                    <Button
                      variant="outline"
                      className="mt-8 bg-transparent border-2 border-foreground"
                      onClick={() => {
                        setSubmitted(false)
                        setSelectedService("")
                        setSelectedIssues([])
                      }}
                    >
                      Submit Another Request
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact info */}
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Your Info</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="Your name"
                            required
                            className="border-2 border-foreground/20 focus:border-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            className="border-2 border-foreground/20 focus:border-foreground"
                          />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          className="border-2 border-foreground/20 focus:border-foreground"
                        />
                      </div>
                    </div>

                    {/* Camera info */}
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Camera Details</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="brand">Brand *</Label>
                          <div className="relative">
                            <select
                              id="brand"
                              name="brand"
                              required
                              className="w-full h-10 px-3 border-2 border-foreground/20 bg-background appearance-none focus:border-foreground focus:outline-none"
                            >
                              <option value="">Select brand</option>
                              {cameraBrands.map((brand) => (
                                <option key={brand} value={brand}>
                                  {brand}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="model">Model *</Label>
                          <Input
                            id="model"
                            name="model"
                            placeholder="e.g. Cyber-shot DSC-P200"
                            required
                            className="border-2 border-foreground/20 focus:border-foreground"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Service type */}
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Service Type</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {serviceTypes.map((service) => (
                          <button
                            key={service.value}
                            type="button"
                            onClick={() => setSelectedService(service.value)}
                            className={`p-4 border-2 text-left transition-all ${
                              selectedService === service.value
                                ? "border-foreground bg-pop-yellow"
                                : "border-foreground/20 hover:border-foreground/40"
                            }`}
                          >
                            <p className="font-bold text-sm">{service.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Issues */}
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wider mb-4">
                        What's Wrong? (select all that apply)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {commonIssues.map((issue) => (
                          <button
                            key={issue}
                            type="button"
                            onClick={() => toggleIssue(issue)}
                            className={`px-3 py-2 text-xs font-medium border-2 transition-all ${
                              selectedIssues.includes(issue)
                                ? "border-foreground bg-foreground text-background"
                                : "border-foreground/20 hover:border-foreground/40"
                            }`}
                          >
                            {issue}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Additional Details</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Please describe the issue in detail. When did it start? Any specific circumstances? The more info the better!"
                        rows={4}
                        className="border-2 border-foreground/20 focus:border-foreground resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-bold gap-2 bg-foreground text-background hover:bg-pop-pink hover:text-foreground"
                    >
                      <Send className="h-5 w-5" />
                      Send Repair Request
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      By submitting, you agree to our terms. We'll respond within 24 hours.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
