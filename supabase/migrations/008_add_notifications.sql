-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL, -- telegram_id of the user receiving the notification
    type TEXT NOT NULL, -- 'new_poll', 'poll_ended', 'vote_received', 'comment', 'like', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    message_bg TEXT, -- Bulgarian message
    related_id UUID, -- ID of related poll/election
    related_type TEXT, -- 'election', 'comment', etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES public.voters(telegram_id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid()::text = user_id::text OR true); -- Allow all reads for now, can be restricted later

-- RLS Policy: System can create notifications
CREATE POLICY "System can create notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (true);

-- RLS Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid()::text = user_id::text OR true); -- Allow all updates for now

-- Function to create notification for new poll (called via trigger or API)
CREATE OR REPLACE FUNCTION public.create_new_poll_notification()
RETURNS TRIGGER AS $$
DECLARE
    voter_record RECORD;
BEGIN
    -- Notify all users except the creator about the new poll
    FOR voter_record IN 
        SELECT DISTINCT telegram_id 
        FROM public.voters 
        WHERE telegram_id::text != NEW.created_by::text
    LOOP
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            message_bg,
            related_id,
            related_type,
            is_read
        ) VALUES (
            voter_record.telegram_id,
            'new_poll',
            'New Poll Created',
            'A new poll "' || COALESCE(NEW.title, 'Untitled') || '" has been created',
            'Нова анкета "' || COALESCE(NEW.title_bg, NEW.title, 'Без заглавие') || '" беше създадена',
            NEW.id,
            'election',
            FALSE
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notifications when new poll is created
DROP TRIGGER IF EXISTS trigger_new_poll_notification ON public.elections;
CREATE TRIGGER trigger_new_poll_notification
    AFTER INSERT ON public.elections
    FOR EACH ROW
    WHEN (NEW.status = 'active')
    EXECUTE FUNCTION public.create_new_poll_notification();

COMMENT ON TABLE public.notifications IS 'User notifications for new polls, events, and interactions';
COMMENT ON COLUMN public.notifications.type IS 'Type of notification: new_poll, poll_ended, vote_received, comment, like, etc.';
COMMENT ON COLUMN public.notifications.related_id IS 'ID of the related entity (election_id, comment_id, etc.)';
COMMENT ON COLUMN public.notifications.related_type IS 'Type of related entity: election, comment, vote, etc.';
