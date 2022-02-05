import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getFirestore, Firestore, collection, getDocs, doc,
    DocumentData,
    query, orderBy, setDoc, updateDoc, DocumentReference, deleteDoc, writeBatch, getDoc,
    where, QueryDocumentSnapshot
    //, limit, startAfter, getDoc, 
} from 'firebase/firestore/lite';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

import {
    getAuth, onAuthStateChanged, NextOrObserver, User, Auth,
    signInWithEmailAndPassword,
} from "firebase/auth";

import { EventApi } from '@fullcalendar/common'

import { firebaseConfig } from './config';
import { Collections, MediaResource } from './types';
import { DateFormats } from './utils/date';
import dayjs from 'dayjs';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;


export function initAPI(onAuth: NextOrObserver<User>): boolean {
    if (!app) {
        app = initializeApp({ ...firebaseConfig });
        db = getFirestore(app);
    }
    auth = getAuth(app);
    onAuthStateChanged(auth, onAuth);
    return true;
}

export async function getUserInfo(user: string, pwd: string) {
    return signInWithEmailAndPassword(auth, user, pwd)
        .then((userCredential) => {
            // Signed in
            return userCredential.user;
        });
}

// export async function getUserObj(user) {
//     if (user && user.email) {
//         let docRef = doc(db, Collections.USERS_INFO_COLLECTION, user.email.toLowerCase());
//         return getDoc(docRef).then(u => {
//             let data = u.data();
//             if (!data) {
//                 throw new Error("חשבונך מחכה לאישור - יש לפנות למנהל המערכת");
//             } else if (data.inactive) {
//                 throw new Error("חשבונך אינו פעיל - יש לפנות למנהל המערכת");
//             }
//             return {
//                 displayName: data.displayName,
//                 email: user.email.toLowerCase(),
//                 _user: user,
//                 _userInfo: data,
//                 pushNotification: data.pushNotification
//             };
//         },
//             (err) => {
//                 throw new Error("חשבונך אינו פעיל - יש לפנות למנהל המערכת")
//             });
//     }
//     return undefined;
// }

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

export async function upsertEvent(event: any, ref: DocumentReference) {
    const eventObj = event.toPlainObject ? event.toPlainObject({ collapseExtendedProps: true }) : event;

    prepareEventRecord(eventObj);

    if (ref) {
        if (eventObj.recurrent && eventObj.recurrent.gid === undefined) {
            eventObj.recurrent.gid = ref.id;
        }
        return updateDoc(ref, eventObj).then(() => ({ _ref: ref, ...eventObj }));
    } else {
        const docRef = doc(collection(db, Collections.EVENT_COLLECTION));
        if (eventObj.recurrent && eventObj.recurrent.gid === undefined) {
            eventObj.recurrent.gid = docRef.id;
        }
        return setDoc(docRef, eventObj).then(() => ({ _ref: docRef, ...eventObj }));
    }
}

function prepareEventRecord(eventObj: any) {
    eventObj.date = dayjs(eventObj.start).format(DateFormats.DATE);
    eventObj.start = dayjs(eventObj.start).format(DateFormats.DATE_TIME);
    eventObj.end = dayjs(eventObj.end).format(DateFormats.DATE_TIME);
    if (!eventObj.notes) {
        delete eventObj.notes;
    }
    if (!eventObj.imageUrl) {
        delete eventObj.imageUrl;
    }
    if (!eventObj.recurrent) {
        delete eventObj.recurrent;
    }
    delete eventObj._ref;

    if (!eventObj.instanceStatus) {
        delete eventObj.instanceStatus;
    }
}

export async function createEventInstance(event: any, ref: DocumentReference) {
    const eventObj = event.toPlainObject ? event.toPlainObject({ collapseExtendedProps: true }) : event;

    prepareEventRecord(eventObj);
    eventObj.instanceStatus = true;
    eventObj.recurrent = { gid: ref.id };

    let batch = writeBatch(db);

    return getDoc(ref).then((seriesDoc) => {
        const seriesDocObj = seriesDoc.data();

        if (!seriesDocObj || !seriesDocObj.recurrent) {
            // not expected
            throw new Error("Unexpected missing recurrent info on series event");
        }
        if (!seriesDocObj.recurrent.exclude) {
            seriesDocObj.recurrent.exclude = [eventObj.date];
        } else {
            seriesDocObj.recurrent.exclude.push(eventObj.date);
        }

        const instanceRef = doc(collection(db, Collections.EVENT_COLLECTION));
        batch.update(ref, { recurrent: seriesDocObj.recurrent });
        batch.set(instanceRef, eventObj);
        return batch.commit().then(
            () => {
                return {
                    instance: { _ref: instanceRef, ...eventObj },
                    series: { _ref: ref, ...seriesDocObj },
                };
            })

    });
}

export async function deleteEvent(ref: DocumentReference, deleteModifiedInstance: boolean = false): Promise<string[]> {

    if (ref) {
        if (deleteModifiedInstance) {
            const q = query(collection(db, Collections.EVENT_COLLECTION), where("recurrent.gid", "==", ref.id));
            return getDocs(q).then(instances => {
                let batch = writeBatch(db);
                const removedIDs: string[] = []
                instances.docs.forEach(doc => {
                    batch.delete(doc.ref)
                    removedIDs.push(doc.ref.id)
                });
                batch.delete(ref)
                removedIDs.push(ref.id)
                return batch.commit().then(() => removedIDs);
            })
        }

        return deleteDoc(ref).then(() => [ref.id]);
    }
    return [];
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
            // if (oBy)
            //     obj._order = i++;


            obj._ref = docObj.ref;

            return obj;
        })
    });
}
