import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Camera, MessageCircle, Sparkles } from 'lucide-react';
import { createCheckoutSession } from '@/api/donate';
import { useLocale } from '@/i18n/LocaleContext';

interface DonateNudgeProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'upload' | 'mentor';
}

export default function DonateNudge({ isOpen, onClose, type }: DonateNudgeProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  const handleDonate = async () => {
    setIsLoading(true);
    try {
      const { url } = await createCheckoutSession(500, 'gbp');
      window.location.href = url;
    } catch (err) {
      console.error('Donate failed:', err);
      setIsLoading(false);
    }
  };

  const content = {
    upload: {
      icon: Camera,
      title: t('nudge.uploadTitle'),
      body: t('nudge.uploadBody'),
      cta: t('nudge.uploadCta'),
    },
    mentor: {
      icon: MessageCircle,
      title: t('nudge.mentorTitle'),
      body: t('nudge.mentorBody'),
      cta: t('nudge.mentorCta'),
    },
  };

  const { icon: Icon, title, body, cta } = content[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative bg-gradient-to-br from-gold-400/10 to-ink-900 border border-gold-400/20 rounded-2xl p-5 mb-6"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-ink-800/60 flex items-center justify-center text-cream-subtle hover:text-cream transition-colors"
          >
            <X className="w-3 h-3" strokeWidth={1.5} />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-gold-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-cream mb-1">{title}</h4>
              <p className="text-xs text-cream-subtle leading-relaxed mb-3">{body}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDonate}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-400 text-ink-950 text-xs font-bold hover:bg-gold-300 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Sparkles className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                  ) : (
                    <Heart className="w-3 h-3" strokeWidth={1.5} />
                  )}
                  {cta}
                </button>
                <button
                  onClick={onClose}
                  className="text-[11px] text-cream-subtle hover:text-cream transition-colors"
                >
                  {t('nudge.dismiss')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
