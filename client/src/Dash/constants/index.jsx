import { ChartColumn, Home, NotepadText, Settings, Users } from "lucide-react";

import ProfileImage from "../../assets/pusa.jpeg";
import ProductImage from "../../assets/pusa.jpeg";

export const navbarLinks = [
    {
        title: "Dashboard",
        links: [
            {
                label: "Dashboard",
                icon: Home,     
                path: "/dashboard",
            },
           
            {
                label: "OrderManagement",
                icon: ChartColumn,
                path: "/dashboard/order",
            },
              {
                label: "Analytics",
                icon: Home,     
                path: "/dashboard/analytics",
            },
            {
                label: "Booking",
                icon:  Users,
                path: "/dashboard/booking-dash",
            },
            {
                label: "History",
                icon: NotepadText,
                path: "/dashboard/history",
            },
           
            {
                label: "Settings",
                icon: Settings,
                path: "/dashboard/settings",
            },
        ],
    },
    
];

