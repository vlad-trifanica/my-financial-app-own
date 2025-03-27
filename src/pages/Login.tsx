import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        // Handle sign up
        console.log('Attempting to register with:', email);
        const result = await signUp(email, password);
        console.log('Registration result:', result);
        if (result?.user) {
          // Show confirmation message for email verification if needed
          setError('Registration successful! Please check your email for verification.');
        }
      } else {
        // Handle sign in
        console.log('Attempting to sign in with:', email);
        const result = await signIn(email, password);
        console.log('Sign in result:', result);
        if (result?.user) {
          // Navigate to dashboard after successful login
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl font-bold text-center">
            {isRegistering ? 'Create an Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-center">
            {isRegistering 
              ? 'Sign up for a new account to track your finances' 
              : 'Sign in to your account to continue'}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleAuthentication}>
          <CardContent className="space-y-6 pt-2">
            {error && (
              <div className="p-3 mb-2 text-sm rounded-md bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/30">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" 
                className="h-10"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="h-10"
                required
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col pt-2 pb-6 px-6">
            <Button 
              type="submit" 
              className="w-full h-10 font-medium mb-4" 
              disabled={loading}
            >
              {loading ? 'Processing...' : isRegistering ? 'Sign Up' : 'Sign In'}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              {isRegistering ? (
                <div className="flex items-center justify-center">
                  Already have an account?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto ml-1 font-medium"
                    onClick={() => setIsRegistering(false)}
                  >
                    Sign In
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Don't have an account?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto ml-1 font-medium"
                    onClick={() => setIsRegistering(true)}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;