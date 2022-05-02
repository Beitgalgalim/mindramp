import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getFirestore, Firestore, collection, getDocs, doc,
    DocumentData,
    query, orderBy, setDoc, updateDoc, DocumentReference, deleteDoc, writeBatch, getDoc,
    where
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
import { Event } from './event';

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


export function getEvents(): Promise<Event[]> {
    return _getCollection(Collections.EVENT_COLLECTION, "start", "asc").then(docs => docs.map((doc: any) => Event.fromDbObj(doc)));
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

export async function upsertEvent(event: Event | EventApi, ref: DocumentReference | undefined): Promise<Event> {
    const eventObj = Event.fromEventAny(event)

    let dbDoc = eventObj.toDbObj();

    if (ref) {
        if (eventObj.recurrent && eventObj.recurrent.gid === undefined) {
            eventObj.recurrent.gid = ref.id;
        }
        return updateDoc(ref, dbDoc).then(() => {
            eventObj._ref = ref;
            return eventObj;
        });
    } else {
        const docRef = doc(collection(db, Collections.EVENT_COLLECTION));
        if (eventObj.recurrent && eventObj.recurrent.gid === undefined) {
            dbDoc.recurrent.gid = docRef.id;
        }
        return setDoc(docRef, dbDoc).then(() => {
            eventObj._ref = ref;
            return eventObj;
        });
    }
}


export async function createEventInstance(evt: Event | EventApi, ref: DocumentReference | undefined):
    Promise<{ instance: Event, series: Event }> {

    if (!ref) {
        throw ("Ref must be valid");
    }

    const event = Event.fromEventAny(evt);
    event.instanceStatus = true;
    event.recurrent = { gid: ref.id };

    const eventObj = event.toDbObj();

    let batch = writeBatch(db);

    return getDoc(ref).then((seriesDoc) => {
        const seriesDocObj = seriesDoc.data();

        if (!seriesDocObj || !seriesDocObj.recurrent) {
            // not expected
            throw ("Unexpected missing recurrent info on series event");
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
                event._ref = instanceRef
                const seriesEvent = Event.fromDbObj(seriesDocObj);
                seriesEvent._ref = ref;
                return {
                    instance: event,
                    series: seriesEvent,
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

export async function addAudio(name: string, data: Blob): Promise<MediaResource> {
    // First upload to storage
    const storage = getStorage(app);
    const storageRef = ref(storage);
    const mediaRef = ref(storageRef, 'media');
    const folderRef = ref(mediaRef, "audio");
    const resourceRef = ref(folderRef, name);

    /** @type {any} */
    const metadata = {
        contentType: "audio/wav",
    };

    // Upload the file and metadata
    const uploadTask = uploadBytes(resourceRef, data, metadata);
    return uploadTask.then(val => {
        return getDownloadURL(val.ref).then(url => {
            return ({
                name,
                type: "audio",
                url,
                path: val.ref.fullPath,
            });
        })
    });
}

export async function deleteMedia(path: string, docRef: DocumentReference) {
    return deleteDoc(docRef).then(() => deleteFile(path));
}

export async function deleteFile(path: string) {
    if (path !== "") {
        const storage = getStorage(app);
        const docToDeleteRef = ref(storage, path);
        return deleteObject(docToDeleteRef);
    }
}

async function _getCollection(collName: string, oBy?: string, order?: "asc" | "desc"): Promise<DocumentData[]> {
    let colRef = collection(db, collName);
    const constraints = []
    if (oBy) {
        constraints.push(order ? orderBy(oBy, order) : orderBy(oBy));
    }

    //let i = 1;
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
