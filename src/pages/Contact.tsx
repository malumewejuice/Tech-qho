import { useEffect, useState } from 'react';

// Declare vapi-widget as a custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'vapi-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'assistant-id'?: string;
        'public-key'?: string;
      };
    }
  }
}
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ChatSupport from '@/components/ChatSupport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
const Contact = () => {
  const [showVapiWidget, setShowVapiWidget] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: ''
  });

  // Removed the problematic scroll-to-top on click behavior

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (formData.firstName && formData.lastName && formData.email && formData.message) {
      setShowVapiWidget(true);
    }
  };

  useEffect(() => {
    if (showVapiWidget) {
      // Wait for Vapi script to load before creating widget
      const checkVapiLoaded = () => {
        if (typeof customElements !== 'undefined' && customElements.get('vapi-widget')) {
          // Create and append the vapi-widget element dynamically
          const widget = document.createElement('vapi-widget');
          widget.setAttribute('assistant-id', '90ab676f-af48-41df-848a-c6c039b26cd1');
          widget.setAttribute('public-key', 'bda40335-5f87-4a5b-9833-ad7b178e0162');
          widget.style.position = 'fixed';
          widget.style.zIndex = '50';
          document.body.appendChild(widget);
          
          // Auto-start the widget
          setTimeout(() => {
            const vapiWidget = document.querySelector('vapi-widget') as any;
            if (vapiWidget && vapiWidget.start) {
              vapiWidget.start();
            }
          }, 100);
        } else {
          // Retry after a short delay if script not loaded yet
          setTimeout(checkVapiLoaded, 100);
        }
      };
      
      checkVapiLoaded();

      return () => {
        // Cleanup - remove the widget when component unmounts or state changes
        const existingWidget = document.querySelector('vapi-widget');
        if (existingWidget) {
          existingWidget.remove();
        }
      };
    }
  }, [showVapiWidget]);
  return <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-24 hero-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
              Contact <span className="text-gradient">Us</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-3xl mx-auto">
              Ready to transform your business? Get in touch with our team of experts 
              and let's discuss your next project.
            </p>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-primary">Request a Quote</CardTitle>
                  <p className="text-muted-foreground">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            id="firstName" 
                            placeholder="John" 
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName" 
                            placeholder="Doe" 
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="john@company.com" 
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          type="tel" 
                          placeholder="+27 78 706 3495" 
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input 
                          id="company" 
                          placeholder="Your Company" 
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="service">Service Interested In</Label>
                        <Select value={formData.service} onValueChange={(value) => handleInputChange('service', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ai-automation">AI Automation</SelectItem>
                            <SelectItem value="web-development">Web Development</SelectItem>
                            <SelectItem value="both">Both Services</SelectItem>
                            <SelectItem value="consultation">Consultation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="message">Project Details</Label>
                        <Textarea 
                          id="message" 
                          placeholder="Tell us about your project, goals, and any specific requirements..." 
                          rows={4} 
                          value={formData.message}
                          onChange={(e) => handleInputChange('message', e.target.value)}
                          required
                        />
                      </div>
                      
                      <Button type="submit" className="w-full bg-gradient-to-r from-accent to-neon text-primary">
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="space-y-8">
                <Card className="card-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-primary">Get in Touch</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-neon/20 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary">Email</h3>
                        <p className="text-muted-foreground">Techqho@outlook.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-neon/20 flex items-center justify-center">
                        <Phone className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary">Phone</h3>
                        <p className="text-muted-foreground">061 512 6221</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-neon/20 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary">Address</h3>
                        <p className="text-muted-foreground">
                          240 Apex street<br />
                          Johannesburg,2091
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-neon/20 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary">Business Hours</h3>
                        <p className="text-muted-foreground">
                          Mon - Fri: 9:00 AM - 6:00 PM GMT<br />
                          Sat - Sun: Emergency support only
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Map Placeholder */}
                <Card className="card-shadow">
                  <CardContent className="p-0">
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-accent mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Johannesburg South</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Contact Options */}
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-primary">
                    Schedule Call
                  </Button>
                  <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-primary">
                    Live Chat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Ready to Get <span className="text-gradient">Started?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Join hundreds of companies that have transformed their business with our solutions.
            </p>
            <Button size="lg" className="bg-gradient-to-r from-accent to-neon text-primary px-8">
              Start Your Project Today
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      <ChatSupport />
      
      {/* Overlay for Vapi Widget */}
      {showVapiWidget && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={() => setShowVapiWidget(false)}
        />
      )}
    </div>;
};
export default Contact;