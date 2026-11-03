"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [authError, setAuthError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const isValidEmail = (str: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    };

    const validate = (eVal: string, pVal: string) => {
        const errs: { email?: string; password?: string } = {};

        if (!eVal.trim()) {
            errs.email = "Email is required";
        } else if (!isValidEmail(eVal.trim())) {
            errs.email = "Please enter a valid email address";
        }

        if (!pVal) {
            errs.password = "Password is required";
        }

        return errs;
    };

    const handleEmailChange = (val: string) => {
        setEmail(val);
        if (hasSubmitted) {
            const errs = validate(val, password);
            setErrors((prev) => ({ ...prev, email: errs.email }));
        }
    };

    const handlePasswordChange = (val: string) => {
        setPassword(val);
        if (hasSubmitted) {
            const errs = validate(email, val);
            setErrors((prev) => ({ ...prev, password: errs.password }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setHasSubmitted(true);
        setAuthError(null);

        const validationErrors = validate(email, password);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                setAuthError(error.message);
            } else if (data?.user) {
                router.push("/expenses");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred";
            setAuthError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">Log in</CardTitle>
                    <CardDescription>Enter your email and password to access your expenses</CardDescription>
                </CardHeader>
                <CardContent>
                    <form noValidate data-testid="login-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input
                                id="login-email"
                                data-testid="login-email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                            />
                            {hasSubmitted && errors.email && (
                                <p data-testid="error-email" className="text-sm font-medium text-destructive">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="login-password">Password</Label>
                            <Input
                                id="login-password"
                                data-testid="login-password"
                                type="password"
                                placeholder="••••••"
                                value={password}
                                onChange={(e) => handlePasswordChange(e.target.value)}
                            />
                            {hasSubmitted && errors.password && (
                                <p data-testid="error-password" className="text-sm font-medium text-destructive">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {authError && (
                            <p data-testid="error-auth" className="text-sm font-medium text-destructive">
                                {authError}
                            </p>
                        )}

                        <Button
                            type="submit"
                            data-testid="login-submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Log In"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-primary font-medium hover:underline">
                            Register
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
