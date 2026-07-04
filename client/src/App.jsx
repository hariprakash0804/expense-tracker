import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budget from './pages/Budget';
import Analytics from './pages/Analytics';
import Recurring from './pages/Recurring';
import Market from './pages/Market';
import Settings from './pages/Settings';
import Savings from './pages/Savings';
import Income from './pages/Income';
import Projections from './pages/Projections';
import DebtPlanner from './pages/DebtPlanner';
import TaxPlanner from './pages/TaxPlanner';
import BalanceSheet from './pages/BalanceSheet';
import Achievements from './pages/Achievements';
import Portfolio from './pages/Portfolio';
import BillSplitter from './pages/BillSplitter';
import Calculators from './pages/Calculators';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/income" element={<Income />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/budget" element={<Budget />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/recurring" element={<Recurring />} />
                  <Route path="/savings" element={<Savings />} />
                  <Route path="/market" element={<Market />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/projections" element={<Projections />} />
                  <Route path="/debt" element={<DebtPlanner />} />
                  <Route path="/tax" element={<TaxPlanner />} />
                  <Route path="/balance-sheet" element={<BalanceSheet />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/split" element={<BillSplitter />} />
                  <Route path="/calculators" element={<Calculators />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
