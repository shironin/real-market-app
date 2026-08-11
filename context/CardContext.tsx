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
  refreshCard: (force?: boolean) => Promise<void>;
}

type CardStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CardState {
  ownerUid: string | null;
  status: CardStatus;
  card: CardData | null;
  error: string | null;
}

const LEGACY_STORAGE_KEY = '@discount_card';
const STORAGE_KEY_PREFIX = '@discount_card:';
const REGION = 'europe-central2';
const CARD_TTL_MS = 5 * 60 * 1000;

const EMPTY_STATE: CardState = {
  ownerUid: null,
  status: 'idle',
  card: null,
  error: null,
};

const CardContext = createContext<CardContextValue>({
  card: null,
  loading: false,
  error: null,
  refreshCard: async () => {},
});

function cardStorageKey(uid: string): string {
  return `${STORAGE_KEY_PREFIX}${uid}`;
}

export async function clearCardCache(uid: string): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(cardStorageKey(uid)),
    AsyncStorage.removeItem(LEGACY_STORAGE_KEY),
  ]);
}

function isCardData(value: unknown): value is CardData {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<CardData>;
  return typeof candidate.card_id === 'string'
    && candidate.card_id.length > 0
    && typeof candidate.card_number === 'string'
    && candidate.card_number.length > 0
    && typeof candidate.card_discount === 'number'
    && Number.isFinite(candidate.card_discount)
    && typeof candidate.client_name === 'string';
}

async function getCachedCard(uid: string): Promise<CardData | null> {
  const key = cardStorageKey(uid);
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const parsed: unknown = JSON.parse(cached);
    if (isCardData(parsed)) return parsed;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    // Cache failures must not prevent recovery from Firestore/the API.
    console.error('[CardContext] getCachedCard error', error);
  }

  return null;
}

async function getStoredCardNumber(uid: string): Promise<string | null> {
  const cached = await getCachedCard(uid);
  if (cached) return cached.card_number;

  const snap = await getDoc(doc(getFirestore(), 'users', uid));
  const cardNumber: unknown = snap.data()?.cardNumber;
  return typeof cardNumber === 'string' && cardNumber.length > 0 ? cardNumber : null;
}

async function persistCard(cardData: CardData, uid: string): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(cardStorageKey(uid), JSON.stringify(cardData)),
    updateDoc(doc(getFirestore(), 'users', uid), {
      cardNumber: cardData.card_number,
      cardId: cardData.card_id,
    }),
  ]);
}

