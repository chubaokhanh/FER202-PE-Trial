"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export function Navbar() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    return (
        <header className="border-b bg-background sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link href="/" className="font-bold text-xl tracking-tight text-primary">
                    SpendWise
                </Link>

                <nav className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span data-testid="user-email" className="text-sm font-medium text-muted-foreground">
                                {user.email}
                            </span>
                            <Link
                                href="/expenses"
                                data-testid="link-expenses"
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                            >
                                Expenses
                            </Link>
                            <Button
                                variant="outline"
                                size="sm"
                                data-testid="btn-logout"
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                data-testid="btn-login"
                                onClick={() => router.push("/login")}
                            >
                                Login
                            </Button>
                            <Button
                                size="sm"
                                data-testid="btn-register"
                                onClick={() => router.push("/register")}
                            >
                                Register
                            </Button>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}
