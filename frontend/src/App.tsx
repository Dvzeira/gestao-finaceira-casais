import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '@/features/auth/auth-context';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { AppLayout } from '@/components/shared/app-layout';
import { LoginPage } from '@/routes/login-page';
import { RegisterPage } from '@/routes/register-page';
import { DashboardPage } from '@/routes/dashboard-page';
import { IncomesPage } from '@/routes/incomes-page';
import { ExpensesPage } from '@/routes/expenses-page';
import { GoalsPage } from '@/routes/goals-page';
import { GoalDetailPage } from '@/routes/goal-detail-page';
import { ReportsPage } from '@/routes/reports-page';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/incomes" element={<IncomesPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/goals/:id" element={<GoalDetailPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
