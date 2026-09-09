import React, { useState, useEffect } from 'react';
import { useCafe } from '../../context/CafeContext';
import { DailyChallenge, LoyaltyReward, CustomerReferralInfo } from '../../types';
import {
  Trophy,
  Sparkles,
  Flame,
  Gift,
  Share2,
  Copy,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  Zap,
  Coffee,
  Check
} from 'lucide-react';

const DEFAULT_CHALLENGES: DailyChallenge[] = [
  {
    id: 'ch-1',
    title: 'Warm-Up Warrior',
    description: 'Play 2 consecutive hours on any PC or Console station',
    xpReward: 250,
    progress: 2,
    maxProgress: 2,
    target: 2,
    completed: true,
    isClaimed: true,
    category: 'ARENA PLAY'
  },
  {
    id: 'ch-2',
    title: 'Artisan Fuel',
    description: 'Order any artisan espresso or cold brew drink to your station',
    xpReward: 150,
    progress: 1,
    maxProgress: 1,
    target: 1,
    completed: true,
    isClaimed: false,
    category: 'F&B BAR'
  },
  {
    id: 'ch-3',
    title: 'Weekend Apex Striker',
    description: 'Log 5 total gaming hours across the weekend tournament sprint',
    xpReward: 500,
    progress: 3.5,
    maxProgress: 5,
    target: 5,
    completed: false,
    isClaimed: false,
    category: 'TOURNAMENT'
  },
  {
    id: 'ch-4',
    title: 'Squad Commander',
    description: 'Invite a fellow gamer using your personal referral code',
    xpReward: 400,
    progress: 0,
    maxProgress: 1,
    target: 1,
    completed: false,
    isClaimed: false,
    category: 'COMMUNITY'
  }
];

const DEFAULT_REWARDS: LoyaltyReward[] = [
  {
    id: 'rew-1',
    title: '₹100 Wallet Credit',
    description: 'Instant credit added to your gaming balance for any station or rig.',
    xpCost: 800,
    pointCost: 800,
    category: 'WALLET',
    type: 'WALLET_CREDIT',
    value: 100,
    claimed: false
  },
  {
    id: 'rew-2',
    title: 'Free 30-Min Session',
    description: 'Bonus 30 minutes playtime on any standard PC or Console station.',
    xpCost: 1200,
    pointCost: 1200,
    category: 'STATION TIME',
    type: 'FREE_HOURS',
    value: 0.5,
    claimed: false
  },
  {
    id: 'rew-3',
    title: 'Artisan Cold Brew Voucher',
    description: 'Redeem for 1 specialty iced caramel macchiato or Nitro Cold Brew.',
    xpCost: 1000,
    pointCost: 1000,
    category: 'F&B BAR',
    type: 'FREE_DRINK',
    value: 180,
    claimed: false
  },
  {
    id: 'rew-4',
    title: 'Tournament Free Pass',
    description: '100% waiver on entry fee for upcoming weekly community cup.',
    xpCost: 2500,
    pointCost: 2500,
    category: 'EVENTS',
    type: 'TOURNAMENT_PASS',
    value: 499,
    claimed: false
  }
];

const DEFAULT_REFERRAL: CustomerReferralInfo = {
  referralCode: 'RAGHAV-GC7X',
  code: 'RAGHAV-GC7X',
  friendsReferred: 4,
  successfulReferrals: 3,
  totalEarned: 300
};

