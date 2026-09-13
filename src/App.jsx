import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/clerk-react";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Insights from "./pages/Insights";
import Analytics from "./pages/Analytics";
import ExpenseInput from "./pages/ExpenseInput";

function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>
        <Navbar />
        {children}
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Home */}
        <Route path="/" element={<Home />} />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Expense Page */}
        <Route
          path="/expense"
          element={
            <ProtectedRoute>
              <ExpenseInput />
            </ProtectedRoute>
          }
        />
        <Route 
        path="/analytics"
        element={
          <SignedIn>
            <Analytics />
          </SignedIn> 
                }
                />

        {/* Protected Insights Page */}
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <Insights />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;