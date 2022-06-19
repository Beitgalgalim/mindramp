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
    getAuth, onAuthStateChanged, Auth,
    signInWithEmailAndPassword, signOut,
} from "firebase/auth";
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';


import { EventApi } from '@fullcalendar/common'

import { firebaseConfig } from './config';
import { Collections, MediaResource, GuideInfo, UserInfo, UserPersonalInfo, isDev, onPushNotificationHandler } from './types';
import { Event } from './event';
import dayjs from 'dayjs';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let functions: any = undefined;


export function initAPI(
    onAuth: (userPersonalInfo: UserPersonalInfo | null) => void,
    onPushNotification: onPushNotificationHandler,
    onNotificationToken: (notificationToken: string) => void
): boolean {
    if (!app) {
        app = initializeApp({ ...firebaseConfig });
        db = getFirestore(app);
        auth = getAuth(app);
        functions = getFunctions(app, 'europe-west1');
    }

    onAuthStateChanged(auth, (user) => {
        const email = user?.email;
        if (email) {
            const docRef = doc(db, Collections.USERS_COLLECTION, email, Collections.USER_PERSONAL_SUBCOLLECTION, "Default")
            getDoc(docRef).then(
                //Success
                userPersonallDoc => {
                    if (userPersonallDoc.exists()) {

                        if (userPersonallDoc.data().notificationOn === true) {
                            initializeNotification(onPushNotification, onNotificationToken);
                        }

                        onAuth({
                            email,
                            ...userPersonallDoc.data(),
                        });
                    }
                },
                // No user record. for compatability - allow it
                (err) => {
                    onAuth({
                        email
                    });
                }
            );
        } else {
            onAuth(null);
        }
    });
    return true;
}

export function initializeNotification(
    onPushNotification: onPushNotificationHandler,
    onNotificationToken: (notificationToken: string) => void
) {

    try {
        const messaging = getMessaging(app);
        if ('safari' in window) {// && 'pushNotification' in window.safari) {
            // requires user gesture...
            // todo
        } else {


            Notification.requestPermission().then(perm => {
                if (perm === "granted") {
                    console.log("permission granted");
                    // deleteToken(messaging).then(ret => {
                    //     if (ret) {
                    //         console.log("deleted token");
                    //         return
                    //     }


                        getToken(messaging, {
                            vapidKey: 'BKT9QCwiaOTp2UKRF1ZpjyinCbwdpCaxcGNKMZNz9tTsrlwoog_n5pplhi01Z4KA06qAfom8czMBu4jKx58sDpQ',
                        }).then((currentToken) => {
                            if (currentToken) {
                                // Send the token to your server and update the UI if necessary
                                console.log("Web notification", currentToken);
                                if (onNotificationToken) {
                                    onNotificationToken(currentToken);
                                }

                                onMessage(messaging, (payload) => {
                                    console.log('Message received. ', JSON.stringify(payload));
                                    if (onPushNotification) {
                                        onPushNotification(payload);
                                    }
                                });
                            } else {
                                // Show permission request UI
                                console.log('No registration token available. Request permission to generate one.');
                                // ...
                            }
                        }).catch((err) => {
                            console.log('An error occurred while retrieving token. ', err);
                            // ...
                        });
                   // })
                } else {
                    console.log("Permission denied to notifications");
                    return;
                }
            });
        }
    } catch (err: any) {
        console.log("Cannot initialize messaging", err.message);
    }
}

export const checkSafariRemotePermission = (permissionData: any) => {
    // todo
    // if (permissionData.permission === 'default') {
    //     // This is a new web service URL and its validity is unknown.
    //     return window.safari.pushNotification.requestPermission(
    //         'https://todo', // The web service URL.
    //         'todo',     // The Website Push ID.
    //         {}, // Data that you choose to send to your server to help you identify the user.
    //         checkSafariRemotePermission         // The callback function.
    //     );
    // }
    // else if (permissionData.permission === 'denied') {
    //     console.log("Safari push is denied");
    //     // The user said no.
    // }
    // else if (permissionData.permission === 'granted') {
    //     // The web service URL is a valid push provider, and the user said yes.
    //     // permissionData.deviceToken is now available to use.
    //     console.log("Safari push is ready. deviceToken:", permissionData.deviceToken);
    //     return permissionData.deviceToken;
    // }
    // return undefined;
};

export async function updateUserNotification(notificationOn: boolean | null, newNotificationToken?: string, isSafari?: boolean) {
    const updateNotification = httpsCallable(functions, 'updateNotification');

    const payload: any = {
        isDev: isDev(),
    };
    if (notificationOn !== undefined) {
        payload.notificationOn = notificationOn;
    }

    if (newNotificationToken !== undefined) {
        payload.notificationToken = {
            isSafari,
            token: newNotificationToken,
            ts: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        };
    }

    return updateNotification(payload);
}


export function testNotif() {
    const sendNotificationTest = httpsCallable(functions, 'sendNotificationTest');
    const payload: any = {
        title: "בדיקת הודעה",
        body: "זוהי הודעת בדיקה",
        link: isDev() ? "http://localhost:3000/" : "https://mindramp-58e89.web.app/",
        isDev: isDev(),
    };
    return sendNotificationTest(payload);
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
                events = events.concat(results[1].value.map((doc: any) => Event.fromDbObj(doc, undefined, true)));
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
