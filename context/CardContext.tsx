import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

export interface CardData {
  card_id: string;
  card_number: string;
  card_discount: number;
  client_name: string;
}

interface CardContextValue {
  card: CardData | null;
  loading: boolean;
  error: string | null;
  refreshCard: () => Promise<void>;
}

const STORAGE_KEY = '@discount_card';
const REGION = 'europe-central2';
const CARD_TTL_MS = 5 * 60 * 1000;

const CardContext = createContext<CardContextValue>({
  card: null,
  loading: false,
  error: null,
  refreshCard: async () => {},
});

async function getStoredCardNumber(uid: string): Promise<string | null> {
  const cached = await AsyncStorage.getItem(STORAGE_KEY);
  if (cached) {
    return (JSON.parse(cached) as CardData).card_number;
  }
  const snap = await getDoc(doc(getFirestore(), 'users', uid));
  return (snap.data()?.cardNumber as string) ?? null;
}

async function persistCard(cardData: CardData, uid: string): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cardData)),
    updateDoc(doc(getFirestore(), 'users', uid), { cardNumber: cardData.card_number, cardId: cardData.card_id }),
  ]);
}

export function CardProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);
  const lastFetchedAt = useRef(0);

  const fetchOrCreate = useCallback(async (silent: boolean) => {
    if (!user || !profile?.phoneNumber || !profile.firstName) {
      console.warn('[CardContext] early return — missing user/profile fields', {
        hasUser: !!user,
        hasPhone: !!profile?.phoneNumber,
        hasFirstName: !!profile?.firstName,
      });
      return;
    }
    if (isFetching.current) {
      return;
    }
    if (lastFetchedAt.current > 0 && Date.now() - lastFetchedAt.current < CARD_TTL_MS) {
      return;
    }
    isFetching.current = true;

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const fn = getFunctions(undefined, REGION);
      const clientName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
      const cardNumber = await getStoredCardNumber(user.uid);

      let cardData: CardData;

      if (cardNumber) {
        try {
          const result = await httpsCallable<{ cardNumber: string }, CardData>(
            fn, 'getDiscountCard',
          )({ cardNumber });
          cardData = result.data;
        } catch (err: any) {
          console.error('[CardContext] getDiscountCard error', {
            code: err?.code,
            message: err?.message,
            details: err?.details,
            raw: err,
          });
          if (err?.code === 'functions/not-found') {
            await AsyncStorage.removeItem(STORAGE_KEY);
            const result = await httpsCallable<{ clientName: string; phoneNumber: string }, CardData>(
              fn, 'createDiscountCard',
            )({ clientName, phoneNumber: profile.phoneNumber });
            cardData = result.data;
          } else {
            throw err;
          }
        }
      } else {
        const result = await httpsCallable<{ clientName: string; phoneNumber: string }, CardData>(
          fn, 'createDiscountCard',
        )({ clientName, phoneNumber: profile.phoneNumber });
        cardData = result.data;
      }

      setCard(cardData);
      lastFetchedAt.current = Date.now();
      await persistCard(cardData, user.uid);
    } catch (err: any) {
      console.error('[CardContext] unhandled error', {
        code: err?.code,
        message: err?.message,
        details: err?.details,
        raw: err,
      });
      if (!silent) {
        setError(err?.message ?? 'Failed to load card');
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [user, profile]);

  useEffect(() => {
    if (!user || !profile?.firstName || !profile.phoneNumber) return;

    (async () => {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        setCard(JSON.parse(cached) as CardData);
        fetchOrCreate(true);
      } else {
        // If the user already has a card number on their profile, fetch silently
        // in the background without showing a loader.
        const isReturningUser = !!profile.cardNumber;
        fetchOrCreate(isReturningUser);
      }
    })();
  }, [user?.uid, profile?.firstName]);

  useEffect(() => {
    if (!user) {
      setCard(null);
      setError(null);
      setLoading(false);
      AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const refreshCard = useCallback(
    () => fetchOrCreate(card !== null || !!profile?.cardNumber),
    [fetchOrCreate, card, profile?.cardNumber],
  );

  return (
    <CardContext.Provider value={{ card, loading, error, refreshCard }}>
      {children}
    </CardContext.Provider>
  );
}

export const useCard = () => useContext(CardContext);
