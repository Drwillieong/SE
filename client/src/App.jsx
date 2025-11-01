import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/Login";
import NewAccountSetup from "./pages/NewAccountSetup";
import Layout from "./features/admin/routes/layout";
import DashboardPage from "./features/admin/routes/dashboard/Dashboard";
import OrderManagement from "./features/admin/routes/dashboard/OrderManagement";
import Booking from "./features/admin/routes/dashboard/Booking";

import BookHistory from "./features/customer/routes/dashboard/BookHistory";
import CustomerProfile from "./features/customer/routes/dashboard/Profile";
import ScheduleBooking from "./features/customer/routes/dashboard/ScheduleBooking";

import AdminHistory from "./features/admin/routes/dashboard/AdminHistory";
import AdminSettings from "./features/admin/routes/dashboard/AdminSettings";
import CreateOrder from "./features/admin/components/CreateOrder";
import EditOrder from "./features/admin/components/EditOrder";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerDashLayout from "./features/customer/routes/layout";
import Analytics from "./features/admin/routes/dashboard/AnalyticsDashboard";

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
                    element: <Analytics />,
                },
                  {   
                    path: "analytics",
                    index: true,
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
