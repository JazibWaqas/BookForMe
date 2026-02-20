import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/sonner';
import { DesktopAuthScreen } from './components/DesktopAuthScreen';
import { ResponsiveLayout } from './components/ResponsiveLayout';
import { DesktopHomeScreen } from './components/DesktopHomeScreen';
import { DesktopVenuesScreen } from './components/DesktopVenuesScreen';
import { DesktopVenueDetailScreen } from './components/DesktopVenueDetailScreen';
import { BookingConfirmationScreen } from './components/BookingConfirmationScreen';
import { BookingSuccessScreen } from './components/BookingSuccessScreen';
import { DesktopChatbotScreen } from './components/DesktopChatbotScreen';
import { SocialScreen } from './components/SocialScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { NotificationsScreen } from './components/NotificationsScreen';
import { VendorDashboardLayout } from './components/VendorDashboardLayout';
import { VendorDashboardHome } from './components/VendorDashboardHome';
import { VendorCalendarScreen } from './components/VendorCalendarScreen';
import { VendorBookingsScreen } from './components/VendorBookingsScreen';
import { VendorIntegrationsScreen } from './components/VendorIntegrationsScreen';
import { VendorProfileScreen } from './components/VendorProfileScreen';
import type { Screen, AppState } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    currentScreen: 'auth',
    user: {
      isAuthenticated: false,
      role: null
    },
    screenData: null
  });

  const handleLogin = (role: 'customer' | 'vendor') => {
    setAppState(prev => ({
      ...prev,
      user: {
        isAuthenticated: true,
        role
      },
      // Redirect to appropriate dashboard based on role
      currentScreen: role === 'vendor' ? 'vendor-dashboard' : 'home'
    }));
  };

  const handleNavigation = (screen: Screen, data?: any) => {
    setAppState(prev => ({
      ...prev,
      currentScreen: screen,
      screenData: data
    }));
  };

  const handleBack = () => {
    // Simple back navigation logic
    switch (appState.currentScreen) {
      case 'venues':
        handleNavigation('home');
        break;
      case 'venue-detail':
        handleNavigation('venues', appState.screenData?.category);
        break;
      case 'booking-confirmation':
        handleNavigation('venue-detail', appState.screenData);
        break;
      case 'booking-success':
        handleNavigation('home');
        break;
      default:
        handleNavigation(appState.user.role === 'vendor' ? 'vendor-dashboard' : 'home');
    }
  };

  const handleLogout = () => {
    setAppState({
      currentScreen: 'auth',
      user: {
        isAuthenticated: false,
        role: null
      },
      screenData: null
    });
  };

  const renderCustomerScreen = () => {
    switch (appState.currentScreen) {
      case 'home':
        return <DesktopHomeScreen onNavigate={handleNavigation} />;
      
      case 'venues':
        return (
          <DesktopVenuesScreen
            category={appState.screenData?.category}
            onVenueSelect={(venue) => handleNavigation('venue-detail', { venue, category: appState.screenData?.category })}
          />
        );
      
      case 'venue-detail':
        return (
          <DesktopVenueDetailScreen
            venue={appState.screenData?.venue}
            onBack={handleBack}
            onNavigate={handleNavigation}
          />
        );
      
      case 'booking-confirmation':
        return (
          <BookingConfirmationScreen
            venue={appState.screenData?.venue}
            service={appState.screenData?.service}
            selectedDate={appState.screenData?.date}
            selectedTime={appState.screenData?.time}
            onBack={handleBack}
            onSuccess={(bookingId) => handleNavigation('booking-success', { 
              ...appState.screenData, 
              bookingId 
            })}
          />
        );
      
      case 'booking-success':
        return (
          <BookingSuccessScreen
            bookingId={appState.screenData?.bookingId}
            venue={appState.screenData?.venue}
            date={appState.screenData?.date}
            time={appState.screenData?.time}
            customerName={appState.screenData?.customerName || 'Customer'}
            customerPhone={appState.screenData?.customerPhone || '+92 300 0000000'}
            onNavigateHome={() => handleNavigation('home')}
            onViewProfile={() => handleNavigation('profile')}
          />
        );
      
      case 'chatbot':
        return <DesktopChatbotScreen onNavigate={handleNavigation} />;
      
      case 'social':
        return <SocialScreen onNavigate={handleNavigation} />;
      
      case 'profile':
        return (
          <ProfileScreen
            userRole={appState.user.role!}
            onNavigate={handleNavigation}
          />
        );
      
      case 'notifications':
        return <NotificationsScreen onNavigate={handleNavigation} />;
      
      default:
        return <DesktopHomeScreen onNavigate={handleNavigation} />;
    }
  };

  const renderVendorScreen = () => {
    switch (appState.currentScreen) {
      case 'vendor-dashboard':
        return <VendorDashboardHome onNavigate={handleNavigation} />;
      
      case 'vendor-calendar':
        return <VendorCalendarScreen onNavigate={handleNavigation} />;
      
      case 'vendor-bookings':
        return <VendorBookingsScreen onNavigate={handleNavigation} />;
      
      case 'vendor-integrations':
        return <VendorIntegrationsScreen onNavigate={handleNavigation} />;
      
      case 'vendor-profile':
        return <VendorProfileScreen onNavigate={handleNavigation} />;
      
      case 'notifications':
        return <NotificationsScreen onNavigate={handleNavigation} />;
      
      default:
        return <VendorDashboardHome onNavigate={handleNavigation} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="size-full">
        {!appState.user.isAuthenticated ? (
          <DesktopAuthScreen onLogin={handleLogin} />
        ) : appState.user.role === 'vendor' ? (
          <VendorDashboardLayout
            currentScreen={appState.currentScreen}
            vendorName="Arena Sports Complex"
            onNavigate={handleNavigation}
            onLogout={handleLogout}
          >
            {renderVendorScreen()}
          </VendorDashboardLayout>
        ) : (
          <ResponsiveLayout
            currentScreen={appState.currentScreen}
            userRole={appState.user.role!}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
          >
            {renderCustomerScreen()}
          </ResponsiveLayout>
        )}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
