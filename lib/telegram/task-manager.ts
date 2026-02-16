// lib/telegram/task-manager.ts

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export type TaskType = 'scrape' | 'optimize' | 'cleanup' | 'notify' | 'analyze';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface CreateTaskParams {
    taskType: TaskType;
    title: string;
    description?: string;
    priority?: number;
    scheduledFor?: Date;
    triggeredBy?: string;
    telegramUserId?: string;
    context?: Record<string, any>;
}

interface Task {
    id: string;
    task_type: TaskType;
    status: TaskStatus;
    priority: number;
    title: string;
    description: string | null;
    scheduled_for: string;
    started_at: string | null;
    completed_at: string | null;
    retry_count: number;
    max_retries: number;
    result: Record<string, any>;
    error_message: string | null;
    triggered_by: string | null;
    telegram_user_id: string | null;
    context: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export class TaskManager {
    private supabase;

    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
        );
    }

    async createTask(params: CreateTaskParams): Promise<Task | null> {
        try {
            const { data, error } = await this.supabase
                .from('bot_tasks')
                .insert({
                    task_type: params.taskType,
                    title: params.title,
                    description: params.description,
                    priority: params.priority || 5,
                    scheduled_for: params.scheduledFor?.toISOString() || new Date().toISOString(),
                    triggered_by: params.triggeredBy || 'manual',
                    telegram_user_id: params.telegramUserId,
                    context: params.context || {},
                })
                .select()
                .single();

            if (error) {
                logger.error('[TaskManager] Error creating task', { error, params });
                return null;
            }

            logger.info('[TaskManager] Task created', { taskId: data.id, title: params.title });
            return data;
        } catch (err) {
            logger.error('[TaskManager] Exception creating task', { err, params });
            return null;
        }
    }

    async getPendingTasks(): Promise<Task[]> {
        try {
            const { data, error } = await this.supabase
                .from('bot_tasks')
                .select('*')
                .eq('status', 'pending')
                .order('priority', { ascending: false })
                .order('scheduled_for', { ascending: true });

            if (error) {
                logger.error('[TaskManager] Error fetching pending tasks', { error });
                return [];
            }

            return data || [];
        } catch (err) {
            logger.error('[TaskManager] Exception fetching pending tasks', { err });
            return [];
        }
    }

    async getTasksByStatus(status: TaskStatus, limit = 10): Promise<Task[]> {
        try {
            const { data, error } = await this.supabase
                .from('bot_tasks')
                .select('*')
                .eq('status', status)
                .order('updated_at', { ascending: false })
                .limit(limit);

            if (error) {
                logger.error('[TaskManager] Error fetching tasks by status', { error, status });
                return [];
            }

            return data || [];
        } catch (err) {
            logger.error('[TaskManager] Exception fetching tasks by status', { err, status });
            return [];
        }
    }

    async updateTaskStatus(
        taskId: string,
        status: TaskStatus,
        result?: Record<string, any>,
        errorMessage?: string
    ): Promise<boolean> {
        try {
            const updates: any = { status };

            if (status === 'running') {
                updates.started_at = new Date().toISOString();
            } else if (status === 'completed' || status === 'failed') {
                updates.completed_at = new Date().toISOString();
            }

            if (result) {
                updates.result = result;
            }

            if (errorMessage) {
                updates.error_message = errorMessage;
            }

            const { error } = await this.supabase
                .from('bot_tasks')
                .update(updates)
                .eq('id', taskId);

            if (error) {
                logger.error('[TaskManager] Error updating task status', { error, taskId, status });
                return false;
            }

            return true;
        } catch (err) {
            logger.error('[TaskManager] Exception updating task status', { err, taskId, status });
            return false;
        }
    }

    async addTaskLog(
        taskId: string,
        message: string,
        level: 'debug' | 'info' | 'warn' | 'error' = 'info',
        metadata?: Record<string, any>
    ): Promise<void> {
        try {
            await this.supabase.from('bot_task_logs').insert({
                task_id: taskId,
                log_level: level,
                message,
                metadata: metadata || {},
            });
        } catch (err) {
            logger.error('[TaskManager] Failed to add task log', { err, taskId, message });
        }
    }

    async getTaskStats(): Promise<{
        pending: number;
        running: number;
        completed_today: number;
        failed_today: number;
    }> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [pending, running, completedToday, failedToday] = await Promise.all([
                this.supabase.from('bot_tasks').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                this.supabase.from('bot_tasks').select('id', { count: 'exact', head: true }).eq('status', 'running'),
                this.supabase
                    .from('bot_tasks')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'completed')
                    .gte('completed_at', today.toISOString()),
                this.supabase
                    .from('bot_tasks')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'failed')
                    .gte('updated_at', today.toISOString()),
            ]);

            return {
                pending: pending.count || 0,
                running: running.count || 0,
                completed_today: completedToday.count || 0,
                failed_today: failedToday.count || 0,
            };
        } catch (err) {
            logger.error('[TaskManager] Error getting task stats', { err });
            return { pending: 0, running: 0, completed_today: 0, failed_today: 0 };
        }
    }
}

export const taskManager = new TaskManager();
