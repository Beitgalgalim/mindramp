import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getFirestore, Firestore, collection, getDocs, doc,
    DocumentData,
    query, orderBy, setDoc, updateDoc, DocumentReference, deleteDoc
    // QueryDocumentSnapshot, where, limit, startAfter, getDoc, 
    // , , writeBatch
} from 'firebase/firestore/lite';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

import {
    getAuth, onAuthStateChanged, NextOrObserver, User
} from "firebase/auth";

import { EventApi } from '@fullcalendar/common'

import { firebaseConfig } from './config';
import { Collections, MediaResource } from './types';
import { DateFormats } from './utils/date';
import dayjs from 'dayjs';

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
    return _getCollection(Collections.EVENT_COLLECTION, "start", "asc");
}

export function getMedia(): Promise<MediaResource[]> {
    return _getCollection(Collections.MEDIA_COLLECTION).then(items => items.map(d =>
    ({
        name: d.name,
        url: d.url,
        path: d.path || "",
        type: d.type,
        _ref: d._ref
    })));
}

export async function upsertEvent(event: any) {
    const eventObj = event.toPlainObject ? event.toPlainObject({ collapseExtendedProps: true }) : event;

    eventObj.start = dayjs(event.start).format(DateFormats.DATE_TIME);
    eventObj.end = dayjs(event.end).format(DateFormats.DATE_TIME);
    if (!eventObj.notes) {
        delete eventObj.notes;
    }
    if (!eventObj.imageUrl) {
        delete eventObj.imageUrl;
    }
    if (!eventObj._ref) {
        delete eventObj._ref;
    }
    if (eventObj._ref) {
        const { _ref, ...cleanedEvt } = eventObj;
        return updateDoc(_ref, cleanedEvt).then(() => eventObj);
    } else {
        const docRef = doc(collection(db, Collections.EVENT_COLLECTION));
        return setDoc(docRef, eventObj).then(() => ({ _ref: docRef, ...eventObj }));
    }
}


export async function deleteEvent(event: EventApi) {
    const ref = event.extendedProps?._ref;
    if (ref) {
        return deleteDoc(ref);
    }
}

export async function addMedia(name: string, type: "icon" | "photo", file: File): Promise<MediaResource> {
    // First upload to storage
    const storage = getStorage(app);
    const storageRef = ref(storage);
    const mediaRef = ref(storageRef, 'media');
    const folderRef = ref(mediaRef, type === "icon" ? "icons" : "photos");
    const resourceRef = ref(folderRef, name);

    /** @type {any} */
    const metadata = {
        contentType: 'image/jpeg',
    };

    // Upload the file and metadata
    const uploadTask = uploadBytes(resourceRef, file, metadata);
    return uploadTask.then(val => {
        return getDownloadURL(val.ref).then(url => {
            const res = {
                name,
                type,
                url,
                path: val.ref.fullPath,
            };
            const docRef = doc(collection(db, Collections.MEDIA_COLLECTION));
            return setDoc(docRef, res).then(() => ({ _ref: docRef, ...res }));
        })
    });
}

export async function deleteMedia(path: string, docRef: DocumentReference) {
    // First delete record
    return deleteDoc(docRef).then(
        () => {
            if (path !== "") {
                const storage = getStorage(app);
                const docToDeleteRef = ref(storage, path);
                return deleteObject(docToDeleteRef);
            }
        }
    )

}


async function _getCollection(collName: string, oBy?: string, order?: "asc" | "desc"): Promise<DocumentData[]> {
    let colRef = collection(db, collName);
    const constraints = []
    if (oBy) {
        constraints.push(order ? orderBy(oBy, order) : orderBy(oBy));
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
