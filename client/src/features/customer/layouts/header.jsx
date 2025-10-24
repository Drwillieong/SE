import { useNavigate } from "react-router-dom";
import { ChevronsLeft, ChevronDown, User, LogOut } from "lucide-react";
import PropTypes from "prop-types";
import { useState, useRef, useEffect } from "react";
import apiClient from "../../../utils/axios";


const Header = ({ collapsed, setCollapsed }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const userRes = await apiClient.get('/auth/me');
                setUserData(userRes.data);
            } catch (error) {
                console.error('Error fetching user data:', error);
                navigate('/login');
            }
        };
        fetchUserData();
    }, [navigate]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="relative z-10 flex h-[60px] items-center justify-between bg-pink-500 px-4 shadow-md">
            <div className="flex items-center gap-x-3">
                <button
                    className="btn-ghost size-10"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronsLeft className={collapsed ? "rotate-180" : ""} />
                </button>
            </div>
            <div className="flex items-center gap-x-3">
                <div className="relative" ref={dropdownRef}>
                    <button
                        className="flex items-center gap-2 rounded-md p-2 text-white hover:bg-pink-600"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <User size={20} />
                        {userData && (
                            <span className="text-sm font-medium">{userData.firstName} {userData.lastName}</span>
                        )}
                        <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">

                            <button
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-100"
                                onClick={() => {
                                    // Clear authentication data
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user');
                                    // Clear any cookies
                                    document.cookie.split(";").forEach((c) => {
                                        document.cookie = c
                                            .replace(/^ +/, "")
                                            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                                    });

                                    setDropdownOpen(false);
                                    navigate('/login');
                                }}
                            >
                                <LogOut size={16} />
                                <span>Log out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

Header.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
};

export default Header;
