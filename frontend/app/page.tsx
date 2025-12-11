import Image from "next/image";
import { Calendar, Clock, Heart, Shield, Users, Star, ArrowRight, Phone, MapPin, Mail } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-teal-500/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Health, Our 
                <span className="text-blue-600"> Priority</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                At NexusHealth, we provide exceptional medical care with cutting-edge technology 
                and compassionate professionals dedicated to your well-being.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all transform hover:-translate-y-1"
                >
                  Book Appointment
                  <Calendar className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  href="#services" 
                  className="inline-flex items-center justify-center border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all"
                >
                  Our Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Modern Hospital Interior"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              
              {/* Stats Card */}
              <div className="absolute -bottom-6 left-6 right-6 bg-white rounded-2xl p-6 shadow-xl">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">24/7</div>
                    <div className="text-sm text-gray-600">Emergency Care</div>
                  </div>
                  <div className="text-center border-x">
                    <div className="text-3xl font-bold text-blue-600">50+</div>
                    <div className="text-sm text-gray-600">Expert Doctors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">98%</div>
                    <div className="text-sm text-gray-600">Patient Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose NexusHealth?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine medical excellence with compassionate care for your complete well-being
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-blue-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Specialized Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive medical services tailored to your health needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <service.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <div className="flex items-center text-blue-600 font-semibold">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of patients who trust NexusHealth for their medical care. 
            Book your appointment today and experience healthcare reimagined.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all"
            >
              Book Appointment Now
              <Calendar className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
            >
              Create Account
              <Users className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Patient Stories</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from our satisfied patients about their experience at NexusHealth
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 italic mb-6">{testimonial.quote}</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-bold">{testimonial.initials}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.condition}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <Heart className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-2xl font-bold">NexusHealth</span>
              </div>
              <p className="text-gray-400">
                Delivering exceptional healthcare with compassion and innovation.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link href="/login" className="text-gray-400 hover:text-white transition">Patient Portal</Link></li>
                <li><Link href="#services" className="text-gray-400 hover:text-white transition">Our Services</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition">Find a Doctor</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition">Careers</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Contact Info</h3>
              <ul className="space-y-4">
                <li className="flex items-center text-gray-400">
                  <MapPin className="h-5 w-5 mr-3" />
                  123 Medical Center Dr, Health City
                </li>
                <li className="flex items-center text-gray-400">
                  <Phone className="h-5 w-5 mr-3" />
                  (555) 123-4567
                </li>
                <li className="flex items-center text-gray-400">
                  <Mail className="h-5 w-5 mr-3" />
                  contact@nexushealth.com
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Emergency</h3>
              <div className="bg-red-600 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <Clock className="h-6 w-6 mr-2" />
                  <span className="font-bold">24/7 Emergency</span>
                </div>
                <p className="text-sm mb-4">Immediate medical attention available</p>
                <div className="text-2xl font-bold">(555) 911-HELP</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} NexusHealth. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Shield,
    title: "Advanced Technology",
    description: "State-of-the-art medical equipment and digital health solutions"
  },
  {
    icon: Users,
    title: "Expert Specialists",
    description: "Board-certified physicians across 30+ medical specialties"
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Round-the-clock emergency and critical care services"
  },
  {
    icon: Heart,
    title: "Patient-Centered Care",
    description: "Personalized treatment plans focused on your unique needs"
  }
];

const services = [
  {
    icon: Heart,
    title: "Cardiology",
    description: "Comprehensive heart care with advanced diagnostic and treatment options"
  },
  {
    icon: Users,
    title: "Primary Care",
    description: "Regular check-ups, preventive care, and chronic disease management"
  },
  {
    icon: Calendar,
    title: "Online Consultations",
    description: "Virtual appointments with specialists from the comfort of your home"
  },
  {
    icon: Shield,
    title: "Emergency Care",
    description: "Immediate medical attention for urgent health concerns"
  },
  {
    icon: Star,
    title: "Specialized Surgery",
    description: "Minimally invasive procedures with faster recovery times"
  },
  {
    icon: Clock,
    title: "24/7 Pharmacy",
    description: "Round-the-clock access to medications and pharmaceutical care"
  }
];

const testimonials = [
  {
    quote: "The care I received at NexusHealth was exceptional. The doctors took time to explain everything and made me feel comfortable throughout my treatment.",
    name: "Sarah Johnson",
    initials: "SJ",
    condition: "Cardiology Patient"
  },
  {
    quote: "From booking to consultation, everything was seamless. The online portal made it so easy to manage my appointments and health records.",
    name: "Michael Chen",
    initials: "MC",
    condition: "Orthopedics Patient"
  },
  {
    quote: "The emergency team saved my life. Their quick response and expert care made all the difference. Forever grateful to NexusHealth.",
    name: "Robert Davis",
    initials: "RD",
    condition: "Emergency Care Patient"
  }
];