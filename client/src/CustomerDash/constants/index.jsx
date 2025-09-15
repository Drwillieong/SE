import { Home, NotepadText, Settings, Users } from "lucide-react";

export const navbarLinks = [
    {
        title: "Customer Dashboard",
        links: [
            {
                label: "Booking",
                icon: Users,
                path: "/customer-dashboard/booking",
            },
            {
                label: "Schedule Order",
                icon: NotepadText,
                path: "/customer-dashboard/schedule-order",
            },
            {
                label: "Order History",
                icon: NotepadText,
                path: "/customer-dashboard/history",
            },
            {
                label: "Profile",
                icon: Settings,
                path: "/customer-dashboard/profile",
            },
        ],
    },
];
