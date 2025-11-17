import {
  accountEmailsRepository,
  companiesRepository,
  emailFirstContactsRepository,
  flowsRepository,
  suppressionListRepository,
} from 'src/db/repositories';

export type Assignment = {
  flowId: string;
  accountEmailId: string; // sender email
  companyId: string; // recipient
};

export type PlanResult = {
  assignments: Assignment[];
  stats: {
    totalCompaniesConsidered: number;
    totalAvailableSlots: number;
    perAccountEmail: Record<string, number>;
    perFlow: Record<string, number>;
  };
};

/**
 * Configuration for planning email campaigns for accounting firms
 */
export interface AllocationConfig {
  /** Maximum number of unique senders per company (default: 2) */
  maxUniqueSendersPerCompany: number;

  /** Period in days for fetching new companies (default: 7 days) */
  companyAgeLimitDays: number;

  /** Quota distribution strategy among email addresses */
  quotaDistributionStrategy: 'equal' | 'proportional';

  /** Flow selection strategy for an email address */
  flowSelectionStrategy: 'round_robin' | 'least_loaded' | 'random';

  /** Maximum number of assignments per email address */
  maxAssignmentsPerAccountEmail: number;
}

type CompanyWithPkdAndSlots = Awaited<
  ReturnType<typeof companiesRepository.getWithPkdsForAllocation>
>;

export class AllocationService {
  /**
   * Default configuration for scheduling campaigns
   */
  private getDefaultConfig(): AllocationConfig {
    return {
      maxUniqueSendersPerCompany: 2,
      companyAgeLimitDays: 7,
      quotaDistributionStrategy: 'equal',
      flowSelectionStrategy: 'least_loaded',
      maxAssignmentsPerAccountEmail: Infinity,
    };
  }

  /**
   * Main method for planning email campaigns for accounting firms
   *
   * Algorithm:
   * 1. Loads new companies (for the last N days)
   * 2. Finds active flows and their sender email addresses
   * 3. Matches companies with flows by PKD codes
   * 4. Distributes companies fairly among email addresses
   * 5. Creates an email sending plan
   */
  async plan(config: Partial<AllocationConfig> = {}): Promise<PlanResult> {
    const fullConfig = { ...this.getDefaultConfig(), ...config };

    // 1. Load data: companies, flows, exclusions
    const context = await this.loadAllocationData(fullConfig);

    // 2. Calculate available slots for each company
    const availableSlots = this.calculateAvailableSlots(
      context.companies,
      fullConfig,
    );

    // 3. Find compatible "flow-company" pairs by PKD codes
    const matches = this.findCompatibleMatches(context, availableSlots);

    // 4. Distribute quotas among email addresses
    const quotas = this.calculateAccountEmailQuotas(
      availableSlots,
      matches,
      fullConfig,
    );

    // 5. Create final distribution plan
    const distribution = this.createDistributionPlan(
      quotas,
      availableSlots,
      matches,
      fullConfig,
    );

    // 6. Collect statistics for reporting
    return this.buildPlanResult(
      distribution,
      context.companies,
      availableSlots,
    );
  }

  // ---------- private helpers ----------

  /**
   * 1. Loads all necessary data for planning
   * - Active flows with their sender email addresses
   * - New companies (for the specified period) with PKD codes
   * - Suppressed "email-company" pairs
   * - Existing contacts (to avoid duplication)
   */
  private async loadAllocationData(config: AllocationConfig) {
    const [flows, companies, suppressed, existingPairs] = await Promise.all([
      flowsRepository.getActiveWithPkd(),
      companiesRepository.getWithPkdsForAllocation({
        companyAgeLimitDays: config.companyAgeLimitDays,
        maxUniqueSendersCountForCompany: config.maxUniqueSendersPerCompany,
      }),
      suppressionListRepository.getSuppressedPairs(),
      emailFirstContactsRepository.getExistingPairs(),
    ]);

    // Get all active email addresses for accounts that have flows
    const accountIds = [...new Set(flows.map((flow) => flow.accountId))];
    const accountEmailsPromises = accountIds.map((accountId) =>
      accountEmailsRepository.getActiveByAccountId(accountId),
    );
    const accountEmailsArrays = await Promise.all(accountEmailsPromises);

    // Create a flat list of all active email addresses
    const accountEmails = accountEmailsArrays.flat();

    // Create indexes for quick access
    const flowsByAccountEmail = new Map<string, string[]>();
    const accountEmailsByAccount = new Map<string, string[]>();

    // Group email addresses by accounts
    for (const accountEmail of accountEmails) {
      const emails = accountEmailsByAccount.get(accountEmail.accountId) ?? [];
      emails.push(accountEmail.id);
      accountEmailsByAccount.set(accountEmail.accountId, emails);
    }

    // For each email address, find available flows
    for (const flow of flows) {
      const accountEmailIds = accountEmailsByAccount.get(flow.accountId) ?? [];
      for (const accountEmailId of accountEmailIds) {
        const emailFlows = flowsByAccountEmail.get(accountEmailId) ?? [];
        emailFlows.push(flow.id);
        flowsByAccountEmail.set(accountEmailId, emailFlows);
      }
    }

    return {
      flows,
      companies,
      accountEmails,
      flowsByAccountEmail,
      accountEmailsByAccount,
      suppressed,
      existingPairs,
    };
  }

