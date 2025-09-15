import React, { useState } from "react";

const AdminHistory = () => {
    const [orders] = useState([
        { id: 1, customer: "John Doe", date: "2023-10-01", service: "Wash & fold", status: "Completed", amount: "₱500" },
        { id: 2, customer: "Jane Smith", date: "2023-09-15", service: "Dry cleaning", status: "Completed", amount: "₱300" },
        { id: 3, customer: "Bob Johnson", date: "2023-08-20", service: "Ironing", status: "Completed", amount: "₱200" }
    ]);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Order History</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
             
            </div>
        </div>
    );
};

export default AdminHistory;
