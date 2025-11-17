'use server';

import { notFound } from 'next/navigation';

import { flowsRepository } from 'src/db/repositories';
import { supabaseService } from 'src/services';

export async function getFlowWithPkdIds(flowId: string) {
  const supabase = await supabaseService.createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const flow = await flowsRepository.getByIdWithPkd(flowId);

  if (!flow || flow.accountId !== user?.id) {
    notFound();
  }

  const transformedFlow = {
    ...flow,
    pkdNumberIds: flow.pkdNumbers.map((pkd) => pkd.pkdId),
  };

  return transformedFlow;
}
