import { WalletReport, WalletReportJSON, SandwichAttack, SandwichAttackJSON } from './types';

export function serializeAttack(attack: SandwichAttack): SandwichAttackJSON {
  return {
    id: attack.id,
    victimWallet: attack.victimWallet,
    attackerWallet: attack.attackerWallet,
    slot: attack.slot,
    pool: attack.pool,
    tokenMint: attack.tokenMint,
    tokenSymbol: attack.tokenSymbol,
    victimTxSig: attack.victimTx.signature,
    frontrunTxSig: attack.frontrunTx.signature,
    backrunTxSig: attack.backrunTx.signature,
    lossLamports: attack.lossLamports.toString(),
    lossUSD: attack.lossUSD,
    botProfitLamports: attack.botProfitLamports.toString(),
    dex: attack.dex,
    detectedAt: attack.detectedAt.toISOString(),
    timestamp: attack.victimTx.timestamp,
  };
}

export function serializeReport(report: WalletReport): WalletReportJSON {
  return {
    wallet: report.wallet,
    attackCount: report.attackCount,
    totalLossSOL: report.totalLossSOL,
    totalLossUSD: report.totalLossUSD,
    worstAttack: report.worstAttack ? serializeAttack(report.worstAttack) : null,
    mostTargetedToken: report.mostTargetedToken,
    mostActiveAttacker: report.mostActiveAttacker,
    attacksByDex: report.attacksByDex,
    attacksByWeek: report.attacksByWeek,
    attacksByToken: report.attacksByToken,
    topAttackers: report.topAttackers,
    attacks: report.attacks.map(serializeAttack),
    timeRange: report.timeRange,
    analyzedAt: report.analyzedAt.toISOString(),
  };
}