export function CardProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const uid = user?.uid ?? null;
  const hasCompleteProfile = !!uid && !!profile?.phoneNumber && !!profile.firstName;
  const [state, setState] = useState<CardState>(EMPTY_STATE);
  const stateRef = useRef<CardState>(EMPTY_STATE);
  const currentUidRef = useRef<string | null>(uid);
  const previousUidRef = useRef<string | null>(null);
  const inFlightRef = useRef<{ uid: string; promise: Promise<void> } | null>(null);
  const lastFetchedRef = useRef<{ uid: string; at: number } | null>(null);

  currentUidRef.current = uid;

  const applyState = useCallback((nextState: CardState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const fetchOrCreate = useCallback((force = false): Promise<void> => {
    const requestUid = user?.uid;
    const phoneNumber = profile?.phoneNumber;
    const firstName = profile?.firstName;
    const lastName = profile?.lastName;

    if (!requestUid || !phoneNumber || !firstName) {
      return Promise.resolve();
    }

    const currentState = stateRef.current;
    const hasVisibleCard = currentState.ownerUid === requestUid && currentState.card !== null;
    const lastFetched = lastFetchedRef.current;

    if (
      !force
      && hasVisibleCard
      && lastFetched?.uid === requestUid
      && Date.now() - lastFetched.at < CARD_TTL_MS
    ) {
      return Promise.resolve();
    }

    if (inFlightRef.current?.uid === requestUid) {
      return inFlightRef.current.promise;
    }

    if (!hasVisibleCard) {
      applyState({ ownerUid: requestUid, status: 'loading', card: null, error: null });
    }

    const operation = (async () => {
      try {
        const fn = getFunctions(undefined, REGION);
        const clientName = [firstName, lastName].filter(Boolean).join(' ');
        const cardNumber = await getStoredCardNumber(requestUid);

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
            });
            if (err?.code !== 'functions/not-found') throw err;

            await AsyncStorage.removeItem(cardStorageKey(requestUid));
            const result = await httpsCallable<
              { clientName: string; phoneNumber: string },
              CardData
            >(fn, 'createDiscountCard')({ clientName, phoneNumber });
            cardData = result.data;
          }
        } else {
          const result = await httpsCallable<
            { clientName: string; phoneNumber: string },
            CardData
          >(fn, 'createDiscountCard')({ clientName, phoneNumber });
          cardData = result.data;
        }

        if (!isCardData(cardData)) {
          throw new Error('The card service returned invalid card data.');
        }

        if (currentUidRef.current !== requestUid) return;

        applyState({ ownerUid: requestUid, status: 'ready', card: cardData, error: null });
        lastFetchedRef.current = { uid: requestUid, at: Date.now() };

        try {
          await persistCard(cardData, requestUid);
        } catch (persistError) {
          // A valid fetched card should remain usable even if local/profile caching fails.
          console.error('[CardContext] persistCard error', persistError);
        }
      } catch (err: any) {
        console.error('[CardContext] fetchOrCreate error', {
          code: err?.code,
          message: err?.message,
          details: err?.details,
        });

        if (currentUidRef.current !== requestUid) return;

        const latestState = stateRef.current;
        const latestCard = latestState.ownerUid === requestUid ? latestState.card : null;
        if (!latestCard) {
          applyState({
            ownerUid: requestUid,
            status: 'error',
            card: null,
            error: err?.message ?? 'Failed to load card',
          });
        }
      } finally {
        if (inFlightRef.current?.uid === requestUid) {
          inFlightRef.current = null;
        }
      }
    })();

    inFlightRef.current = { uid: requestUid, promise: operation };
    return operation;
  }, [applyState, profile?.firstName, profile?.lastName, profile?.phoneNumber, user?.uid]);

  useEffect(() => {
    const previousUid = previousUidRef.current;
    previousUidRef.current = uid;

    if (previousUid && previousUid !== uid) {
      void clearCardCache(previousUid).catch((error) => {
        console.error('[CardContext] clear previous card cache error', error);
      });
    } else {
      // Never reuse the old global cache because it may belong to another account.
      void AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch((error) => {
        console.error('[CardContext] clear legacy card cache error', error);
      });
    }
    lastFetchedRef.current = null;
    applyState(uid ? { ...EMPTY_STATE, ownerUid: uid } : EMPTY_STATE);
  }, [applyState, uid]);

  useEffect(() => {
    if (!hasCompleteProfile || !uid) return;

    let cancelled = false;

    void (async () => {
      const cached = await getCachedCard(uid);
      if (cancelled || currentUidRef.current !== uid) return;

      if (cached) {
        applyState({ ownerUid: uid, status: 'ready', card: cached, error: null });
      } else {
        applyState({ ownerUid: uid, status: 'loading', card: null, error: null });
      }

      await fetchOrCreate();
    })();

    return () => {
      cancelled = true;
    };
  }, [applyState, fetchOrCreate, hasCompleteProfile, uid]);

  const card = state.ownerUid === uid ? state.card : null;
  const error = state.ownerUid === uid ? state.error : null;
  const loading = hasCompleteProfile
    && (state.ownerUid !== uid || state.status === 'idle' || state.status === 'loading');

  return (
    <CardContext.Provider value={{ card, loading, error, refreshCard: fetchOrCreate }}>
      {children}
    </CardContext.Provider>
  );
}

export const useCard = () => useContext(CardContext);
