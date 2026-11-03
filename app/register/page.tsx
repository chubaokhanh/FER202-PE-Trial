"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
    const [authError, setAuthError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const isValidEmail = (str: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    };

    const validate = (eVal: string, pVal: string, cpVal: string) => {
        const errs: { email?: string; password?: string; confirmPassword?: string } = {};

        if (!eVal.trim()) {
            errs.email = "Email is required";
        } else if (!isValidEmail(eVal.trim())) {
            errs.email = "Please enter a valid email address";
        }

        if (!pVal) {
            errs.password = "Password is required";
        } else if (pVal.length < 6) {
            errs.password = "Password must be at least 6 characters";
        }

        if (!cpVal) {
            errs.confirmPassword = "Confirm password is required";
        } else if (cpVal !== pVal) {
            errs.confirmPassword = "Passwords do not match";
        }

        return errs;
    };

    const handleEmailChange = (val: string) => {
        setEmail(val);
        if (hasSubmitted) {
            const errs = validate(val, password, confirmPassword);
            setErrors((prev) => ({ ...prev, email: errs.email }));
        }
    };

    const handlePasswordChange = (val: string) => {
        setPassword(val);
        if (hasSubmitted) {
            const errs = validate(email, val, confirmPassword);
            setErrors((prev) => ({
                ...prev,
                password: errs.password,
                confirmPassword: errs.confirmPassword,
            }));
        }
    };

    const handleConfirmPasswordChange = (val: string) => {
        setConfirmPassword(val);
        if (hasSubmitted) {
            const errs = validate(email, password, val);
            setErrors((prev) => ({ ...prev, confirmPassword: errs.confirmPassword }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setHasSubmitted(true);
        setAuthError(null);
        setSuccessMessage(null);

        const validationErrors = validate(email, password, confirmPassword);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
            });

            if (error) {
                setAuthError(error.message);
            } else if (data?.user) {
                // If user is already registered or identities is empty in Supabase
                if (data.user.identities && data.user.identities.length === 0) {
                    setAuthError("User already registered");
                } else {
                    setSuccessMessage("Registration successful");
                }
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
                    <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
                    <CardDescription>Enter your email and create a password to register</CardDescription>
                </CardHeader>
                <CardContent>
                    <form noValidate data-testid="register-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="register-email">Email</Label>
                            <Input
                                id="register-email"
                                data-testid="register-email"
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
                            <Label htmlFor="register-password">Password</Label>
                            <Input
                                id="register-password"
                                data-testid="register-password"
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

                        <div className="space-y-2">
                            <Label htmlFor="register-confirm-password">Confirm Password</Label>
                            <Input
                                id="register-confirm-password"
                                data-testid="register-confirm-password"
                                type="password"
                                placeholder="••••••"
                                value={confirmPassword}
                                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                            />
                            {hasSubmitted && errors.confirmPassword && (
                                <p data-testid="error-confirm-password" className="text-sm font-medium text-destructive">
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        {authError && (
                            <p data-testid="error-auth" className="text-sm font-medium text-destructive">
                                {authError}
                            </p>
                        )}

                        {successMessage && (
                            <p data-testid="form-success" className="text-sm font-medium text-green-600">
                                {successMessage}
                            </p>
                        )}

                        <Button
                            type="submit"
                            data-testid="register-submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Registering..." : "Register"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary font-medium hover:underline">
                            Log in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
