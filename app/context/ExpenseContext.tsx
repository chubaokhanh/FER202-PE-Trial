"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "@/supabase/client";
import { useAuth } from "./AuthContext";
import { Expense, ExpenseCategory } from "@/types/expense";

interface AddExpensePayload {
  amount: number;
  category: ExpenseCategory;
  spent_on: string;
  note: string;
}

interface CategoryBreakdownItem {
  category: string;
  total: number;
}

interface ExpenseContextType {
  expenses: Expense[];
  loading: boolean;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  filterMonth: string;
  setFilterMonth: (month: string) => void;
  clearFilters: () => void;
  filteredExpenses: Expense[];
  totalAmount: number;
  expenseCount: number;
  categoryBreakdown: CategoryBreakdownItem[];
  addExpense: (payload: AddExpensePayload) => Promise<{ success: boolean; error?: string }>;
  deleteExpense: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const sortExpenses = (list: Expense[]): Expense[] => {
  return [...list].sort((a, b) => {
    if (a.spent_on !== b.spent_on) {
      return b.spent_on.localeCompare(a.spent_on); // newest date first
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // equal date: added last first
  });
};

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");

  // Load expenses once after login, and clear when logged out or switched account
  useEffect(() => {
    let isMounted = true;

    const fetchExpenses = async () => {
      if (!user) {
        if (isMounted) {
          setExpenses([]);
          setFilterCategory("");
          setFilterMonth("");
        }
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("expenses")
          .select("*")
          .order("spent_on", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching expenses:", error);
        } else if (data && isMounted) {
          setExpenses(sortExpenses(data as Expense[]));
        }
      } catch (err: unknown) {
        console.error("Unexpected error fetching expenses:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchExpenses();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const clearFilters = () => {
    setFilterCategory("");
    setFilterMonth("");
  };

  const addExpense = async (payload: AddExpensePayload) => {
    if (!user) {
      return { success: false, error: "User is not logged in." };
    }

    try {
      const { data, error } = await supabase
        .from("expenses")
        .insert([
          {
            user_id: user.id,
            amount: payload.amount,
            category: payload.category,
            spent_on: payload.spent_on,
            note: payload.note || "",
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (data) {
        setExpenses((prev) => sortExpenses([data as Expense, ...prev]));
      }

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add expense.";
      return { success: false, error: message };
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) {
        return { success: false, error: error.message };
      }
      setExpenses((prev) => prev.filter((item) => item.id !== id));
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete expense.";
      return { success: false, error: message };
    }
  };

  // Filtered expenses based on category and month
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchCategory = !filterCategory || expense.category === filterCategory;
      const matchMonth = !filterMonth || expense.spent_on.startsWith(filterMonth);
      return matchCategory && matchMonth;
    });
  }, [expenses, filterCategory, filterMonth]);

  // Total amount of filtered expenses
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [filteredExpenses]);

  // Expense count
  const expenseCount = filteredExpenses.length;

  // Breakdown with one row per category that appears, highest total first
  const categoryBreakdown = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    for (const item of filteredExpenses) {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + Number(item.amount);
    }

    return Object.entries(categoryTotals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses]);

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        loading,
        filterCategory,
        setFilterCategory,
        filterMonth,
        setFilterMonth,
        clearFilters,
        filteredExpenses,
        totalAmount,
        expenseCount,
        categoryBreakdown,
        addExpense,
        deleteExpense,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpense() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpense must be used within an ExpenseProvider");
  }
  return context;
}
