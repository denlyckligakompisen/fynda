import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'users';

/**
 * Get user's favorites from Firestore
 */
export const getFavorites = async (userId) => {
    try {
        const docRef = doc(db, COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data().favorites || [];
        }
        return [];
    } catch (error) {
        console.error('Error getting favorites:', error);
        return [];
    }
};

/**
 * Add a favorite to Firestore
 */
export const addFavorite = async (userId, url) => {
    try {
        const docRef = doc(db, COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, {
                favorites: arrayUnion(url)
            });
        } else {
            await setDoc(docRef, {
                favorites: [url],
                createdAt: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error adding favorite:', error);
        throw error;
    }
};

/**
 * Remove a favorite from Firestore
 */
export const removeFavorite = async (userId, url) => {
    try {
        const docRef = doc(db, COLLECTION, userId);
        await updateDoc(docRef, {
            favorites: arrayRemove(url)
        });
    } catch (error) {
        console.error('Error removing favorite:', error);
        throw error;
    }
};

/**
 * Sync local favorites to cloud on first sign-in
 * Merges local favorites with any existing cloud favorites
 */
export const syncFavorites = async (userId, localFavorites) => {
    try {
        const cloudFavorites = await getFavorites(userId);
        const merged = [...new Set([...cloudFavorites, ...localFavorites])];

        const docRef = doc(db, COLLECTION, userId);
        await setDoc(docRef, {
            favorites: merged,
            lastSynced: new Date().toISOString()
        }, { merge: true });

        return merged;
    } catch (error) {
        console.error('Error syncing favorites:', error);
        throw error;
    }
};
