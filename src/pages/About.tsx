import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Target, Lightbulb, Award, ArrowRight } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To empower businesses with intelligent automation and cutting-edge web solutions that drive growth and efficiency.'
    },
    {
      icon: Lightbulb,
      title: 'Our Vision',
      description: 'To be the leading AI automation and web development partner for businesses ready to embrace the future of technology.'
    },
    {
      icon: Award,
      title: 'Our Values',
      description: 'Innovation, integrity, and client success drive everything we do. We believe in transparent communication and delivering exceptional results.'
    }
  ];

  const team = [
    {
      name: 'Alex Thompson',
      role: 'CEO & Founder',
      bio: 'Former Google AI engineer with 10+ years in machine learning and automation.',
      avatar: 'AT'
    },
    {
      name: 'Sarah Kim',
      role: 'CTO',
      bio: 'Full-stack architect specializing in scalable web applications and cloud infrastructure.',
      avatar: 'SK'
    },
    {
      name: 'David Rodriguez',
      role: 'Lead AI Engineer',
      bio: 'PhD in Computer Science, expert in natural language processing and predictive analytics.',
      avatar: 'DR'
    },
    {
      name: 'Emily Chen',
      role: 'Head of Design',
      bio: 'Award-winning UX designer with a passion for creating intuitive, beautiful interfaces.',
      avatar: 'EC'
    }
  ];

  const openPositions = [
    { title: 'Senior AI Engineer', type: 'Full-time', location: 'Remote' },
    { title: 'React Developer', type: 'Full-time', location: 'San Francisco' },
    { title: 'DevOps Engineer', type: 'Contract', location: 'Remote' }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-24 hero-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
              About <span className="text-gradient">TechFlow</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-3xl mx-auto">
              We're a team of passionate technologists dedicated to transforming businesses 
              through AI automation and innovative web development.
            </p>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="card-shadow hover:elevated-shadow transition-smooth text-center">
                  <CardHeader>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent/20 to-neon/20 flex items-center justify-center">
                      <value.icon className="w-8 h-8 text-accent" />
                    </div>
                    <CardTitle className="text-xl font-bold text-primary">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                Meet Our <span className="text-gradient">Team</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Industry experts and innovators working together to deliver exceptional results.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <Card key={index} className="card-shadow hover:elevated-shadow transition-smooth text-center">
                  <CardHeader>
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-neon flex items-center justify-center text-primary font-bold text-xl">
                      {member.avatar}
                    </div>
                    <CardTitle className="text-lg font-bold text-primary">{member.name}</CardTitle>
                    <p className="text-accent font-medium">{member.role}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Careers Section */}
        <section className="py-24 bg-background" id="careers">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                Join Our <span className="text-gradient">Team</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We're always looking for talented individuals who share our passion for innovation.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="space-y-4 mb-12">
                {openPositions.map((position, index) => (
                  <Card key={index} className="card-shadow hover:elevated-shadow transition-smooth">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-primary mb-1">{position.title}</h3>
                          <p className="text-muted-foreground text-sm">{position.type} • {position.location}</p>
                        </div>
                        <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-primary">
                          Apply Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                <p className="text-muted-foreground mb-6">
                  Don't see the perfect role? We'd still love to hear from you.
                </p>
                <Button className="bg-gradient-to-r from-accent to-neon text-primary">
                  Send Us Your Resume
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;