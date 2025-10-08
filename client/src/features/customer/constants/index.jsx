import { NotepadText ,Clock,User2 } from "lucide-react";

export const navbarLinks = [
    {
        title: "Customer Dashboard",
        links: [
           
            {
                label: "Schedule Booking",
                icon: NotepadText,
                path: "/customer-dashboard/schedule-booking",
            },
            {
                label: "Booking History",
                icon: Clock,
                path: "/customer-dashboard/history",
            },
            {
                label: "Profile",
                icon: User2,
                path: "/customer-dashboard/profile",
            },
        ],
    },
];
