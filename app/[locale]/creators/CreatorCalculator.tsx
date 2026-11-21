'use client';

import React, { useState } from 'react';
import { DollarSign, ShieldAlert, Sparkles, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CreatorCalculator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(10000);
  const [chargebackRate, setChargebackRate] = useState<number>(6); // 6% industry average

  // Presets
  const presets = [2500, 5000, 10000, 25000];

  // ONLYFANS / FANSLY MATH
  const ofPlatformCut = monthlyRevenue * 0.20; // 20%
  const ofChargebackLoss = monthlyRevenue * (chargebackRate / 100);
  const estimatedDisputeCount = Math.round(ofChargebackLoss / 50); // ~$50 per order
  const ofDisputeFees = estimatedDisputeCount * 20; // $20 fee per dispute
  const ofTotalLost = ofPlatformCut + ofChargebackLoss + ofDisputeFees;
  const ofNetIncome = Math.max(0, monthlyRevenue - ofTotalLost);

  // HIGH-RISK CARD PROCESSORS (Stripe/CCBill) MATH
  const hrProcessingFee = monthlyRevenue * 0.12; // 12%
  const hrRollingReserve = monthlyRevenue * 0.10; // 10% held 180 days
  const hrChargebackLoss = monthlyRevenue * (chargebackRate / 100);
  const hrDisputeFees = estimatedDisputeCount * 25; // $25 dispute fee
  const hrTotalLost = hrProcessingFee + hrChargebackLoss + hrDisputeFees;
  const hrNetIncome = Math.max(0, monthlyRevenue - hrTotalLost);

  // LINKLOCKR MATH (Strictly 2.5% fee on Base)
  const linklockrFee = monthlyRevenue * 0.025; // 2.5%
  const linklockrNetIncome = monthlyRevenue - linklockrFee; // 0 chargebacks

  // SAVINGS COMPARISON
  const monthlySavingsVsOf = linklockrNetIncome - ofNetIncome;
  const yearlySavingsVsOf = monthlySavingsVsOf * 12;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8">
      {/* SLIDERS CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-slate-800/80">
        {/* SLIDER 1: MONTHLY GROSS REVENUE */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Monthly Gross Revenue
            </label>
            <span className="text-xl sm:text-2xl font-black font-mono text-cyan-400">
              {formatCurrency(monthlyRevenue)}
            </span>
          </div>

          <input
            type="range"
            min={1000}
            max={50000}
            step={500}
            value={monthlyRevenue}
            onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-500 font-medium">Quick presets:</span>
            {presets.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setMonthlyRevenue(amt)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer ${
                  monthlyRevenue === amt
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                {formatCurrency(amt)}
              </button>
            ))}
          </div>
        </div>

        {/* SLIDER 2: CHARGEBACK RATE */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Chargeback Rate (Friendly Fraud)
              </label>
            </div>
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
              {chargebackRate}%
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={15}
            step={1}
            value={chargebackRate}
            onChange={(e) => setChargebackRate(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          <div className="flex justify-between text-[11px] text-slate-500">
            <span>0% (Best Case)</span>
            <span>6% (Industry Average)</span>
            <span>15% (High Fraud PPV)</span>
          </div>
        </div>
      </div>

      {/* SAVINGS HIGHLIGHT BANNER */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Your Extra Net Revenue with LinkLockr
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              +{formatCurrency(monthlySavingsVsOf)}{' '}
              <span className="text-sm font-normal text-slate-400">/ month</span>
            </div>
          </div>
        </div>

        <div className="text-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Annualized Savings</span>
          <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
            +{formatCurrency(yearlySavingsVsOf)} / yr
          </span>
        </div>
      </div>

      {/* COMPARISON CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: ONLYFANS / FANSLY */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Legacy Platform
              </span>
              <h3 className="text-lg font-black text-white">OnlyFans / Fansly</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              20% Cut
            </span>
          </div>

          <div className="space-y-2 text-xs border-y border-slate-800/80 py-3">
            <div className="flex justify-between text-slate-400">
              <span>Platform Take Rate (20%):</span>
              <span className="text-red-400 font-mono">-{formatCurrency(ofPlatformCut)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Chargebacks ({chargebackRate}%):</span>
              <span className="text-red-400 font-mono">-{formatCurrency(ofChargebackLoss)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Bank Dispute Penalties:</span>
              <span className="text-red-400 font-mono">-{formatCurrency(ofDisputeFees)}</span>
            </div>
            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/40">
              <span>Payout Delay:</span>
              <span className="text-amber-400 font-medium">7–21 Days</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              Your Real Take-Home:
            </span>
            <div className="text-xl font-black text-slate-300 font-mono">
              {formatCurrency(ofNetIncome)}
            </div>
            <span className="text-[10px] text-red-400/80 block mt-0.5">
              Lost to fees &amp; fraud: -{formatCurrency(ofTotalLost)}
            </span>
          </div>
        </div>

        {/* CARD 2: HIGH-RISK STRIPE/CCBILL */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Direct Merchant
              </span>
              <h3 className="text-lg font-black text-white">High-Risk Card Account</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              12% + Reserve
            </span>
          </div>

          <div className="space-y-2 text-xs border-y border-slate-800/80 py-3">
            <div className="flex justify-between text-slate-400">
              <span>Processing Fee (12%):</span>
              <span className="text-amber-400 font-mono">-{formatCurrency(hrProcessingFee)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Rolling Reserve (Held 180d):</span>
              <span className="text-amber-400 font-mono">{formatCurrency(hrRollingReserve)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Chargebacks + $25 Disputes:</span>
              <span className="text-red-400 font-mono">-{formatCurrency(hrChargebackLoss + hrDisputeFees)}</span>
            </div>
            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/40">
              <span>Deplatforming Risk:</span>
              <span className="text-red-400 font-medium">High (Strict AUP)</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              Your Real Take-Home:
            </span>
            <div className="text-xl font-black text-slate-300 font-mono">
              {formatCurrency(hrNetIncome)}
            </div>
            <span className="text-[10px] text-amber-400/80 block mt-0.5">
              Subject to frozen reserves &amp; bank clawbacks
            </span>
          </div>
        </div>

        {/* CARD 3: LINKLOCKR (THE WINNER) */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-cyan-950/50 to-slate-900 border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10 space-y-4 relative">
          <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
            Best Economics
          </div>

          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Decentralized Escrow
              </span>
              <h3 className="text-lg font-black text-white">LinkLockr (Base)</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              2.5% Fee
            </span>
          </div>

          <div className="space-y-2 text-xs border-y border-slate-800/80 py-3">
            <div className="flex justify-between text-slate-300">
              <span>Convenience Fee (2.5%):</span>
              <span className="text-cyan-400 font-mono">-{formatCurrency(linklockrFee)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Chargebacks:</span>
              <span className="text-emerald-400 font-bold font-mono">$0 (0% Risk)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Dispute Fees:</span>
              <span className="text-emerald-400 font-bold font-mono">$0</span>
            </div>
            <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800/40">
              <span>Payout Speed:</span>
              <span className="text-emerald-400 font-bold">Instant (Direct to Wallet)</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              Your Real Take-Home:
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {formatCurrency(linklockrNetIncome)}
            </div>
            <span className="text-[10px] text-cyan-400/80 block mt-0.5 font-medium">
              You keep 97.5% of your money.
            </span>
          </div>
        </div>
      </div>

      {/* CTA FOOTER */}
      <div className="text-center pt-2">
        <Link
          href="/?tab=create"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:scale-[1.02] transition-all cursor-pointer"
        >
          <span>Try LinkLockr</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
