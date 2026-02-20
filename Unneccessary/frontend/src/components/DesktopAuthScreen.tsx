import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { cn } from '../lib/utils';

interface DesktopAuthScreenProps {
  onLogin: (role: 'customer' | 'vendor') => void;
}

export function DesktopAuthScreen({ onLogin }: DesktopAuthScreenProps) {
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'vendor'>('customer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(userType);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb21wbGV4JTIwYm9va2luZ3xlbnwxfHx8fDE3NTkzMDI5MzF8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Sports venue booking"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6">Welcome to BookForMe</h1>
            <p className="text-xl mb-8 opacity-90">
              Discover and book amazing venues across the city. From sports courts to gaming zones, 
              we've got you covered.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  ✓
                </div>
                <span>1000+ verified venues</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  ✓
                </div>
                <span>Instant booking confirmation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  ✓
                </div>
                <span>AI-powered recommendations</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  ✓
                </div>
                <span>Community features & match-making</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              B
            </div>
            <h2 className="text-2xl font-bold">BookForMe</h2>
            <p className="text-muted-foreground">Your venue booking companion</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Welcome Back!</CardTitle>
                  <CardDescription>
                    Sign in to your account to continue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* User Type Selection */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={userType === 'customer' ? 'default' : 'outline'}
                        onClick={() => setUserType('customer')}
                        className={cn(
                          "flex items-center gap-2 transition-all duration-200",
                          "hover:bg-primary hover:text-primary-foreground",
                          "focus:bg-primary focus:text-primary-foreground",
                          "active:bg-primary active:text-primary-foreground",
                          userType === 'customer' 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <User size={16} className="flex-shrink-0" />
                        <span className="font-medium">Customer</span>
                      </Button>
                      <Button
                        type="button"
                        variant={userType === 'vendor' ? 'default' : 'outline'}
                        onClick={() => setUserType('vendor')}
                        className={cn(
                          "flex items-center gap-2 transition-all duration-200",
                          "hover:bg-primary hover:text-primary-foreground",
                          "focus:bg-primary focus:text-primary-foreground",
                          "active:bg-primary active:text-primary-foreground",
                          userType === 'vendor' 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Building2 size={16} className="flex-shrink-0" />
                        <span className="font-medium">Venue Owner</span>
                      </Button>
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        type="email"
                        placeholder="Email address"
                        className="pl-10"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember" />
                        <label htmlFor="remember" className="text-sm cursor-pointer">
                          Remember me
                        </label>
                      </div>
                      <Button variant="link" className="text-sm p-0">
                        Forgot password?
                      </Button>
                    </div>

                    <Button type="submit" className="w-full">
                      Sign In
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join thousands of users booking venues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* User Type Selection */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={userType === 'customer' ? 'default' : 'outline'}
                        onClick={() => setUserType('customer')}
                        className={cn(
                          "flex items-center gap-2 transition-all duration-200",
                          "hover:bg-primary hover:text-primary-foreground",
                          "focus:bg-primary focus:text-primary-foreground",
                          "active:bg-primary active:text-primary-foreground",
                          userType === 'customer' 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <User size={16} className="flex-shrink-0" />
                        <span className="font-medium">Customer</span>
                      </Button>
                      <Button
                        type="button"
                        variant={userType === 'vendor' ? 'default' : 'outline'}
                        onClick={() => setUserType('vendor')}
                        className={cn(
                          "flex items-center gap-2 transition-all duration-200",
                          "hover:bg-primary hover:text-primary-foreground",
                          "focus:bg-primary focus:text-primary-foreground",
                          "active:bg-primary active:text-primary-foreground",
                          userType === 'vendor' 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Building2 size={16} className="flex-shrink-0" />
                        <span className="font-medium">Venue Owner</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="text"
                        placeholder="First name"
                        required
                      />
                      <Input
                        type="text"
                        placeholder="Last name"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        type="email"
                        placeholder="Email address"
                        className="pl-10"
                        required
                      />
                    </div>

                    <Input
                      type="tel"
                      placeholder="Phone number"
                      required
                    />

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" required />
                      <label htmlFor="terms" className="text-sm cursor-pointer">
                        I agree to the{' '}
                        <Button variant="link" className="text-sm p-0 h-auto">
                          Terms of Service
                        </Button>
                        {' '}and{' '}
                        <Button variant="link" className="text-sm p-0 h-auto">
                          Privacy Policy
                        </Button>
                      </label>
                    </div>

                    <Button type="submit" className="w-full">
                      Create Account
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-50 px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button 
                variant="outline" 
                className={cn(
                  "w-full transition-all duration-200",
                  "hover:bg-red-50 hover:border-red-200 hover:text-red-700",
                  "focus:bg-red-50 focus:border-red-200 focus:text-red-700",
                  "active:bg-red-100 active:border-red-300",
                  "dark:hover:bg-red-950 dark:hover:border-red-800 dark:hover:text-red-300",
                  "dark:focus:bg-red-950 dark:focus:border-red-800 dark:focus:text-red-300"
                )}
                onClick={() => {
                  // TODO: Implement Google OAuth
                  console.log('Google login clicked');
                }}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium">Google</span>
              </Button>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full transition-all duration-200",
                  "hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700",
                  "focus:bg-blue-50 focus:border-blue-200 focus:text-blue-700",
                  "active:bg-blue-100 active:border-blue-300",
                  "dark:hover:bg-blue-950 dark:hover:border-blue-800 dark:hover:text-blue-300",
                  "dark:focus:bg-blue-950 dark:focus:border-blue-800 dark:focus:text-blue-300"
                )}
                onClick={() => {
                  // TODO: Implement Facebook OAuth
                  console.log('Facebook login clicked');
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="font-medium">Facebook</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