  /**
   * 2. Calculate available slots for each company
   * Slot = opportunity to add another sender for a company
   * Example: limit 2 senders, already 1 -> 1 slot remaining
   */
  private calculateAvailableSlots(
    companies: CompanyWithPkdAndSlots,
    config: AllocationConfig,
  ) {
    const slotsMap = new Map<string, number>();

    for (const company of companies) {
      const availableSlots = Math.max(
        0,
        config.maxUniqueSendersPerCompany - (company.uniqueSendersCount ?? 0),
      );

      // Add only companies with available slots
      if (availableSlots > 0) {
        slotsMap.set(company.id, availableSlots);
      }
    }

    return slotsMap;
  }

  /**
   * 3. Find compatible "flow-company" pairs for each email address
   * Checks compatibility by PKD codes and applies exclusion filters
   */
  private findCompatibleMatches(
    context: Awaited<ReturnType<AllocationService['loadAllocationData']>>,
    availableSlots: Map<string, number>,
  ) {
    const companyIds = new Set(context.companies.map((c) => c.id));
    const companiesById = new Map(context.companies.map((c) => [c.id, c]));
    const candidatesByFlow = new Map<string, string[]>();
    const candidatesByAccountEmail = new Map<string, string[]>();

    // For each flow, find suitable companies
    for (const flow of context.flows) {
      const matchedCompanies: string[] = [];
      const flowPkdIds = flow.pkdNumbers.map((p) => p.pkdId);

      for (const companyId of companyIds) {
        // Check if company has available slots
        if ((availableSlots.get(companyId) ?? 0) <= 0) continue;

        const company = companiesById.get(companyId)!;
        const companyPkdIds = company.pkdNumbers.map((p) => p.pkdId);

        // Check for intersection of PKD codes
        const companyPkdSet = companyPkdIds.length
          ? new Set(companyPkdIds)
          : null;
        if (!companyPkdSet) continue;

        // Look for at least one PKD code match
        let hasMatchingPkd = false;
        for (const pkdId of flowPkdIds) {
          if (companyPkdSet.has(pkdId)) {
            hasMatchingPkd = true;
            break;
          }
        }
        if (!hasMatchingPkd) continue;

        matchedCompanies.push(companyId);
      }
      candidatesByFlow.set(flow.id, matchedCompanies);
    }

    // For each email address, find available companies considering filters
    for (const [
      accountEmailId,
      flowIds,
    ] of context.flowsByAccountEmail.entries()) {
      const uniqueCompanies = new Set<string>();

      for (const flowId of flowIds) {
        const flowCandidates = candidatesByFlow.get(flowId) ?? [];

        for (const companyId of flowCandidates) {
          // Apply exclusion filters at email address level
          const pairKey = `${accountEmailId}:${companyId}`;
          if (context.suppressed.has(pairKey)) continue; // Suppressed pair
          if (context.existingPairs.has(pairKey)) continue; // Already existing contact

          uniqueCompanies.add(companyId);
        }
      }

      candidatesByAccountEmail.set(accountEmailId, [...uniqueCompanies]);
    }

    return {
      candidatesByFlow,
      candidatesByAccountEmail,
      flowsByAccountEmail: context.flowsByAccountEmail,
    };
  }

