-- Unified Database Schema and RPC Functions
-- This script sets up the profiles and transactions tables and the necessary RPC functions for approvals/rejections.

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    available_balance NUMERIC DEFAULT 0,
    allocated_balance NUMERIC DEFAULT 0,
    referral_balance NUMERIC DEFAULT 0,
    referred_by UUID REFERENCES public.profiles(id),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure is_admin column exists if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'yield', 'strategy_allocation', 'strategy_withdrawal')),
    amount NUMERIC NOT NULL,
    fee NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'rejected')),
    strategy TEXT,
    currency TEXT,
    network TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Ensure notes column exists
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Support Messages Table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sender TEXT NOT NULL, -- 'user', 'admin', 'system', 'trade_log', 'system_settings_strategies'
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Basic RLS Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Support Messages Policies
CREATE POLICY "Users can view their own messages" ON public.support_messages FOR SELECT USING (auth.uid() = user_id OR sender = 'system_settings_strategies' OR public.is_admin());
CREATE POLICY "Users can insert their own messages" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can update messages" ON public.support_messages FOR UPDATE USING (public.is_admin());

-- Admin Policies
-- (Already covered by OR public.is_admin() in policies above)

-- 3. RPC: approve_deposit
-- Handles deposit approval, balance update, and referral commission.
CREATE OR REPLACE FUNCTION public.approve_deposit(tx_id UUID, final_amount NUMERIC, new_strategy TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    t_user_id UUID;
    t_amount NUMERIC;
    t_referrer_id UUID;
    t_status TEXT;
    t_strategy TEXT;
BEGIN
    -- Get and lock the transaction
    SELECT user_id, amount, status, strategy INTO t_user_id, t_amount, t_status, t_strategy
    FROM public.transactions
    WHERE id = tx_id
    FOR UPDATE;

    -- Check if transaction exists and is pending
    IF t_user_id IS NULL THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;

    IF t_status != 'pending' THEN
        RAISE EXCEPTION 'Transaction is already processed (Status: %)', t_status;
    END IF;

    -- Use final_amount if provided, otherwise use original amount
    IF final_amount IS NOT NULL AND final_amount > 0 THEN
        t_amount := final_amount;
    END IF;

    -- Use new_strategy if provided, otherwise keep original
    IF new_strategy IS NOT NULL THEN
        t_strategy := new_strategy;
    END IF;

    -- 1. Update transaction status
    UPDATE public.transactions
    SET status = 'completed',
        amount = t_amount,
        strategy = t_strategy,
        approved_at = NOW()
    WHERE id = tx_id;

    -- 2. Update user's available balance
    UPDATE public.profiles
    SET available_balance = COALESCE(available_balance, 0) + t_amount,
        updated_at = NOW()
    WHERE id = t_user_id;

    -- 3. Handle Referral Commission (1%)
    SELECT referred_by INTO t_referrer_id FROM public.profiles WHERE id = t_user_id;
    
    IF t_referrer_id IS NOT NULL THEN
        -- Add 1% to referrer's referral_balance
        UPDATE public.profiles
        SET referral_balance = COALESCE(referral_balance, 0) + (t_amount * 0.01),
            updated_at = NOW()
        WHERE id = t_referrer_id;
        
        -- Record the referral yield transaction
        INSERT INTO public.transactions (user_id, type, amount, status, strategy, created_at, approved_at)
        VALUES (t_referrer_id, 'yield', t_amount * 0.01, 'completed', 'Referral Commission', NOW(), NOW());
    END IF;

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: reject_deposit
CREATE OR REPLACE FUNCTION public.reject_deposit(deposit_id UUID, reject_reason TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.transactions
    SET status = 'rejected',
        notes = reject_reason,
        approved_at = NOW()
    WHERE id = deposit_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: approve_withdrawal
CREATE OR REPLACE FUNCTION public.approve_withdrawal(withdrawal_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    t_user_id UUID;
    t_amount NUMERIC;
    t_status TEXT;
    t_current_balance NUMERIC;
BEGIN
    -- Get and lock the transaction
    SELECT user_id, amount, status INTO t_user_id, t_amount, t_status
    FROM public.transactions
    WHERE id = withdrawal_id AND type = 'withdrawal'
    FOR UPDATE;

    IF t_user_id IS NULL THEN
        RAISE EXCEPTION 'Withdrawal request not found';
    END IF;

    IF t_status != 'pending' THEN
        RAISE EXCEPTION 'Withdrawal is already processed';
    END IF;

    -- Check if user has enough balance (though it should have been checked at request time)
    SELECT available_balance INTO t_current_balance FROM public.profiles WHERE id = t_user_id;
    
    -- We assume the balance was already deducted or held when the request was made.
    -- If your app deducts balance ON APPROVAL, uncomment below:
    /*
    IF t_current_balance < t_amount THEN
        RAISE EXCEPTION 'Insufficient balance for withdrawal';
    END IF;
    
    UPDATE public.profiles
    SET available_balance = available_balance - t_amount
    WHERE id = t_user_id;
    */

    -- Update transaction status
    UPDATE public.transactions
    SET status = 'completed',
        approved_at = NOW()
    WHERE id = withdrawal_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: reject_withdrawal
CREATE OR REPLACE FUNCTION public.reject_withdrawal(withdrawal_id UUID, reject_reason TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    t_user_id UUID;
    t_amount NUMERIC;
    t_fee NUMERIC;
    t_status TEXT;
BEGIN
    -- Get and lock the transaction
    SELECT user_id, amount, fee, status INTO t_user_id, t_amount, t_fee, t_status
    FROM public.transactions
    WHERE id = withdrawal_id AND type = 'withdrawal'
    FOR UPDATE;

    IF t_user_id IS NULL THEN
        RAISE EXCEPTION 'Withdrawal request not found';
    END IF;

    IF t_status != 'pending' THEN
        RAISE EXCEPTION 'Withdrawal is already processed';
    END IF;

    -- If balance was deducted at request time, we must refund it here
    -- Refund both amount and fee
    UPDATE public.profiles
    SET available_balance = COALESCE(available_balance, 0) + t_amount + COALESCE(t_fee, 0)
    WHERE id = t_user_id;

    -- Update transaction status
    UPDATE public.transactions
    SET status = 'rejected',
        notes = reject_reason,
        approved_at = NOW()
    WHERE id = withdrawal_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: reject_transaction (Generic)
CREATE OR REPLACE FUNCTION public.reject_transaction(tx_id UUID, reason TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.transactions
    SET status = 'rejected',
        notes = reason,
        approved_at = NOW()
    WHERE id = tx_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: process_allocation
-- Handles strategy allocations, withdrawals, and yield distributions.
CREATE OR REPLACE FUNCTION public.process_allocation(
    user_id UUID,
    amount NUMERIC,
    strategy TEXT,
    is_allocation BOOLEAN,
    tx_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    t_type TEXT;
BEGIN
    -- Determine transaction type
    IF tx_type IS NOT NULL THEN
        t_type := tx_type;
    ELSIF is_allocation THEN
        t_type := 'strategy_allocation';
    ELSE
        t_type := 'strategy_withdrawal';
    END IF;

    -- 1. Update balances
    IF t_type = 'strategy_allocation' THEN
        -- Check if user has enough available balance
        IF (SELECT available_balance FROM public.profiles WHERE id = user_id) < amount THEN
            RAISE EXCEPTION 'Insufficient available balance';
        END IF;
        
        UPDATE public.profiles
        SET available_balance = available_balance - amount,
            allocated_balance = COALESCE(allocated_balance, 0) + amount,
            updated_at = NOW()
        WHERE id = user_id;
    ELSIF t_type = 'strategy_withdrawal' THEN
        -- Check if user has enough allocated balance
        IF (SELECT allocated_balance FROM public.profiles WHERE id = user_id) < amount THEN
            RAISE EXCEPTION 'Insufficient allocated balance';
        END IF;

        UPDATE public.profiles
        SET allocated_balance = allocated_balance - amount,
            available_balance = available_balance + amount,
            updated_at = NOW()
        WHERE id = user_id;
    ELSIF t_type = 'yield' THEN
        -- Yield adds to allocated balance (compounding)
        UPDATE public.profiles
        SET allocated_balance = COALESCE(allocated_balance, 0) + amount,
            updated_at = NOW()
        WHERE id = user_id;
    END IF;

    -- 2. Record transaction
    INSERT INTO public.transactions (user_id, type, amount, status, strategy, created_at, approved_at)
    VALUES (user_id, t_type, amount, 'completed', strategy, NOW(), NOW());

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RPC: request_withdrawal
-- Handles atomic balance deduction and pending transaction creation for withdrawals.
-- Supports optional parameters for crypto withdrawals and referral balance usage.
CREATE OR REPLACE FUNCTION public.request_withdrawal(
    user_id UUID, 
    amount NUMERIC, 
    strategy TEXT,
    address TEXT DEFAULT NULL,
    currency TEXT DEFAULT NULL,
    network TEXT DEFAULT NULL,
    fee NUMERIC DEFAULT 0,
    referral_withdrawable BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
DECLARE
    t_current_balance NUMERIC;
    t_referral_balance NUMERIC;
    t_total_deduction NUMERIC;
    t_notes TEXT;
BEGIN
    -- Calculate total deduction (amount + fee)
    t_total_deduction := amount + COALESCE(fee, 0);

    -- Get and lock the profile
    SELECT available_balance, referral_balance INTO t_current_balance, t_referral_balance
    FROM public.profiles
    WHERE id = user_id
    FOR UPDATE;

    IF t_current_balance IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Check if we should deduct from referral balance too
    IF referral_withdrawable AND COALESCE(t_referral_balance, 0) >= 100 THEN
        IF (COALESCE(t_current_balance, 0) + COALESCE(t_referral_balance, 0)) < t_total_deduction THEN
            RAISE EXCEPTION 'Insufficient total balance (Available + Referral)';
        END IF;

        -- Deduct from referral balance first, then available
        IF t_referral_balance >= t_total_deduction THEN
            UPDATE public.profiles
            SET referral_balance = referral_balance - t_total_deduction,
                updated_at = NOW()
            WHERE id = user_id;
        ELSE
            UPDATE public.profiles
            SET referral_balance = 0,
                available_balance = available_balance - (t_total_deduction - t_referral_balance),
                updated_at = NOW()
            WHERE id = user_id;
        END IF;
    ELSE
        -- Standard withdrawal from available balance
        IF COALESCE(t_current_balance, 0) < t_total_deduction THEN
            RAISE EXCEPTION 'Insufficient available balance';
        END IF;

        UPDATE public.profiles
        SET available_balance = available_balance - t_total_deduction,
            updated_at = NOW()
        WHERE id = user_id;
    END IF;

    -- Construct notes
    t_notes := 'Withdrawal request';
    IF address IS NOT NULL AND address != '' THEN t_notes := t_notes || ' to ' || address; END IF;
    IF network IS NOT NULL AND network != '' THEN t_notes := t_notes || ' via ' || network; END IF;
    IF currency IS NOT NULL AND currency != '' THEN t_notes := t_notes || ' (' || currency || ')'; END IF;
    IF fee > 0 THEN t_notes := t_notes || '. Fee: $' || fee; END IF;

    -- 2. Create pending withdrawal transaction
    INSERT INTO public.transactions (user_id, type, amount, fee, status, strategy, currency, network, address, notes, created_at)
    VALUES (user_id, 'withdrawal', amount, COALESCE(fee, 0), 'pending', strategy, currency, network, address, t_notes, NOW());

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
