import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { ModeToggle } from '../ui/mode-toggle';
import CurrencySelector, { CurrencyProvider } from '../ui/currency-selector';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  PiggyBank, 
  CreditCard, 
  PieChart,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <CurrencyProvider>
      <div className="relative flex h-screen overflow-hidden">
        {/* Mobile menu toggle button - only visible on small screens */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-primary/10 text-primary"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Overlay to close sidebar when clicking outside on mobile */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={toggleSidebar}
          ></div>
        )}

        {/* Sidebar - responsive with animation */}
        <div 
          className={`fixed md:static z-40 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } w-64 bg-secondary/30 border-r p-4 flex flex-col h-screen`}
        >
          <div className="mb-8 px-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Financial Tracker</h2>
            <button 
              className="md:hidden text-muted-foreground" 
              onClick={toggleSidebar}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="space-y-2 flex-grow overflow-y-auto">
            <Button 
              variant={isActive('/') ? 'secondary' : 'ghost'}
              className="w-full justify-start" 
              asChild
              onClick={closeSidebarOnMobile}
            >
              <Link to="/" className="flex items-center gap-2">
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
            </Button>
            <Button 
              variant={isActive('/assets') ? 'secondary' : 'ghost'}
              className="w-full justify-start" 
              asChild
              onClick={closeSidebarOnMobile}
            >
              <Link to="/assets" className="flex items-center gap-2">
                <PiggyBank size={18} />
                Assets
              </Link>
            </Button>
            <Button 
              variant={isActive('/debts') ? 'secondary' : 'ghost'} 
              className="w-full justify-start" 
              asChild
              onClick={closeSidebarOnMobile}
            >
              <Link to="/debts" className="flex items-center gap-2">
                <CreditCard size={18} />
                Debts
              </Link>
            </Button>
            <Button 
              variant={isActive('/net-worth') ? 'secondary' : 'ghost'} 
              className="w-full justify-start" 
              asChild
              onClick={closeSidebarOnMobile}
            >
              <Link to="/net-worth" className="flex items-center gap-2">
                <PieChart size={18} />
                Net Worth
              </Link>
            </Button>
          </nav>
          
          {/* User info and account section */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 px-2 mb-2">
              <User size={18} className="text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate">{user?.email}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive" 
              onClick={() => {
                handleSignOut();
                closeSidebarOnMobile();
              }}
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
          
          <div className="p-2 flex items-center gap-2 mt-4">
            <CurrencySelector />
            <ModeToggle />
          </div>
        </div>

        {/* Main content - adjusted padding for mobile */}
        <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </CurrencyProvider>
  );
};

export default Layout;