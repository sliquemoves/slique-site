// lib/agent-run-logger.js
// Wraps every cron job with start/finish logging to the agent_runs table.
// Gives you a full audit trail of every job run, success, failure, and count.

import { supabaseAdmin } from './supabase-admin.js';

/**
 * Start a new agent run log entry.
 * Call this at the top of every cron handler.
 *
 * @param {string} jobName - One of: discovery | enrichment | drafting | sending | webhook_processing
 * @returns {string} runId — pass this to finishRun()
 */
export async function startRun(jobName) {
  const { data, error } = await supabaseAdmin
    .from('agent_runs')
    .insert({
      job_name: jobName,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error(`[agent-run-logger] Failed to start run for ${jobName}:`, error);
    return null;
  }

  console.log(`[${jobName}] Run started: ${data.id}`);
  return data.id;
}

/**
 * Finish an agent run log entry.
 * Call this at the end of every cron handler — in both success and catch blocks.
 *
 * @param {string} runId - The ID returned by startRun()
 * @param {'success'|'failed'|'partial'} status
 * @param {{ processed?: number, succeeded?: number, failed?: number, errorLog?: any, notes?: string }} stats
 */
export async function finishRun(runId, status, stats = {}) {
  if (!runId) return;

  const { error } = await supabaseAdmin
    .from('agent_runs')
    .update({
      status,
      finished_at: new Date().toISOString(),
      items_processed: stats.processed ?? 0,
      items_succeeded: stats.succeeded ?? 0,
      items_failed: stats.failed ?? 0,
      error_log: stats.errorLog ?? null,
      notes: stats.notes ?? null,
    })
    .eq('id', runId);

  if (error) {
    console.error(`[agent-run-logger] Failed to finish run ${runId}:`, error);
  } else {
    console.log(`[agent-run-logger] Run ${runId} finished: ${status}`);
  }
}
