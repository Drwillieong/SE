import { ChartColumn, Home, NotepadText, Settings, Users } from "lucide-react";




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

