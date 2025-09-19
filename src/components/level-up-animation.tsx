'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, Gift } from 'lucide-react';

interface LevelUpAnimationProps {
  isVisible: boolean;
  newLevel: number;
  levelsGained: number;
  rewards?: {
    coins: number;
    keys: number;
  };
  onComplete?: () => void;
}

export function LevelUpAnimation({ 
  isVisible, 
  newLevel, 
  levelsGained, 
  rewards = { coins: 0, keys: 0 },
  onComplete 
}: LevelUpAnimationProps) {
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Show rewards after initial animation
      const timer = setTimeout(() => {
        setShowRewards(true);
      }, 1000);

      // Complete animation after showing rewards
      const completeTimer = setTimeout(() => {
        onComplete?.();
      }, 4000);

      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    } else {
      setShowRewards(false);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20,
              duration: 0.6 
            }}
            className="relative"
          >
            {/* Main Level Up Card */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-4 md:p-8 rounded-2xl shadow-2xl text-white text-center min-w-[280px] md:min-w-[400px] max-w-[90vw]"
            >
              {/* Animated Stars Background */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: Math.random() * 400, 
                      y: Math.random() * 300,
                      scale: 0,
                      opacity: 0
                    }}
                    animate={{ 
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 2,
                      delay: Math.random() * 0.5,
                      repeat: Infinity,
                      repeatDelay: Math.random() * 2
                    }}
                    className="absolute"
                  >
                    <Star className="w-4 h-4 text-yellow-200" />
                  </motion.div>
                ))}
              </div>

              {/* Level Up Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className="mb-4"
              >
                <Trophy className="w-16 h-16 mx-auto text-yellow-200" />
              </motion.div>

              {/* Level Up Text */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-4xl font-bold mb-2"
              >
                LEVEL UP!
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-xl mb-4"
              >
                You reached Level {newLevel}!
              </motion.p>

              {levelsGained > 1 && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                  className="text-lg mb-4 text-yellow-200"
                >
                  (+{levelsGained} levels gained!)
                </motion.p>
              )}

              {/* Rewards Section */}
              <AnimatePresence>
                {showRewards && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-6 p-4 bg-white/20 rounded-xl backdrop-blur-sm"
                  >
                    <h3 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2">
                      <Gift className="w-5 h-5" />
                      Rewards Earned
                    </h3>
                    
                    <div className="space-y-2">
                      {rewards.coins > 0 && (
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <span className="text-yellow-300">💰</span>
                          <span className="font-semibold">+{rewards.coins.toLocaleString()} Coins</span>
                        </motion.div>
                      )}
                      
                      {rewards.keys > 0 && (
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <span className="text-blue-300">🗝️</span>
                          <span className="font-semibold">+{rewards.keys} Level-Up Crate Key{rewards.keys > 1 ? 's' : ''}</span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress Bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1.2, duration: 1 }}
                className="mt-6 h-2 bg-white/30 rounded-full overflow-hidden"
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ delay: 1.2, duration: 1 }}
                  className="h-full bg-gradient-to-r from-yellow-300 to-yellow-100"
                />
              </motion.div>
            </motion.div>

            {/* Confetti Effect */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 25 : 50)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: typeof window !== 'undefined' ? Math.random() * Math.min(window.innerWidth, 400) : Math.random() * 400,
                    y: -10,
                    rotate: 0,
                    scale: 0
                  }}
                  animate={{ 
                    y: typeof window !== 'undefined' ? Math.min(window.innerHeight, 600) + 10 : 610,
                    rotate: 360,
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 3,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                  className="absolute w-2 h-2"
                  style={{
                    backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)]
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
