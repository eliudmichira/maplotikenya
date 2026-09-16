import { doc, increment, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Track page view in database
export const incrementPageView = async (pageName) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    // Sanitize page name to avoid invalid document paths
    const sanitizedPageName = pageName.replace(/[\/\\]/g, '_');
    const pageViewRef = doc(db, 'pageViews', `${sanitizedPageName}_${today}`);
    
    // Get current page view count
    const pageViewSnap = await getDoc(pageViewRef);
    
    if (pageViewSnap.exists()) {
      // Increment existing count
      await updateDoc(pageViewRef, {
        count: increment(1),
        lastUpdated: new Date().toISOString()
      });
    } else {
      // Create new page view record
      await setDoc(pageViewRef, {
        pageName,
        date: today,
        count: 1,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    // Silently fail - pageViews collection may not have write permissions for unauthenticated users
    // This is non-critical analytics; don't spam the console
    return false;
  }
};

// Get total page views for a specific page
export const getPageViews = async (pageName, date = null) => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const sanitizedPageName = pageName.replace(/[\/\\]/g, '_');
    const pageViewRef = doc(db, 'pageViews', `${sanitizedPageName}_${targetDate}`);
    const pageViewSnap = await getDoc(pageViewRef);
    
    if (pageViewSnap.exists()) {
      return pageViewSnap.data().count || 0;
    }
    return 0;
  } catch (error) {
    return 0; // silently fail
  }
};

// Get total page views across all pages
export const getTotalPageViews = async () => {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const pageViewsSnap = await getDocs(collection(db, 'pageViews'));
    
    let totalViews = 0;
    pageViewsSnap.forEach(doc => {
      const data = doc.data();
      totalViews += data.count || 0;
    });
    
    return totalViews;
  } catch (error) {
    return 0; // silently fail
  }
};
