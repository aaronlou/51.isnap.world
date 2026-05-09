import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Loader2 } from 'lucide-react';
import { createCheckoutSession } from '@/api/donate';

type Currency = 'gbp' | 'usd';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS: Record<Currency, { label: string; value: number }[]> = {
  gbp: [
    { label: '£0.5', value: 50 },
    { label: '£1', value: 100 },
    { label: '£5', value: 500 },
    { label: '£10', value: 1000 },
  ],
  usd: [
    { label: '$0.5', value: 50 },
    { label: '$1', value: 100 },
    { label: '$5', value: 500 },
    { label: '$10', value: 1000 },
  ],
};

const SYMBOL: Record<Currency, string> = {
  gbp: '£',
  usd: '$',
};

function detectCurrency(): Currency {
  try {
    const lang = navigator.language || 'en-GB';
    // 美国、加拿大、澳洲等用 USD，其余默认 GBP
    if (lang.startsWith('en-US') || lang.startsWith('en-CA') || lang.startsWith('en-AU')) {
      return 'usd';
    }
    return 'gbp';
  } catch {
    return 'gbp';
  }
}

export default function DonateModal({ isOpen, onClose }: DonateModalProps) {
  const [currency, setCurrency] = useState<Currency>(detectCurrency());
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 切换货币时重置选择
  const handleCurrencyChange = (c: Currency) => {
    setCurrency(c);
    setSelectedAmount(500);
    setCustomAmount('');
    setError(null);
  };

  const handleSelect = (value: number) => {
    setSelectedAmount(value);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      setCustomAmount(val);
      if (val) {
        setSelectedAmount(null);
      }
      setError(null);
    }
  };

  const getAmountInCents = (): number => {
    if (selectedAmount !== null) return selectedAmount;
    const val = parseFloat(customAmount);
    if (isNaN(val) || val <= 0) return 0;
    return Math.round(val * 100);
  };

  const handleDonate = async () => {
    const amount = getAmountInCents();
    if (amount < 50) {
      setError(`最低支持 ${SYMBOL[currency]}0.50`);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { url } = await createCheckoutSession(amount, currency);
      window.location.href = url;
    } catch (err: any) {
      setError(err.response?.data?.error || '创建支付会话失败，请稍后重试');
      setIsLoading(false);
    }
  };

  // 打开时根据当前浏览器语言重新检测货币
  useEffect(() => {
    if (isOpen) {
      setCurrency(detectCurrency());
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/90 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-ink-900 border border-ink-800/80 rounded-3xl overflow-hidden p-8">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-ink-800/80 flex items-center justify-center text-cream-muted hover:text-cream transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-5 h-5 text-gold-400" strokeWidth={1.5} />
                </div>
                <h3 className="heading-display text-2xl text-cream mb-2">支持我们</h3>
                <p className="text-xs text-cream-subtle">
                  您的支持将帮助我们持续改进产品体验
                </p>
              </div>

              {/* Currency switcher */}
              <div className="flex items-center justify-center gap-1 mb-5 bg-ink-800/40 rounded-full p-1 w-fit mx-auto border border-ink-700/30">
                <button
                  onClick={() => handleCurrencyChange('gbp')}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    currency === 'gbp'
                      ? 'bg-gold-400/15 text-gold-400'
                      : 'text-cream-subtle hover:text-cream'
                  }`}
                >
                  £ GBP
                </button>
                <button
                  onClick={() => handleCurrencyChange('usd')}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    currency === 'usd'
                      ? 'bg-gold-400/15 text-gold-400'
                      : 'text-cream-subtle hover:text-cream'
                  }`}
                >
                  $ USD
                </button>
              </div>

              {/* Preset amounts */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {PRESETS[currency].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleSelect(preset.value)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedAmount === preset.value
                        ? 'bg-gold-400/15 border border-gold-400/40 text-gold-400'
                        : 'bg-ink-800/60 border border-ink-700/40 text-cream-muted hover:text-cream hover:border-ink-600/50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cream-subtle text-sm">
                  {SYMBOL[currency]}
                </span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomChange}
                  placeholder="自定义金额"
                  className="w-full bg-ink-800/60 border border-ink-700/40 rounded-xl py-2.5 pl-8 pr-4 text-sm text-cream placeholder:text-cream-subtle/50 focus:outline-none focus:border-gold-400/40 transition-colors"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-400 text-center mb-4">{error}</p>
              )}

              {/* CTA */}
              <button
                onClick={handleDonate}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gold-400 text-ink-950 text-sm font-bold hover:bg-gold-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    跳转中...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" strokeWidth={1.5} />
                    确认支持 {SYMBOL[currency]}{(getAmountInCents() / 100).toFixed(2)}
                  </>
                )}
              </button>

              <p className="text-[10px] text-cream-subtle/50 text-center mt-4">
                由 Stripe 提供安全支付保障 · 支持 Visa / Mastercard / 支付宝
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
