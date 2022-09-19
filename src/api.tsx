import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getFirestore, Firestore, collection, getDocs, doc,
    DocumentData,
    query, orderBy, setDoc, updateDoc, DocumentReference, deleteDoc, writeBatch, getDoc,
    where,
    WhereFilterOp,
    deleteField
    //, limit, startAfter, getDoc, 
} from 'firebase/firestore/lite';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, getMetadata, StorageReference } from "firebase/storage";

import {
    getAuth, onAuthStateChanged, Auth,
    signInWithEmailAndPassword, signOut,
    createUserWithEmailAndPassword
} from "firebase/auth";
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';


import { EventApi } from '@fullcalendar/common'

import { firebaseConfig } from './config';
import { Collections, MediaResource, UserInfo, UserDocument, isDev, onPushNotificationHandler, UserType, LocationInfo } from './types';
import { Event } from './event';
import dayjs from 'dayjs';
import { sortEvents } from './utils/date';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let functions: any = undefined;


export function initAPI(
    onAuth: (userDocument: UserDocument | null) => void,
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
            // const docRef = doc(db, Collections.USERS_COLLECTION, email, Collections.USER_PERSONAL_SUBCOLLECTION, "Default")
            // getDoc(docRef).then(
            //     //Success
            //     userPersonallDoc => {
            //         let userAdditionalInfo = {}
            //         if (userPersonallDoc.exists()) {

            //             if (userPersonallDoc.data().notificationOn === true) {
            //                 initializeNotification(onPushNotification, onNotificationToken);
            //             }
            //             userAdditionalInfo = userPersonallDoc.data();
            //         }
            //         onAuth({
            //             email,
            //             ...userAdditionalInfo,
            //         });

            //     },
            //     // No user record. for compatability - allow it
            //     (err) => {
            //         onAuth({
            //             email
            //         });
            //     }
            // );
            const docRef = doc(db, Collections.USERS_COLLECTION, email);
            getDoc(docRef).then(
                //Success
                res => {
                    let addInfo = {};
                    if (res.exists())
                        addInfo = res.data();
                    onAuth({
                        email,
                        ...addInfo,
                    });

                });
        } else {
            onAuth(null);
        }
    });
    return true;
}

