import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Satellite, AlertTriangle, Brain, Database, Globe, Shield } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
              <Satellite className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              Orbital Collision Monitoring System
            </h1>
            <p className="text-xl text-muted-foreground text-balance leading-relaxed">
              Advanced satellite tracking and collision prediction using AI-powered analysis of Space-Track.org data
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Data sourced from{' '}
              <a
                href="https://www.space-track.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Space-Track.org
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comprehensive Space Situational Awareness</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Monitor orbital objects, predict collisions, and generate AI-powered maneuver plans
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <Globe className="w-10 h-10 text-primary mb-2" />
                <CardTitle>3D Orbit Visualization</CardTitle>
                <CardDescription>
                  Real-time 3D visualization of satellite orbits using TLE data from Space-Track
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Interactive 3D viewer powered by React Three Fiber displays satellite positions and orbital paths in real-time
              </CardContent>
            </Card>

            <Card>
              <AlertTriangle className="w-10 h-10 text-primary mb-2 ml-6 mt-6" />
              <CardHeader>
                <CardTitle>Collision Detection</CardTitle>
                <CardDescription>
                  Advanced algorithms analyze Space-Track CDM data to identify potential collisions
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Automated detection of conjunction events with configurable time horizons and distance thresholds
              </CardContent>
            </Card>

            <Card>
              <Brain className="w-10 h-10 text-primary mb-2 ml-6 mt-6" />
              <CardHeader>
                <CardTitle>AI-Powered Maneuvers</CardTitle>
                <CardDescription>
                  Mistral AI generates optimal collision avoidance maneuver plans
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Get detailed delta-V calculations, execution timing, and alternative options for each collision scenario
              </CardContent>
            </Card>

            <Card>
              <Database className="w-10 h-10 text-primary mb-2 ml-6 mt-6" />
              <CardHeader>
                <CardTitle>TLE Data Management</CardTitle>
                <CardDescription>
                  Comprehensive database of Two-Line Element sets from Space-Track.org
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Store and manage historical TLE data with automatic orbital propagation using satellite.js
              </CardContent>
            </Card>

            <Card>
              <Shield className="w-10 h-10 text-primary mb-2 ml-6 mt-6" />
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>
                  Multi-level risk classification based on miss distance and relative velocity
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Automatic categorization of collision risks as LOW, MEDIUM, HIGH, or CRITICAL with actionable alerts
              </CardContent>
            </Card>

            <Card>
              <Satellite className="w-10 h-10 text-primary mb-2 ml-6 mt-6" />
              <CardHeader>
                <CardTitle>LSTM Predictions</CardTitle>
                <CardDescription>
                  Machine learning models predict future satellite trajectories
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Python-based LSTM models enhance prediction accuracy beyond standard SGP4 propagation
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Data Source Section */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Powered by Space-Track.org</CardTitle>
                <CardDescription>
                  Official source of Two-Line Element sets and Conjunction Data Messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This system uses orbital data from{' '}
                  <a
                    href="https://www.space-track.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Space-Track.org
                  </a>
                  , the official repository of space object catalog data maintained by the U.S. Space Force. 
                  Space-Track provides TLE data, Conjunction Data Messages (CDM), and satellite catalog information 
                  essential for space situational awareness.
                </p>
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-medium mb-2">To use this system:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Create a free account at Space-Track.org</li>
                    <li>Download TLE data or access their API</li>
                    <li>Import the data through our dashboard</li>
                    <li>Monitor collisions and generate maneuver plans</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Monitor Space?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Start tracking satellites and preventing collisions with AI-powered insights
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup">Create Free Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>Orbital Collision Monitoring System</p>
            <p>
              Data from{' '}
              <a
                href="https://www.space-track.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Space-Track.org
              </a>{' '}
              | AI by{' '}
              <a
                href="https://mistral.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Mistral AI
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
