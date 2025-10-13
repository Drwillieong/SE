import { ChartColumn, Home, NotepadText, Settings, Users } from "lucide-react";




export const navbarLinks = [
    {
        title: "Dashboard",
        links: [
            {
                label: " Analytics Dashboard",
                icon: Home,     
                path: "/dashboard/analytics",
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
           
          
        ],
    },
    
];