export async function initializeNotification(
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
                        if (currentToken && currentToken.length > 0) {
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
                            throw ("Permission granted, yet no registration token is available");
                        }
                    }).catch((err) => {
                        console.log('An error occurred while retrieving token. ', err);
                        throw ("Permission granted, error getting token: " + err.message);
                        // ...
                    });
                    // })
                } else {
                    console.log("Permission denied to notifications");
                    throw ("Permission denied by the user");
                }
            });
        }
    } catch (err: any) {
        console.log("Cannot initialize messaging", err.message);
        throw ("Cannot initialize messaging");
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

export async function updateUserNotification(notificationOn: boolean | null, newNotificationToken?: string | null, isSafari?: boolean) {
    const updateNotification = httpsCallable(functions, 'updateNotification');

    const payload: any = {
        isDev: isDev(),
    };
    if (notificationOn !== undefined) {
        payload.notificationOn = notificationOn;
    }

    if (newNotificationToken) {
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
        // title: "בדיקת הודעה",
        // body: "זוהי הודעת בדיקה",
        // link: isDev() ? "http://localhost:3000/" : "https://mindramp-58e89.web.app/",
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

export function getPersonalizedEvents(user: string): Promise<Event[]> {
    return getEvents(true, user);
}
export function getEvents(filter: boolean = false, user: string = ""): Promise<Event[]> {
    if (!filter) {
        return _getCollection(Collections.EVENT_COLLECTION, "start", "asc").then(docs => docs.map((doc: any) => Event.fromDbObj(doc)));
    }

    const waitFor = [
        _getCollectionWithCond(Collections.EVENT_COLLECTION, "participants", "==", {}),
    ];
    // concat three lists: all public events + private events where user is participant + events where user is guide
    let participantKey = Event.getParticipantKey(user);

    if (participantKey?.length > 0) {
        waitFor.push(
            _getCollectionWithCond(Collections.EVENT_COLLECTION, "participants." + participantKey + ".email", "!=", "")
        );
        waitFor.push(
            _getCollectionWithCond(Collections.EVENT_COLLECTION, "guide.email", "==", user)
        );
    }

    return Promise.all(waitFor).then(
        (res: DocumentData[][]) => {
            let events = res[0].map((doc: any) => Event.fromDbObj(doc));

            if (participantKey?.length > 0) {
                events = events.concat(
                    res[1].map((doc: any) => Event.fromDbObj(doc, doc.ref, true))
                );

                // result with user as guide may be a duplicate with previous lists, merge them:
                res[2].forEach(doc => {
                    const ev = events.find(e => e._ref?.id == doc._ref?.id);
                    if (ev) {
                        ev.isPersonal = true;
                    } else {
                        events.push(Event.fromDbObj(doc, doc.ref, true));
                    }
                });
            }

            // Sort by start
            return sortEvents(events);
        },

        (err) => {
            console.log(err);
            return [] as Event[];
        });

}


export function getUsers(): Promise<UserInfo[]> {
    return _getCollection(Collections.USERS_COLLECTION).then(items => items.map(d =>
    ({
        fname: d.fname,
        lname: d.lname,
        avatar: d.avatar,
        _ref: d._ref,
        displayName: d.fname + " " + d.lname,
        phone: d.phone,
        type: d.type,
    })));
}

export function getLocations(): Promise<LocationInfo[]> {
    return _getCollection(Collections.LOCATIONS_COLLECTION).then(locations => locations.map(l =>
        ({ ...l } as LocationInfo))
    );
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


    if (ref) {
        if (eventObj.recurrent && eventObj.recurrent.gid === undefined) {
            eventObj.recurrent.gid = ref.id;
        }

        const dbDoc = eventObj.toDbObj(false);
        return updateDoc(ref, dbDoc).then(() => {
            eventObj._ref = ref;
            return eventObj;
        })
    } else {
        const dbDoc = eventObj.toDbObj(true);
        const docRef = doc(collection(db, Collections.EVENT_COLLECTION));
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

function GetResourceRefOfUsersPhoto(pic: File): StorageReference {
    const storage = getStorage(app);
    const storageRef = ref(storage);
    const mediaRef = ref(storageRef, 'media');
    const folderRef = ref(mediaRef, 'users_photo');
    const resourceRef = ref(folderRef, pic.name);

    return resourceRef;
}


export async function isCurrentUserAdmin() {
    const isAdmin = httpsCallable(functions, 'isAdmin');
    const payload: any = {
        isDev: isDev(),
    };
    return isAdmin(payload).then(
        () => {
            return true;
        },
        (err) => false
    );
}

export async function isUserAdmin(user: UserInfo): Promise<boolean> {
    if (!user._ref)
        return false;

    const docRef = doc(db, Collections.USERS_COLLECTION, user._ref.id, Collections.USER_SYSTEM_SUBCOLLECTION, "Default");
    return getDoc(docRef).then(systemDoc => { return (systemDoc.exists() && systemDoc.data().admin) });
}

function UpdateUserAdminState(_ref: DocumentReference, isAdmin: boolean) {
    const docRef = doc(db, Collections.USERS_COLLECTION, _ref.id, Collections.USER_SYSTEM_SUBCOLLECTION, "Default");
    return getDoc(docRef).then(adminDoc => {
        if (adminDoc.exists() && adminDoc.data().admin !== isAdmin) {
            return updateDoc(docRef, { admin: isAdmin });
        } else if (!adminDoc.exists && isAdmin) {
            return setDoc(docRef, { admin: true });
        }
    })
}

export async function editUser(_ref: DocumentReference, pic: File | null, existingPic: string | undefined, userInfo: UserInfo, isAdmin: boolean) {
    console.log("we got ref need to update " + userInfo.fname + " " + userInfo.lname + " , " + (pic ? pic.name : "NULL") + " , " + _ref.id);

    return getDoc(_ref).then((g) => {
        if (!g.exists()) {
            throw ("Unexpected error!");
        }
        let existing_info = g.data();
        if (userInfo.fname) existing_info.fname = userInfo.fname;
        if (userInfo.lname) existing_info.lname = userInfo.lname;
        existing_info.type = userInfo.type || UserType.PARTICIPANT;
        if (userInfo.phone) existing_info.phone = userInfo.phone;
        let old_pic_path = existing_info.avatar?.path;

        if (pic) {
            console.log("got new pic for " + userInfo.fname + " " + userInfo.lname);
            const resourceRef = GetResourceRefOfUsersPhoto(pic);
            const metadata = {
                contentType: 'image/jpeg',
            };

            // Verify guide pic with this name does not exist:
            return getMetadata(resourceRef).then(
                //success
                (md) => { throw ("תמונת מדריך בשם זה כבר קיימת") },
                () => {
                    const uploadTask = uploadBytes(resourceRef, pic, metadata);
                    return uploadTask.then(val => {
                        return getDownloadURL(val.ref).then(url => {

                            existing_info.avatar = { url, path: val.ref.fullPath };

                            // also remove the old Pic 
                            if (old_pic_path) {
                                console.log("delete old pic: " + old_pic_path);
                                deleteFile(old_pic_path).catch((err) => console.log("Failed deleted old image", err));
                            }

                            return updateDoc(_ref, existing_info).then(() => {
                                return UpdateUserAdminState(_ref, isAdmin);
                            });
                        });
                    });
                });
        } else {
            if (existingPic == undefined && old_pic_path) {
                //remove pic (without waiting for result)
                existing_info.avatar = deleteField();
                deleteFile(old_pic_path).catch((err) => console.log("Failed deleted old image", err));
            }

            return updateDoc(_ref, existing_info).then(() => {
                return UpdateUserAdminState(_ref, isAdmin);
            });
        }
    });

}

export async function addUser(userInfo: UserInfo, isAdmin: boolean, email: string, pwd: string, pic?: File) {

    const registerUser = httpsCallable(functions, 'registerUser');

    const payload: any = {
        isDev: isDev(),
        info: {
            fname: userInfo.fname,
            lname: userInfo.lname,
            phone: userInfo.phone,
            type: userInfo.type,
        },
        displayName: userInfo.fname + " " + userInfo.lname,
        email,
        phone: userInfo.phone,
        password: pwd,
        isAdmin
    };


    return registerUser(payload).then(() => {
        if (pic) {
            const resourceRef = GetResourceRefOfUsersPhoto(pic);

            /** @type {any} */
            const metadata = {
                contentType: 'image/jpeg',
            };

            // Verify picture name does not exist:
            return getMetadata(resourceRef).then(
                //success
                (md) => { throw ("תמונת מדריך בשם זה כבר קיים") },
                () => {
                    // Fail - new guide name
                    // Upload his/her pic and metadata
                    const uploadTask = uploadBytes(resourceRef, pic, metadata);
                    return uploadTask.then(val => {
                        return getDownloadURL(val.ref).then(url => {
                            const update = { avatar: { path: val.ref.fullPath, url: url } };
                            const docRef = doc(collection(db, Collections.USERS_COLLECTION), email);
                            return updateDoc(docRef, update);
                        });
                    });

                });
        }
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

export async function deleteDocWithMedia(path: string | undefined, docRef: DocumentReference) {
    return deleteDoc(docRef).then(() => {
        if (path) {
            return deleteFile(path)
        }
    }
    );
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

    return getDocs(query(colRef, ...constraints)).then((items) => {
        return items.docs.map(docObj => {
            let obj = docObj.data();
            obj._ref = docObj.ref;

            return obj;
        })
    });
}

async function _getCollectionWithCond(collName: string, whereField: string, whereOp: WhereFilterOp, whereValue: any): Promise<DocumentData[]> {
    let colRef = collection(db, collName);
    const constraints = []
    constraints.push(where(whereField, whereOp, whereValue));
    return getDocs(query(colRef, ...constraints)).then((items) => {
        return items.docs.map(docObj => {
            let obj = docObj.data();
            obj._ref = docObj.ref;

            return obj;
        })
    });
}
