import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/Login";
import NewAccountSetup from "./pages/NewAccountSetup";
import Layout from "./Dash/routes/layout";
import DashboardPage from "./Dash/routes/dashboard/Dashboard";
import OrderManagement from "./Dash/routes/dashboard/OrderManagement";
import Booking from "./Dash/routes/dashboard/Booking";
import CustomerBooking from "./CustomerDash/routes/dashboard/Booking";
import CustomerHistory from "./CustomerDash/routes/dashboard/OrderHistory";
import CustomerProfile from "./CustomerDash/routes/dashboard/Profile";
import CustomerScheduleOrder from "./CustomerDash/routes/dashboard/ScheduleOrder";

import AdminHistory from "./Dash/routes/dashboard/AdminHistory";
import AdminSettings from "./Dash/routes/dashboard/AdminSettings";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerDashLayout from "./CustomerDash/routes/layout";

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <HomePage />,
        },
        {
            path: "/login",
            element: <LoginPage />,
        },
         {
            path: "/reset-password",
            element: <ResetPassword />,
        },

        {
            path: "/newaccountsetup",
            element: <NewAccountSetup />,
        },

        {
            path: "/dashboard",
            element: (
                <ProtectedRoute requiredRole="admin">
                    <Layout />
                </ProtectedRoute>
            ),
            children: [
                {
                    index: true,
                    element: <DashboardPage />,
                },
                {
                    path: "order",
                    element: <OrderManagement />,
                },
                {
                    path: "booking-dash",
                    element: <Booking />,
                },
                {
                    path: "history",
                    element: <AdminHistory />,
                },
                {
                    path: "settings",
                    element: <AdminSettings />,
                },
            ],
        },
        {
            path: "/customer-dashboard",
            element: (
                <ProtectedRoute requiredRole="user">
                    <CustomerDashLayout />
                </ProtectedRoute>
            ),
            children: [
                {
                    index: true,
                    element: <CustomerBooking />,
                },
                {
                    path: "booking",
                    element: <CustomerBooking />,
                },
                {
                    path: "schedule-order",
                    element: <CustomerScheduleOrder />,
                },
                {
                    path: "history",
                    element: <CustomerHistory />,
                },
                {
                    path: "profile",
                    element: <CustomerProfile />,
                },
            ],
        },
    ]);

    return (
        <>
            <RouterProvider router={router} />
        </>
    );
}

export default App;
