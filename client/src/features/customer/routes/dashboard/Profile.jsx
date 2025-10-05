import React, { useEffect, useState } from "react";
import axios from "axios";

const calambaBarangays = [
  "Banlic", "Barandal", "Batino", "Banadero", "Bubuyan", "Bucal", "Bunggo", 
  "Burol", "Camaligan", "Canlubang", "Halang", "Hornalan", 
  "Kay-Anlog", "La Mesa", "Laguerta", "Lawa", "Lecheria", 
  "Lingga", "Looc", "Mabato", "Majada Labas", "Makiling", 
  "Mapagong", "Masili", "Maunong", "Mayapa", "Paciano Rizal", 
  "Palingon", "Palo-Alto", "Pansol", "Parian", "Prinza", 
  "Punta", "Puting Lupa", "Real", "Saimsim", "Sampiruhan", 
  "San Cristobal", "San Jose", "San Juan", "Sirang Lupa", 
  "Sucol", "Turbina", "Ulango", "Uwisan"
];

const  Profile = () => {
    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        contact: "",
        email: "",
        barangay: "",
        street: "",
        blockLot: "",
        landmark: "",
    });
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user profile on component mount
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:8800/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data) {
                    console.log("Profile fetch response data:", response.data);
                    setProfile({
                        firstName: response.data.firstName || "",
                        lastName: response.data.lastName || "",
                        contact: response.data.contact || "",
                        email: response.data.email || "",
                        barangay: response.data.barangay || "",
                        street: response.data.street || "",
                        blockLot: response.data.blockLot || "",
                        landmark: response.data.landmark || "",
                    });
                }
            } catch (err) {
                setError("Failed to load profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        try {
            const token = localStorage.getItem("token");
            const response = await axios.put(
                "http://localhost:8800/auth/users/profile",
                profile,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (response.data.success) {
                setMessage("Profile updated successfully.");
                setIsEditing(false);
            } else {
                setError("Failed to update profile.");
            }
        } catch (err) {
            setError("Error updating profile.");
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        if (passwords.newPassword !== passwords.confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://localhost:8800/auth/change-password",
                {
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (response.data.message === "Password changed successfully") {
                setMessage("Password changed successfully.");
                setPasswords({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
            } else {
                setError(response.data.message || "Failed to change password.");
            }
        } catch (err) {
            setError("Error changing password.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-2 py-8 max-w-6xl">
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                {message && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Profile Information */}
                <div className="space-y-6">
                    <div className="border-b pb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
                        
                        {isEditing ? (
                            <form onSubmit={handleProfileSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={profile.firstName}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={profile.lastName}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profile.email}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                                        <input
                                            type="tel"
                                            name="contact"
                                            value={profile.contact}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <h2 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Address Information</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Street address</label>
                                        <input
                                            type="text"
                                            name="street"
                                            value={profile.street}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                                        <select
                                            name="barangay"
                                            value={profile.barangay}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                                        >
                                            <option value="">Select Barangay</option>
                                            {calambaBarangays.map(barangay => (
                                                <option key={barangay} value={barangay}>{barangay}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Block/Lot (optional)</label>
                                        <input
                                            type="text"
                                            name="blockLot"
                                            value={profile.blockLot}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Landmark (optional)</label>
                                        <input
                                            type="text"
                                            name="landmark"
                                            value={profile.landmark}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-gray-500">First name</p>
                                        <p className="text-gray-800 font-medium">{profile.firstName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Last name</p>
                                        <p className="text-gray-800 font-medium">{profile.lastName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="text-gray-800 font-medium">{profile.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone number</p>
                                        <p className="text-gray-800 font-medium">{profile.contact || "Not provided"}</p>
                                    </div>
                                </div>
                                
                                <h2 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Address</h2>
                                
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Street address</p>
                                        <p className="text-gray-800 font-medium">{profile.street || "Not provided"}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Barangay</p>
                                            <p className="text-gray-800 font-medium">{profile.barangay || "Not provided"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Block/Lot</p>
                                            <p className="text-gray-800 font-medium">{profile.blockLot || "Not provided"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Landmark</p>
                                            <p className="text-gray-800 font-medium">{profile.landmark || "Not provided"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Change Password Section */}
                <div className="mt-12">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h2>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwords.currentPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwords.newPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                                required
                                minLength="6"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwords.confirmPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                                required
                                minLength="6"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                        >
                            Update Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;