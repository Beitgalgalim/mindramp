import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getFirestore, Firestore, collection, getDocs, getDoc, doc,
    QueryDocumentSnapshot, DocumentData, 
    query, where, orderBy, limit, startAfter,
    updateDoc, setDoc, deleteDoc,
    writeBatch
} from 'firebase/firestore/lite';

import {
    getAuth, onAuthStateChanged,  NextOrObserver, User,
    signInWithEmailAndPassword,
    sendPasswordResetEmail, signOut, updatePassword
} from "firebase/auth";

import { firebaseConfig } from './config';
import {Collections} from './types';

let app: FirebaseApp;
let db: Firestore;


export function initAPI(onAuth: NextOrObserver<User>): boolean {
    if (!app) {
        app = initializeApp({ ...firebaseConfig });
        db = getFirestore(app);
    }
    const auth = getAuth(app);
    onAuthStateChanged(auth, onAuth);
    return true;
}

export function getEvents(): Promise<DocumentData[]> {
    return _getCollection(Collections.EVENT_COLLECTION);
}

export async function addEvent(event:any) {
    const docRef = doc(collection(db, Collections.EVENT_COLLECTION));
    return setDoc(docRef, event);
}

async function _getCollection(collName:string, oBy?: string, orderDesc?: string):Promise<DocumentData[]> {
    let colRef = collection(db, collName);
    const constraints = []
    if (oBy) {
        constraints.push(orderDesc ? orderBy(oBy, "desc") : orderBy(oBy));
    }

    let i = 1;
    return getDocs(query(colRef, ...constraints)).then((items) => {
        return items.docs.map(docObj => {
            let obj = docObj.data();
            if (oBy)
                obj._order = i++;


            obj._ref = docObj.ref;

            return obj;
        })
    });
}
