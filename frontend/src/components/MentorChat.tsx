import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Loader2, Sparkles, User, AlertCircle } from 'lucide-react';
import { fetchMentorChat, sendMentorMessage } from '@/api/mentor';
import type { MentorMessage as MentorMessageType } from '@/api/mentor';
import { fetchQuota } from '@/api/me';
import { useLocale } from '@/i18n/LocaleContext';
import DonateNudge from './DonateNudge';

interface MentorChatProps {
  photoId: string;
}

export default function MentorChat({ photoId }: MentorChatProps) {
  const { t } = useLocale();
  const [messages, setMessages] = useState<MentorMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isDonor, setIsDonor] = useState(false);
  const [showDonateNudge, setShowDonateNudge] = useState(false);
  const [hasSeenDonateHint, setHasSeenDonateHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const [chatData, quota] = await Promise.all([
        fetchMentorChat(photoId),
        fetchQuota(),
      ]);
      setMessages(chatData.messages);
      setIsDonor(quota.is_donor);
    } catch (err: any) {
      console.error('Failed to load mentor chat:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [photoId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    const userMsg: MentorMessageType = {
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await sendMentorMessage(photoId, trimmed);
      setMessages(res.messages);

      // 超过免费额度后，首次弹出捐赠引导（不阻断对话）
      if (res.remaining < 0 && !isDonor && !hasSeenDonateHint) {
        setShowDonateNudge(true);
      }
    } catch (err: any) {
      setError(t('mentor.error'));
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const dismissDonateNudge = () => {
    setShowDonateNudge(false);
    setHasSeenDonateHint(true);
  };

  return (
    <div className="mt-6 border-t border-ink-800/40 pt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-4 h-4 text-gold-400" strokeWidth={1.5} />
        <span className="text-xs font-medium tracking-[0.15em] uppercase text-cream-muted">
          {t('mentor.title')}
        </span>
      </div>

      {/* Donate Nudge — 超过额度后弹出一次，可关闭 */}
      {!isDonor && showDonateNudge && (
        <DonateNudge
          isOpen={true}
          onClose={dismissDonateNudge}
          type="mentor"
        />
      )}

      {/* Messages */}
      <div className="space-y-3 mb-4 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
        {isLoadingHistory && messages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 text-cream-subtle animate-spin" strokeWidth={1.5} />
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                msg.role === 'user'
                  ? 'bg-ink-700 text-cream-subtle'
                  : 'bg-gold-400/15 text-gold-400'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-3 h-3" strokeWidth={1.5} />
                ) : (
                  <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                )}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-ink-800 text-cream'
                  : 'bg-ink-800/50 border border-ink-700/30 text-cream-muted'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 pl-8"
          >
            <Loader2 className="w-3 h-3 text-gold-400 animate-spin" strokeWidth={1.5} />
            <span className="text-[11px] text-cream-subtle">{t('mentor.thinking')}</span>
          </motion.div>
        )}

        {error && (
          <div className="flex items-center gap-2 pl-8 text-red-400 text-[11px]">
            <AlertCircle className="w-3 h-3" strokeWidth={1.5} />
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={t('mentor.placeholder')}
          className="w-full bg-ink-800/60 border border-ink-700/40 rounded-xl pl-4 pr-11 py-2.5 text-xs text-cream placeholder:text-cream-subtle/40 focus:outline-none focus:border-gold-400/40 transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-gold-400/10 border border-gold-400/20 flex items-center justify-center text-gold-400 hover:bg-gold-400/20 transition-colors disabled:opacity-30 disabled:hover:bg-gold-400/10"
        >
          <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-cream-subtle/40 mt-2">
        {isDonor ? t('mentor.hintDonor') : t('mentor.hint')}
      </p>
    </div>
  );
}