  /**
   * 4. Calculate quotas for email addresses
   * Fairly distributes available slots among all email addresses
   */
  private calculateAccountEmailQuotas(
    availableSlots: Map<string, number>,
    matches: ReturnType<AllocationService['findCompatibleMatches']>,
    config: AllocationConfig,
  ) {
    const accountEmails = [...matches.candidatesByAccountEmail.keys()];

    // Count total available slots
    let totalSlots = 0;
    for (const slots of availableSlots.values()) {
      totalSlots += slots;
    }

    if (config.quotaDistributionStrategy === 'equal') {
      return this.distributeQuotasEquallyForEmails(
        accountEmails,
        totalSlots,
        matches.candidatesByAccountEmail,
        config,
      );
    } else {
      return this.distributeQuotasProportionallyForEmails(
        accountEmails,
        totalSlots,
        matches.candidatesByAccountEmail,
        config,
      );
    }
  }

  /**
   * Equal distribution of quotas among email addresses
   */
  private distributeQuotasEquallyForEmails(
    accountEmails: string[],
    totalSlots: number,
    candidatesByAccountEmail: Map<string, string[]>,
    config: AllocationConfig,
  ) {
    const baseQuota = Math.floor(
      totalSlots / Math.max(1, accountEmails.length),
    );
    let remainder = totalSlots % Math.max(1, accountEmails.length);

    const quotas = new Map<string, number>();

    // Set base quotas considering limits
    for (const accountEmailId of accountEmails) {
      const maxPossible =
        candidatesByAccountEmail.get(accountEmailId)?.length ?? 0;
      const maxAllowed = config.maxAssignmentsPerAccountEmail;
      const quota = Math.min(baseQuota, maxPossible, maxAllowed);
      quotas.set(accountEmailId, quota);
    }

    // Distribute remainder in a round-robin fashion
    while (remainder > 0) {
      let distributed = false;

      for (const accountEmailId of accountEmails) {
        if (remainder === 0) break;

        const currentQuota = quotas.get(accountEmailId) ?? 0;
        const maxPossible =
          candidatesByAccountEmail.get(accountEmailId)?.length ?? 0;
        const maxAllowed = config.maxAssignmentsPerAccountEmail;

        if (currentQuota < Math.min(maxPossible, maxAllowed)) {
          quotas.set(accountEmailId, currentQuota + 1);
          remainder--;
          distributed = true;
        }
      }

      if (!distributed) break; // Failed to distribute remainder
    }

    return quotas;
  }

  /**
   * Proportional distribution of quotas (by number of candidates)
   */
  private distributeQuotasProportionallyForEmails(
    accountEmails: string[],
    totalSlots: number,
    candidatesByAccountEmail: Map<string, string[]>,
    config: AllocationConfig,
  ) {
    // Count total candidates
    let totalCandidates = 0;
    for (const candidates of candidatesByAccountEmail.values()) {
      totalCandidates += candidates.length;
    }

    const quotas = new Map<string, number>();

    for (const accountEmailId of accountEmails) {
      const candidatesCount =
        candidatesByAccountEmail.get(accountEmailId)?.length ?? 0;
      const proportion =
        totalCandidates > 0 ? candidatesCount / totalCandidates : 0;
      const quota = Math.floor(totalSlots * proportion);
      const maxAllowed = config.maxAssignmentsPerAccountEmail;

      quotas.set(accountEmailId, Math.min(quota, candidatesCount, maxAllowed));
    }

    return quotas;
  }

