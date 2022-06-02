import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getFirestore, Firestore, collection, getDocs, doc,
    DocumentData,
    query, orderBy, setDoc, updateDoc, DocumentReference, deleteDoc, writeBatch, getDoc,
    where
    //, limit, startAfter, getDoc, 
} from 'firebase/firestore/lite';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from "firebase/storage";

import {
    getAuth, onAuthStateChanged, NextOrObserver, User, Auth,
    signInWithEmailAndPassword, signOut,
} from "firebase/auth";

import { EventApi } from '@fullcalendar/common'

import { firebaseConfig } from './config';
import { Collections, MediaResource, GuideInfo, UserInfo } from './types';
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

export async function logout() {
    return signOut(auth);
}

export function getEvents(): Promise<Event[]> {
    return Promise.allSettled([
        _getCollection(Collections.EVENT_COLLECTION, "start", "asc"),
        _getCollection(Collections.PERSONAL_EVENT_COLLECTION, "start", "asc"),
    ]).then((results: PromiseSettledResult<DocumentData[]>[]) => {
        let events = [] as Event[];
        if (results[0].status === "fulfilled") {
            events = results[0].value.map((doc: any) => Event.fromDbObj(doc));
        } else {
            return Promise.reject(results[0].reason);
        }

        if (results.length > 1) {
            if (results[1].status === "fulfilled") {
                events = events.concat(results[1].value.map((doc: any) => Event.fromDbObj(doc)));
            } else {
                console.log("fail calling personal_events", results[1].reason);
            }
        }
        return events;
    });
}

export function getGuides(): Promise<GuideInfo[]> {
    return _getCollection(Collections.GUIDES_COLLECTION).then(items => items.map(d =>
    ({
        name: d.name,
        url: d.url,
        path: d.path || "",

        _ref: d._ref
    })));

}

export function getUsers(): Promise<UserInfo[]> {
    return _getCollection(Collections.USERS_COLLECTION).then(items => items.map(d =>
    ({
        fname: d.fname,
        lname: d.lname,
        avatar: d.avatar,
        _ref: d._ref,
        displayName: d.fname + " " + d.lname,
        type: d.type,
    })));
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

function getEventCollection(ref: DocumentReference): string {
    return ref.path.startsWith(Collections.PERSONAL_EVENT_COLLECTION) ?
        Collections.PERSONAL_EVENT_COLLECTION : Collections.EVENT_COLLECTION
}

export async function upsertEvent(event: Event | EventApi, ref: DocumentReference | undefined): Promise<Event> {
    const eventObj = Event.fromEventAny(event)


    if (ref) {
        if (eventObj.recurrent && eventObj.recurrent.gid === undefined) {
            eventObj.recurrent.gid = ref.id;
        }
        let updatePromise: Promise<void>;

        if (eventObj.participants && ref.path.startsWith(Collections.PERSONAL_EVENT_COLLECTION) ||
            !eventObj.participants && ref.path.startsWith(Collections.EVENT_COLLECTION)) {

            // event remain in same collection
            const dbDoc = eventObj.toDbObj(false);
            updatePromise = updateDoc(ref, dbDoc);
        } else {
            // event (and all instances?) need to move to the other collection
            const batch = writeBatch(db);
            const newCollection = ref.path.startsWith(Collections.PERSONAL_EVENT_COLLECTION) ?
                Collections.EVENT_COLLECTION : Collections.PERSONAL_EVENT_COLLECTION;
            const prevCollection = ref.path.startsWith(Collections.PERSONAL_EVENT_COLLECTION) ?
                Collections.PERSONAL_EVENT_COLLECTION : Collections.EVENT_COLLECTION;

            batch.delete(ref);
            ref = doc(collection(db, newCollection), ref.id);
            const dbDoc = eventObj.toDbObj(true);
            batch.set(ref, dbDoc);

            // move instances of recurrent to the other collection
            const q = query(collection(db, prevCollection), where("recurrent.gid", "==", ref.id));
            const instances = await getDocs(q);
            instances.docs.forEach(instanceDoc => {
                batch.delete(instanceDoc.ref);
                const newDocRef = doc(collection(db, newCollection), instanceDoc.ref.id);
                batch.set(newDocRef, instanceDoc.data())
            });

            updatePromise = batch.commit()
        }

        return updatePromise.then(() => {
            eventObj._ref = ref;
            return eventObj;
        })
    } else {
        const dbDoc = eventObj.toDbObj(true);
        const collectionName = eventObj.participants ? Collections.PERSONAL_EVENT_COLLECTION : Collections.EVENT_COLLECTION
        const docRef = doc(collection(db, collectionName));
        if (eventObj.recurrent && eventObj.recurrent.gid === undefined) {
            dbDoc.recurrent.gid = docRef.id;
        }
        return setDoc(docRef, dbDoc).then(() => {
            eventObj._ref = docRef;
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

        const instanceRef = doc(collection(db, getEventCollection(ref)));
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

export async function createEventInstanceAsDeleted(excludeDate: string, ref: DocumentReference) {
    if (!ref) {
        throw ("Ref must be valid");
    }

    return getDoc(ref).then((seriesDoc) => {
        const seriesDocObj = seriesDoc.data();

        if (!seriesDocObj || !seriesDocObj.recurrent) {
            // not expected
            throw ("Unexpected missing recurrent info on series event");
        }
        if (!seriesDocObj.recurrent.exclude) {
            seriesDocObj.recurrent.exclude = [excludeDate];
        } else {
            seriesDocObj.recurrent.exclude.push(excludeDate);
        }

        return updateDoc(ref, seriesDocObj).then(() => Event.fromDbObj(seriesDocObj, ref));
    });
}


export async function deleteEvent(ref: DocumentReference, deleteModifiedInstance: boolean = false): Promise<string[]> {
    if (ref) {
        if (deleteModifiedInstance) {
            const q = query(collection(db, getEventCollection(ref)), where("recurrent.gid", "==", ref.id));
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

    // Verify file does not exist:
    return getMetadata(resourceRef).then(
        //success
        (md) => { throw ("קובץ בשם זה כבר קיים") },
        () => {
            // Fail - new file
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
                });
            });

        });

}


export async function addGuideInfo(name: string, pic: File): Promise<GuideInfo> {
    const storage = getStorage(app);
    const storageRef = ref(storage);
    const mediaRef = ref(storageRef, 'media');
    const folderRef = ref(mediaRef, 'guides_pics');
    const resourceRef = ref(folderRef, pic.name);

    /** @type {any} */
    const metadata = {
        contentType: 'image/jpeg',
    };

    // Verify guide does not exist:
    return getMetadata(resourceRef).then(
        //success
        (md) => { throw ("מדריך בשם זה כבר קיים") },
        () => {
            // Fail - new guide name
            // Upload his/her pic and metadata
            const uploadTask = uploadBytes(resourceRef, pic, metadata);
            return uploadTask.then(val => {
                return getDownloadURL(val.ref).then(url => {
                    const res = {
                        name,
                        path: val.ref.fullPath,
                        url,
                    };
                    const docRef = doc(collection(db, Collections.GUIDES_COLLECTION));
                    return setDoc(docRef, res).then(() => ({ _ref: docRef, ...res }));
                });
            });

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
