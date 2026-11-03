"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useExpense } from "@/context/ExpenseContext";
import { ExpenseCategory } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

export default function ExpensesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const {
        filteredExpenses,
        totalAmount,
        expenseCount,
        categoryBreakdown,
        filterCategory,
        setFilterCategory,
        filterMonth,
        setFilterMonth,
        clearFilters,
        addExpense,
        deleteExpense,
    } = useExpense();

    // Form states
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState<ExpenseCategory | "">("");
    const [date, setDate] = useState("");
    const [note, setNote] = useState("");
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [formErrors, setFormErrors] = useState<{
        amount?: string;
        category?: string;
        date?: string;
        note?: string;
    }>({});
    const [expenseSuccess, setExpenseSuccess] = useState<string | null>(null);
    const [expenseError, setExpenseError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Authentication protection
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    // While finding out whether someone is logged in, show nothing
    if (authLoading || !user) {
        return null;
    }

    const getTodayString = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const validate = (a: string, c: string, d: string, n: string) => {
        const errs: { amount?: string; category?: string; date?: string; note?: string } = {};

        // Amount validation
        if (!a.trim()) {
            errs.amount = "Amount is required";
        } else {
            const num = Number(a);
            if (isNaN(num) || num <= 0) {
                errs.amount = "Amount must be greater than 0";
            }
        }

        // Category validation
        if (!c) {
            errs.category = "Please choose a category";
        }

        // Date validation
        if (!d) {
            errs.date = "Date is required";
        } else {
            const today = getTodayString();
            if (d > today) {
                errs.date = "Date cannot be in the future";
            }
        }

        // Note validation
        if (n && n.length > 100) {
            errs.note = "Note must be at most 100 characters";
        }

        return errs;
    };

    const handleAmountChange = (val: string) => {
        setAmount(val);
        if (hasSubmitted) {
            const errs = validate(val, category, date, note);
            setFormErrors((prev) => ({ ...prev, amount: errs.amount }));
        }
    };

    const handleCategoryChange = (val: string) => {
        setCategory(val as ExpenseCategory | "");
        if (hasSubmitted) {
            const errs = validate(amount, val, date, note);
            setFormErrors((prev) => ({ ...prev, category: errs.category }));
        }
    };

    const handleDateChange = (val: string) => {
        setDate(val);
        if (hasSubmitted) {
            const errs = validate(amount, category, val, note);
            setFormErrors((prev) => ({ ...prev, date: errs.date }));
        }
    };

    const handleNoteChange = (val: string) => {
        setNote(val);
        if (hasSubmitted) {
            const errs = validate(amount, category, date, val);
            setFormErrors((prev) => ({ ...prev, note: errs.note }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setHasSubmitted(true);
        setExpenseSuccess(null);
        setExpenseError(null);

        const errs = validate(amount, category, date, note);
        setFormErrors(errs);

        if (Object.keys(errs).length > 0) {
            return;
        }

        setSubmitting(true);
        try {
            const result = await addExpense({
                amount: Number(amount),
                category: category as ExpenseCategory,
                spent_on: date,
                note: note.trim(),
            });

            if (result.success) {
                setExpenseSuccess("Expense added");
                setAmount("");
                setCategory("");
                setDate("");
                setNote("");
                setHasSubmitted(false);
                setFormErrors({});
            } else {
                setExpenseError(result.error || "Failed to add expense");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to add expense";
            setExpenseError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div data-testid="expenses-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">My Expenses</h1>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                {/* Left Column: Add Form + Filters + Summary */}
                <div className="space-y-8 xl:col-span-1">
                    {/* Add Expense Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Expense</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form noValidate data-testid="expense-form" onSubmit={handleSubmit} className="space-y-4">
                                {/* Amount */}
                                <div className="space-y-2">
                                    <Label htmlFor="input-amount">Amount ($)</Label>
                                    <Input
                                        id="input-amount"
                                        data-testid="input-amount"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => handleAmountChange(e.target.value)}
                                    />
                                    {hasSubmitted && formErrors.amount && (
                                        <p data-testid="error-amount" className="text-sm font-medium text-destructive">
                                            {formErrors.amount}
                                        </p>
                                    )}
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <Label htmlFor="select-category">Category</Label>
                                    <select
                                        id="select-category"
                                        data-testid="select-category"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={category}
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                    >
                                        <option value="">Choose category</option>
                                        <option value="Food">Food</option>
                                        <option value="Transport">Transport</option>
                                        <option value="Shopping">Shopping</option>
                                        <option value="Bills">Bills</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {hasSubmitted && formErrors.category && (
                                        <p data-testid="error-category" className="text-sm font-medium text-destructive">
                                            {formErrors.category}
                                        </p>
                                    )}
                                </div>

                                {/* Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="input-date">Date</Label>
                                    <Input
                                        id="input-date"
                                        data-testid="input-date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                    />
                                    {hasSubmitted && formErrors.date && (
                                        <p data-testid="error-date" className="text-sm font-medium text-destructive">
                                            {formErrors.date}
                                        </p>
                                    )}
                                </div>

                                {/* Note */}
                                <div className="space-y-2">
                                    <Label htmlFor="input-note">Note (optional)</Label>
                                    <Input
                                        id="input-note"
                                        data-testid="input-note"
                                        type="text"
                                        placeholder="Optional short note"
                                        value={note}
                                        onChange={(e) => handleNoteChange(e.target.value)}
                                    />
                                    {hasSubmitted && formErrors.note && (
                                        <p data-testid="error-note" className="text-sm font-medium text-destructive">
                                            {formErrors.note}
                                        </p>
                                    )}
                                </div>

                                {/* Status messages */}
                                {expenseError && (
                                    <p data-testid="error-expense" className="text-sm font-medium text-destructive">
                                        {expenseError}
                                    </p>
                                )}
                                {expenseSuccess && (
                                    <p data-testid="expense-success" className="text-sm font-medium text-green-600">
                                        {expenseSuccess}
                                    </p>
                                )}

                                <Button
                                    type="submit"
                                    data-testid="btn-add-expense"
                                    className="w-full"
                                    disabled={submitting}
                                >
                                    {submitting ? "Adding..." : "Add Expense"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Filters Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="filter-category">Filter by Category</Label>
                                <select
                                    id="filter-category"
                                    data-testid="filter-category"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option value="">All</option>
                                    <option value="Food">Food</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Shopping">Shopping</option>
                                    <option value="Bills">Bills</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="filter-month">Filter by Month</Label>
                                <Input
                                    id="filter-month"
                                    data-testid="filter-month"
                                    type="month"
                                    value={filterMonth}
                                    onChange={(e) => setFilterMonth(e.target.value)}
                                />
                            </div>

                            <Button
                                variant="outline"
                                data-testid="btn-clear-filters"
                                className="w-full"
                                onClick={clearFilters}
                            >
                                Clear
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Summary Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-muted-foreground">Total Spent:</span>
                                <span data-testid="total-amount" className="font-bold text-lg text-primary">
                                    ${totalAmount.toFixed(2)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-muted-foreground">Number of Expenses:</span>
                                <span data-testid="expense-count" className="font-semibold">
                                    {expenseCount}
                                </span>
                            </div>

                            <div className="pt-2">
                                <span className="text-sm font-medium text-muted-foreground block mb-2">Category Breakdown:</span>
                                <div data-testid="category-breakdown" className="space-y-2">
                                    {categoryBreakdown.map((row) => (
                                        <div
                                            key={row.category}
                                            data-testid="breakdown-row"
                                            className="flex justify-between items-center text-sm py-1 px-2 rounded bg-muted/50"
                                        >
                                            <span data-testid="breakdown-name" className="font-medium">
                                                {row.category}
                                            </span>
                                            <span data-testid="breakdown-amount" className="text-muted-foreground">
                                                ${row.total.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Expense List */}
                <div className="xl:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">Expense History</h2>

                    {filteredExpenses.length === 0 ? (
                        <div
                            data-testid="expenses-empty"
                            className="text-center py-16 border rounded-lg border-dashed text-muted-foreground bg-card"
                        >
                            No expenses found
                        </div>
                    ) : (
                        <div data-testid="expense-list" className="space-y-3">
                            {filteredExpenses.map((item) => (
                                <div
                                    key={item.id}
                                    data-testid="expense-item"
                                    className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span
                                                data-testid="expense-category"
                                                className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
                                            >
                                                {item.category}
                                            </span>
                                            <span data-testid="expense-amount" className="font-bold text-lg">
                                                ${Number(item.amount).toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                            <span data-testid="expense-date">{item.spent_on}</span>
                                            {item.note && (
                                                <span data-testid="expense-note" className="text-foreground">
                                                    {item.note}
                                                </span>
                                            )}
                                            {!item.note && (
                                                <span data-testid="expense-note" className="text-foreground"></span>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        data-testid="btn-delete-expense"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive self-end sm:self-center"
                                        onClick={() => deleteExpense(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