  /**
   * 5. Create final distribution plan
   * Uses round-robin algorithm for fair distribution
   */
  private createDistributionPlan(
    quotas: Map<string, number>,
    availableSlots: Map<string, number>,
    matches: ReturnType<AllocationService['findCompatibleMatches']>,
    config: AllocationConfig,
  ) {
    const accountEmails = [...matches.flowsByAccountEmail.keys()];
    const assignments: Assignment[] = [];
    const assignedPerFlow = new Map<string, number>();
    const perAccountEmail: Record<string, number> = {};

    // Initialize counters
    for (const accountEmailId of accountEmails) {
      perAccountEmail[accountEmailId] = 0;
    }
    for (const flowId of matches.candidatesByFlow.keys()) {
      assignedPerFlow.set(flowId, 0);
    }

    const usedPairs = new Set<string>(); // "accountEmailId:companyId" - already used pairs

    /**
     * Selects optimal flow for sending to a company
     * Strategy depends on configuration
     */
    const selectOptimalFlow = (
      accountEmailId: string,
      companyId: string,
    ): string | null => {
      const accountEmailFlows =
        matches.flowsByAccountEmail.get(accountEmailId) ?? [];
      const eligibleFlows: { id: string; load: number }[] = [];

      // Find all suitable flows
      for (const flowId of accountEmailFlows) {
        const flowCandidates = matches.candidatesByFlow.get(flowId) ?? [];
        if (flowCandidates.includes(companyId)) {
          const load = assignedPerFlow.get(flowId) ?? 0;
          eligibleFlows.push({ id: flowId, load });
        }
      }

      if (eligibleFlows.length === 0) return null;

      // Apply selection strategy
      if (config.flowSelectionStrategy === 'least_loaded') {
        return eligibleFlows.reduce((best, current) =>
          current.load < best.load ? current : best,
        ).id;
      } else if (config.flowSelectionStrategy === 'random') {
        const randomIndex = Math.floor(Math.random() * eligibleFlows.length);
        return eligibleFlows[randomIndex].id;
      } else {
        // round_robin - take the first available
        return eligibleFlows[0].id;
      }
    };

    // Main distribution loop (round-robin)
    let hasProgress = true;
    while (hasProgress) {
      hasProgress = false;

      for (const accountEmailId of accountEmails) {
        const remainingQuota = quotas.get(accountEmailId) ?? 0;
        if (remainingQuota <= 0) continue;

        const accountEmailCandidates =
          matches.candidatesByAccountEmail.get(accountEmailId) ?? [];
        let assignmentMade = false;

        // Find the first available company for this email address
        for (const companyId of accountEmailCandidates) {
          const companySlots = availableSlots.get(companyId) ?? 0;
          if (companySlots <= 0) continue;

          const pairKey = `${accountEmailId}:${companyId}`;
          if (usedPairs.has(pairKey)) continue;

          // Select optimal flow for this pair
          const selectedFlowId = selectOptimalFlow(accountEmailId, companyId);
          if (!selectedFlowId) continue;

          // Create assignment
          assignments.push({
            accountEmailId,
            flowId: selectedFlowId,
            companyId,
          });

          // Update counters
          perAccountEmail[accountEmailId] += 1;
          assignedPerFlow.set(
            selectedFlowId,
            (assignedPerFlow.get(selectedFlowId) ?? 0) + 1,
          );
          usedPairs.add(pairKey);
          availableSlots.set(companyId, companySlots - 1);
          quotas.set(accountEmailId, remainingQuota - 1);

          assignmentMade = true;
          hasProgress = true;
          break; // Move to next email address
        }

        // If no assignment could be made, reset quota
        if (!assignmentMade) {
          quotas.set(accountEmailId, 0);
        }
      }
    }

    // Formulate flow statistics
    const perFlow: Record<string, number> = {};
    for (const [flowId, count] of assignedPerFlow.entries()) {
      perFlow[flowId] = count;
    }

    return { assignments, perFlow, perAccountEmail };
  }

  /**
   * 6. Build final planning result
   * Collects all assignments and statistics for reporting
   */
  private buildPlanResult(
    distribution: ReturnType<AllocationService['createDistributionPlan']>,
    companies: CompanyWithPkdAndSlots,
    availableSlots: Map<string, number>,
  ): PlanResult {
    const totalCompaniesConsidered = companies.length;

    // Count remaining slots after distribution
    let remainingSlots = 0;
    for (const slots of availableSlots.values()) {
      remainingSlots += slots;
    }

    const totalAssigned = distribution.assignments.length;
    const totalAvailableSlots = remainingSlots + totalAssigned;

    return {
      assignments: distribution.assignments,
      stats: {
        totalCompaniesConsidered,
        totalAvailableSlots,
        perAccountEmail: distribution.perAccountEmail,
        perFlow: distribution.perFlow,
      },
    };
  }
}

const allocationService = new AllocationService();

export default allocationService;
