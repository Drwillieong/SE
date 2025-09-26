import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/Login";
import NewAccountSetup from "./pages/NewAccountSetup";
import Layout from "./Dash/routes/layout";
import DashboardPage from "./Dash/routes/dashboard/Dashboard";
import OrderManagement from "./Dash/routes/dashboard/OrderManagement";
import Booking from "./Dash/routes/dashboard/Booking";

import BookHistory from "./CustomerDash/routes/dashboard/BookHistory";
import CustomerProfile from "./CustomerDash/routes/dashboard/Profile";
import ScheduleBooking from "./CustomerDash/routes/dashboard/ScheduleBooking";

import AdminHistory from "./Dash/routes/dashboard/AdminHistory";
import AdminSettings from "./Dash/routes/dashboard/AdminSettings";
import CreateOrder from "./Dash/routes/dashboard/CreateOrderNew";
import EditOrder from "./Dash/routes/dashboard/EditOrder";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerDashLayout from "./CustomerDash/routes/layout";
import Analytics from "./Dash/routes/dashboard/AnalyticsDashboard";

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
                    path: "analytics",
                    element: <Analytics />,
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
                    path: "order",
                    element: <OrderManagement />,
                },
                {
                    path: "settings",
                    element: <AdminSettings />,
                },
                {
                    path: "create-order",
                    element: <CreateOrder />,
                },
                {
                    path: "edit-order/:id",
                    element: <EditOrder />,
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
                    element: <ScheduleBooking />,
                },
                {
                    path: "schedule-booking",
                    element: <ScheduleBooking />,
                },
                {
                    path: "history",
                    element: <BookHistory />,
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