export const RewardsScreen: React.FC = () => {
  const { loyaltyPoints, setLoyaltyPoints, setWalletBalance } = useCafe();

  const [challenges, setChallenges] = useState<DailyChallenge[]>(DEFAULT_CHALLENGES);
  const [rewards, setRewards] = useState<LoyaltyReward[]>(DEFAULT_REWARDS);
  const [referralInfo, setReferralInfo] = useState<CustomerReferralInfo | null>(DEFAULT_REFERRAL);

  const [copiedCode, setCopiedCode] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);
  const [redeemFeedback, setRedeemFeedback] = useState<string | null>(null);

  // Fetch rewards, challenges, and referral data from server
  const loadRewardsData = async () => {
    try {
      const [chalRes, rewRes, refRes] = await Promise.all([
        fetch('/api/rewards/challenges').catch(() => null),
        fetch('/api/rewards/catalog').catch(() => null),
        fetch('/api/referrals/me').catch(() => null)
      ]);

      if (chalRes && chalRes.ok) {
        const ct = chalRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const chalData = await chalRes.json();
          if (Array.isArray(chalData.challenges) && chalData.challenges.length > 0) {
            setChallenges(chalData.challenges);
          }
        }
      }

      if (rewRes && rewRes.ok) {
        const ct = rewRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const rewData = await rewRes.json();
          if (Array.isArray(rewData.rewards) && rewData.rewards.length > 0) {
            setRewards(rewData.rewards);
          }
        }
      }

      if (refRes && refRes.ok) {
        const ct = refRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const refData = await refRes.json();
          if (refData.referralInfo) {
            setReferralInfo(refData.referralInfo);
          }
        }
      }
    } catch (err) {
      console.warn('Network warning when loading rewards data; using cached data:', err);
    }
  };

  useEffect(() => {
    loadRewardsData();
  }, []);

  // Claim Challenge XP
  const handleClaimChallenge = async (challengeId: string) => {
    try {
      const res = await fetch('/api/rewards/claim-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId })
      });
      const data = await res.json();
      if (data.success) {
        setLoyaltyPoints(data.newTotalPoints);
        setClaimFeedback(`+${data.claimedXp} XP claimed successfully!`);
        // Update local challenge state
        setChallenges((prev) =>
          prev.map((c) => (c.id === challengeId ? { ...c, isClaimed: true, completed: true } : c))
        );
        setTimeout(() => setClaimFeedback(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Redeem Perk
  const handleRedeemPerk = async (rewardId: string) => {
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId })
      });
      const data = await res.json();
      if (data.success) {
        setLoyaltyPoints(data.newPointsBalance ?? data.remainingXp ?? loyaltyPoints);
        if (data.newWalletBalance !== undefined) {
          setWalletBalance(data.newWalletBalance);
        }
        setRedeemFeedback(`Perk redeemed: ${data.rewardTitle || data.reward?.title || 'Reward'}!`);
        setTimeout(() => setRedeemFeedback(null), 3000);
      } else {
        setRedeemFeedback(data.error || 'Failed to redeem perk.');
        setTimeout(() => setRedeemFeedback(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Copy Referral Code
  const handleCopyCode = () => {
    const code = referralInfo?.code || referralInfo?.referralCode || 'RAGHAV-GC7X';
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const currentTier = 'Nexus Elite';
  const nextTier = 'Nexus Master';
  const currentXp = loyaltyPoints;
  const targetXp = 3000;
  const progressPct = Math.min(100, Math.round((currentXp / targetXp) * 100));

  return (
    <div id="screen-rewards" className="flex flex-col gap-8 pb-12 animate-fadeIn select-none">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-amber-500 block mb-1">
            Loyalty & Gamification Vault
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <span>Nexus Rewards & Challenges</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-xl">
            Complete daily arena objectives, rank up your gamer tier, unlock complimentary gaming hours, and redeem gourmet café perks.
          </p>
        </div>

        {/* Current XP Display */}
        <div className="p-4 px-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-4 self-start md:self-auto">
          <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
          <div>
            <span className="text-[9px] uppercase tracking-widest text-amber-400/80 font-bold block">Available Balance</span>
            <span className="text-2xl font-black text-white font-mono tracking-tight">{loyaltyPoints.toLocaleString()} <span className="text-xs text-amber-400 font-sans">XP</span></span>
          </div>
        </div>
      </div>

      {/* VIP Tier Progression Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#17120a] via-[#0f0c08] to-[#0a0a0a] border border-amber-500/30 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-amber-400">
                VIP Rank Status
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1 flex items-center gap-3">
              <span>{currentTier}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                Tier 4
              </span>
            </h2>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-white/50 block">Next Rank: <strong className="text-white font-bold">{nextTier}</strong></span>
            <span className="text-sm font-mono text-amber-400 font-bold">
              {Math.max(0, targetXp - currentXp)} XP needed
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col gap-2">
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/50 font-mono">
            <span>{currentXp} XP</span>
            <span>{targetXp} XP (Master Tier)</span>
          </div>
        </div>

        {/* Tier Perks Active */}
        <div className="pt-4 border-t border-amber-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>15% Off Café Menu</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Priority Rig Booking</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Free Controller Upgrades</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Tournament Entry Discounts</span>
          </div>
        </div>
      </div>

      {/* Alerts for feedback */}
      {(claimFeedback || redeemFeedback) && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>{claimFeedback || redeemFeedback}</span>
        </div>
      )}

      {/* Grid: Daily Challenges & Perks Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Daily & Weekly Challenges */}
        <div className="rounded-3xl bg-[#0c0c0c] border border-white/10 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500" />
                <span>Active Quests & Challenges</span>
              </h3>
              <span className="text-[10px] font-mono text-white/50 uppercase">Resets in 14h</span>
            </div>

            <div className="flex flex-col gap-3">
              {challenges.map((ch) => {
                const target = ch.target || ch.maxProgress || 1;
                const isComplete = ch.progress >= target;
                const progressPct = Math.min(100, Math.round((ch.progress / target) * 100));

                return (
                  <div
                    key={ch.id}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-white/10 text-white/70">
                            {ch.category || 'QUEST'}
                          </span>
                          <span className="text-xs font-bold text-white uppercase tracking-tight">
                            {ch.title}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-1 font-light">
                          {ch.description}
                        </p>
                      </div>

                      <span className="text-xs font-mono font-black text-amber-400 shrink-0">
                        +{ch.xpReward} XP
                      </span>
                    </div>

                    {/* Progress Bar & Claim Button */}
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-white/40 font-mono">
                          {ch.progress} / {target} Completed
                        </span>
                      </div>

                      {ch.isClaimed ? (
                        <span className="px-3 py-1 rounded-lg bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                          Claimed
                        </span>
                      ) : isComplete ? (
                        <button
                          onClick={() => handleClaimChallenge(ch.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider transition cursor-pointer shadow-md shadow-amber-500/20 active:scale-98"
                        >
                          Claim XP
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-white/40">In Progress</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Redeem Perks Catalog */}
        <div className="rounded-3xl bg-[#0c0c0c] border border-white/10 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-400" />
                <span>Nexus Perks Catalog</span>
              </h3>
              <span className="text-[10px] font-mono text-amber-400 font-bold">1-Click Redemption</span>
            </div>

            <div className="flex flex-col gap-3">
              {rewards.map((rw) => {
                const cost = rw.pointCost || rw.xpCost || 0;
                const canAfford = loyaltyPoints >= cost;
                const category = rw.category || rw.type || 'PERK';

                return (
                  <div
                    key={rw.id}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {category}
                        </span>
                        <h4 className="text-xs font-bold text-white uppercase tracking-tight">
                          {rw.title}
                        </h4>
                      </div>
                      <p className="text-xs text-white/50 mt-0.5 font-light">
                        {rw.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs font-mono font-black text-amber-400">
                        {cost} XP
                      </span>
                      <button
                        onClick={() => handleRedeemPerk(rw.id)}
                        disabled={!canAfford}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                          canAfford
                            ? 'bg-white text-black hover:bg-white/90 active:scale-98 shadow-sm'
                            : 'bg-white/5 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'Redeem' : 'Need More XP'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Referral Program Banner */}
      <div className="rounded-3xl bg-[#0c0c0c] border border-white/10 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-purple-400 block">
              Gamer Referral Engine
            </span>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mt-0.5">
              Invite Friends & Earn ₹150 + 250 XP
            </h3>
            <p className="text-xs text-white/50 font-light mt-0.5 max-w-lg">
              Give your squad 1 hour of complimentary gaming time on their first visit. When they check in, you earn ₹150 wallet credit and 250 XP instantly.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Referral Code Box */}
          <div className="p-3 px-4 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Your Unique Code</span>
              <span className="text-base font-black text-white font-mono tracking-wider">
                {referralInfo?.code || 'RAGHAV-GC7X'}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Copy Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* WhatsApp Share Button */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `Hey! Play with me at Bytes & Brew Gaming Café. Use my invite code ${referralInfo?.code || 'RAGHAV-GC7X'} to get 1 hour free gaming session!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            <Share2 className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
