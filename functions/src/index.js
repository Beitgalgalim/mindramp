const functions = require("firebase-functions");

const admin = require("firebase-admin");
const {
    FieldValue,
} = require("@google-cloud/firestore");

const axios = require("axios");
const eventsUtil = require("./events");
const archiver = require("archiver");
const fs = require("fs");


const dayjs = require("dayjs");

const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);
const JERUSALEM = "Asia/Jerusalem";

const express = require("express");
const webhookMiddleware = require("x-hub-signature").middleware;
const bodyParser = require("body-parser");

const app = express();

const NOTIFICATIONS_COLLECTION = "notifications";
const USERS_COLLECTION = "users";
const tagFormat = "YYYY-MM-DD HH:mm:ss.SSS";

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // databaseAuthVariableOverride: {
    //     token: {
    //         email: functions.config().admin.email,
    //     },
    // },
    projectId: "mindramp-58e89",
    storageBucket: "mindramp-58e89.appspot.com",
});

const db = admin.firestore();

const Roles = {
    Admin: "admin",
    UserAdmin: "user-admin",
    ContentAdmin: "content-admin",
    Editor: "editor",
    Kiosk: "kiosk",
    SharedScreen: "shared-screen",
};

const allowedElevateRoles = [
    Roles.SharedScreen,
    Roles.Kiosk,
];

// exports.houseKeeping = functions.region("europe-west1").pubsub
//     // minute (0 - 59) | hour (0 - 23) | day of the month (1 - 31) | month (1 - 12) | day of the week (0 - 6) - Sunday to Saturday
//     .schedule("00 10 * * *")
//     .timeZone("Asia/Jerusalem")
//     .onRun((context) => {
//         // Clean up old events:
//         const twoMonthsAgo = dayjs().sub(-60, "days").format("YYYY-MM-DD");
//         db.collection("event")
//             //.where("date", "<", threeMonthsAgo)
//             .get().then((events) => {
//                 const batch = db.batch();

//                 const oldEvents = events.docs.filter(
//                     (doc) => doc.data.date() < twoMonthsAgo &&
//                         doc.data().recurrent === undefined);
//                 oldEvents.forEach((doc) => {
//                     batch.delete(doc.ref);
//                     const archiveRef = db.collection("event-archive").doc(doc.ref.id);
//                     batch.set().set(archiveRef, doc.data());
//                 });

//                 return batch.commit();
//             });
//     });

const getParticipantKey = (email) => (email?.replace(/\./g, "")?.replace("@", ""));


exports.updateNotification = functions.region("europe-west1").https.onCall((data, context) => {
    if (!context.auth) {
        return;
    }
    const { notificationOn, notificationToken, isDev } = data;
    const docRef = db.collection(isDev ? "users_dev" : "users").doc(context.auth.token.email).collection("personal").doc("Default");
    return docRef.get().then(doc => {
        const update = {};
        if (notificationOn !== undefined) {
            update.notificationOn = notificationOn;
            if (update.notificationOn === false) {
                // remove existing tokens
                update.notificationTokens = [];
            }
        }

        if (notificationToken != undefined) {
            if (doc.exists) {
                if (doc.data().notificationTokens === undefined || !doc.data().notificationTokens.find(nt => nt.token === notificationToken.token)) {
                    update.notificationTokens = FieldValue.arrayUnion(notificationToken);
                }
            } else {
                update.notificationTokens = [notificationToken];
            }
        }

        functions.logger.info("Update Notifications", "update", update);
        if (doc.exists) {
            return doc.ref.update(update);
        } else {
            return docRef.set(update);
        }
    });
});

// function getAccessToken() {
//     return admin.credential.applicationDefault().getAccessToken();
// }

// function sendNotification(accessToken, title, body, link, deviceToken) {
//     const postData = {
//         message: {
//             "notification": {
//                 "title": title,
//                 "body": body,
//             },
//             "webpush": link ? {
//                 "fcm_options": {
//                     "link": link,
//                 },
//             } : undefined,
//         },
//     };

//     const headers = {
//         "Authorization": "Bearer " + accessToken.access_token,
//         "Content-Type": "application/json",
//     };
//     const url = "https://fcm.googleapis.com/v1/projects/mindramp-58e89/messages:send";
//     postData.message.token = deviceToken;

//     return axios.post(url, postData, {
//         headers,
//     }).then(() => ({ success: true }));
// }

exports.sendNotificationTest = functions.region("europe-west1").https.onCall((data, context) => {
    const { isDev } = data;

    if (context?.auth?.token?.email?.length > 0) {
        return addNotification(undefined, "test_notification", [], [], [context.auth.token.email], isDev);
    }

    // const postData = {
    //     message: {
    //         "notification": {
    //             "title": title,
    //             "body": body,
    //         },
    //         "webpush": link ? {
    //             "fcm_options": {
    //                 "link": link,
    //             },
    //         } : undefined,
    //     },
    // };

    // return getAccessToken().then((accessToken) => {
    //     return db.collection(isDev ? "users_dev" : "users").doc(context.auth.token.email).collection("personal").doc("Default").get().then(doc => {
    //         if (doc.exists && doc.data().notificationTokens && doc.data().notificationTokens.length > 0) {
    //             const headers = {
    //                 "Authorization": "Bearer " + accessToken.access_token,
    //                 "Content-Type": "application/json",
    //             };
    //             const url = "https://fcm.googleapis.com/v1/projects/mindramp-58e89/messages:send";
    //             const notifToken = doc.data().notificationTokens[0];
    //             postData.message.token = notifToken.token;

    //             return axios.post(url, postData, {
    //                 headers,
    //             }).then((res) => ({ success: true }));
    //         }
    //     });
    // });
});

exports.forgotUser = functions.region("europe-west1").https.onCall((data, context) => {
    const { isDev, phone } = data;
    const phoneNumber = phone.replace(/[^\d]+/g, "");

    return db.collection(isDev ? "users_dev" : "users").where("phone", "==", phoneNumber).get().then(res => {
        if (res.docs && res.docs.length > 0) {
            const email = res.docs[0].id;

            return addNotification(undefined, "send_user_info", [email], [], [email], isDev);
        } else {
            throw new functions.https.HttpsError("failed-precondition", "UnknownPhone", `Phone number '${phoneNumber}' not found`);
        }
    });
});

exports.forgotPwd = functions.region("europe-west1").https.onCall((data, context) => {
    // const { isDev } = data;
    const phoneNumber = functions.config().whatsapp.phonenumber;
    return {
        phone: phoneNumber,
    };
});


exports.notifications = functions.region("europe-west1").pubsub
    // minute (0 - 59) | hour (0 - 23) | day of the month (1 - 31) | month (1 - 12) | day of the week (0 - 6) - Sunday to Saturday
    .schedule("every 1 minutes")
    .timeZone(JERUSALEM)
    .onRun(async (context) => {
        const now = dayjs().utc().tz(JERUSALEM);

        async function handleReminders(isDev) {
            const twoDaysAhead = now.add(2, "days");

            const cachedEvents = await getEventsViaCache(isDev);

            const allEvents = eventsUtil.explodeEvents(cachedEvents.events.map(entry => ({ id: entry.id, ...entry.event })), 1, 2);

            const events = allEvents.filter(ev => ev.reminderMinutes !== undefined &&
                ev.date >= now.format("YYYY-MM-DD") &&
                ev.date <= twoDaysAhead.format("YYYY-MM-DD") &&
                (
                    !ev.notified ||
                    ev.recurrent && !ev.instanceStatus && ev.notified < now.format("YYYY-MM-DD") // recurrent meeting (not instance)
                )
            );

            const notifyEvents = [];

            events.forEach(ev => {
                const reminderStart = dayjs.tz(ev.start, JERUSALEM).subtract(ev.reminderMinutes, "minutes");
                if (reminderStart.isBefore(now)) {
                    notifyEvents.push(ev);
                } else {
                    functions.logger.log("Notifications, time:", now.format("YYYY-MM-DDTHH:mm"), "skipped event:", ({ title: ev.title, date: ev.date, start: ev.start, id: ev.id, reminderAt: reminderStart.format("YYYY-MM-DDTHH:mm") }));
                }
            });

            functions.logger.log("Notifications, time:", now.format("YYYY-MM-DDTHH:mm"), "notify events" + (isDev ? " dev" : ""), notifyEvents.map(e => ({ title: e.title, date: e.date, start: e.start, id: e.id })));

            if (notifyEvents.length > 0) {
                const batch = db.batch();
                const notifiedChange = { notified: now.format("YYYY-MM-DD HH:mm:ss") };
                notifyEvents.forEach(ev => {
                    const notifyList = getParticipantsAsArray(ev.participants).map(p => p.email);
                    if (ev.guide && !notifyList.includes(ev.guide.email)) {
                        notifyList.push(ev.guide.email);
                    }

                    addNotification(batch, "event_reminder", [ev.title, getReminderString(ev)], [], notifyList, isDev);

                    // Update event being notified:
                    const docRef = db.collection(isDev ? "event_dev" : "event").doc(ev.id);
                    batch.update(docRef, notifiedChange);
                    updateEventInCache(isDev, ev.id, notifiedChange);
                });
                return batch.commit();
            }
        }
        return Promise.all([
            handleReminders(true),
            handleReminders(false),
        ]);
    });


function getReminderString(ev, now) {
    const startTime = dayjs.tz(ev.start, JERUSALEM);
    return getBeforeTimeText(startTime.diff(now, "minutes"));
}

function isBetween(num, from, to) {
    return num >= from && num <= to;
}

function getBeforeTimeText(minutes) {
    if (minutes < 0) {
        return " לפני " + minutes + " דקות";
    }

    if (minutes === 0) {
        return " עכשיו";
    }

    if (isBetween(minutes, 0, 10)) {
        return "עוד " + minutes + " דקות";
    }

    if (isBetween(minutes, 10, 15)) {
        return "עוד רבע שעה";
    }

    if (isBetween(minutes, 15, 23)) {
        return "עוד 20 דקות";
    }
    if (isBetween(minutes, 23, 37)) {
        return "עוד חצי שעה";
    }
    if (isBetween(minutes, 37, 51)) {
        return "עוד שלושת רבעי שעה";
    }
    if (isBetween(minutes, 51, 75)) {
        return "עוד שעה";
    }
    if (isBetween(minutes, 75, 100)) {
        return "עוד שעה וחצי";
    }
    if (isBetween(minutes, 100, 130)) {
        return "עוד שעתיים";
    }
    if (minutes > 1400) {
        return "מחר";
    }

    return "עוד מעל שעתיים";
}

exports.eventChanged = functions.region("europe-west1").firestore
    .document("event/{eventID}")
    .onWrite((change, context) => {
        return handleParticipantAdded(false, change, context);
    });

exports.eventChangedDev = functions.region("europe-west1").firestore
    .document("event_dev/{eventID}")
    .onWrite((change, context) => {
        return handleParticipantAdded(true, change, context);
    });

function getParticipantsAsArray(participants) {
    const ret = [];
    if (participants) {
        // eslint-disable-next-line no-unused-vars
        for (const [key, value] of Object.entries(participants)) {
            ret.push(value);
        }
    }
    return ret;
}


function handleParticipantAdded(isDev, change, context) {
    const added = [];
    let removed = [];
    let previousParticipants = [];
    let title = "";
    let date = "";
    let guideBefore = undefined;
    let guideAfter = undefined;

    if (change.before.exists) {
        previousParticipants = getParticipantsAsArray(change.before.data().participants);

        title = change.before.data().title;
        date = change.before.data().start;
        guideBefore = change.before.data().guide?.email;
    }

    if (change.after.exists) {
        if (eventsUtil.inThePast(change.after.data().end)) {
            // if the event ends in the past
            functions.logger.info("change event in the past");
            return false;
        }

        title = change.after.data().title;
        date = change.after.data().start;

        const newParticipants = getParticipantsAsArray(change.after.data().participants);

        newParticipants.forEach(pAfter => {
            const prevIndex = previousParticipants.find(pp => pp.email === pAfter.email);
            if (!change.before.exists || prevIndex < 0) {
                added.push(pAfter.email);
            }
        });

        // remove those who are no longer in the after
        previousParticipants.forEach(pp => {
            if (!newParticipants.find(pAfter => pAfter.email === pp.email)) {
                removed.push(pp.email);
            }
        });

        guideAfter = change.after.data().guide?.email;
    } else {
        removed = previousParticipants;
    }

    const niceDate = eventsUtil.getNiceDate(date);

    /*
      Send notification to added/removed participants
    */

    const batch = db.batch();
    if (added.length > 0) {
        addNotification(batch, "person_added2", [title, niceDate.day, niceDate.date, niceDate.hour], [], added, isDev);
    }
    if (removed.length > 0) {
        addNotification(batch, "person_removed2", [title, niceDate.day, niceDate.date, niceDate.hour], [], removed, isDev);
    }

    // if (meetigChange) {
    // notify about the change to participants not in removed and not in added
    // }

    if (guideBefore !== guideAfter) {
        if (guideBefore) {
            addNotification(batch, "guide_removed", [title, niceDate.day, niceDate.date, niceDate.hour], [], [guideBefore], isDev);
        }

        if (guideAfter) {
            addNotification(batch, "guide_added", [title, niceDate.day, niceDate.date, niceDate.hour], [], [guideAfter], isDev);
        }
    } else if (guideAfter) {
        // todo meeting update - notify guideAfter
    }

    return batch.commit();
}

/* ----- Users/Role Management --------*/

// array 0 - dev, 1 - prod
const gRoles = [undefined, undefined];
const gRolesEtag = [undefined, undefined];

async function getRoleViaCach(isDev) {
    const index = isDev ? 0 : 1;
    let cachedEtag = gRolesEtag[index];
    const latestTag = await getTag(isDev);

    if (gRoles[index]) {
        if (cachedEtag !== latestTag) {
            gRoles[index] = undefined;
            cachedEtag = latestTag;
        }
    }

    if (!gRoles[index]) {
        const collection = isDev ? db.collection("role_dev") : db.collection("role");
        const res = await collection.get();
        gRoles[index] = res.docs.map(role => ({ id: role.id, ...role.data() }));
        gRolesEtag[index] = latestTag;
    }

    return gRoles[index];
}


exports.getRoles = functions.region("europe-west1").https.onCall((data, context) => {
    const isDev = data.isDev;

    return getUserRoles(isDev, context).then(roles => {
        if (!roles.includes(Roles.UserAdmin)) {
            throwNoUserAdmin();
        }
        return getRoleViaCach(isDev);
    });
});


async function getUserRoles(isDev, context) {
    if (!context.auth) {
        return [];
    }
    const user = context.auth.token.email;
    return getUserRolesInternal(isDev, user, true);
}

async function getUserRolesInternal(isDev, user, recursive) {
    const roles = await getRoleViaCach(isDev);

    // recursive resolve roles
    const userRoles = [];
    roles.forEach(role => {
        if (!userRoles.includes(role.id) && role.members.includes(user)) {
            if (recursive) {
                recursiveAssignRole(userRoles, roles, role);
            } else {
                userRoles.push(role.id);
            }
        }
    });

    return userRoles;
}

function recursiveAssignRole(userRoles, roles, role) {
    userRoles.push(role.id);
    role.assignRoles?.forEach(ar => {
        if (!userRoles.includes(ar)) {
            const assignedRole = roles.find(r => r.id === ar);
            if (assignedRole) {
                recursiveAssignRole(userRoles, roles, assignedRole);
            }
        }
    });
}

function throwNoUserAdmin() {
    throw new functions.https.HttpsError("failed-precondition", "notUserAdmin", "User Admin role is missing");
}

function throwNoEditPermission() {
    throw new functions.https.HttpsError("failed-precondition", "noEditPermission", "Editing permission is missing");
}

exports.registerUser = functions.region("europe-west1").https.onCall(async (data, context) => {
    const isDev = data.isDev;
    const info = data.info;
    const roles = data.roles;

    if (info.phone) {
        let phone = info.phone.replace(/[^\d]+/g, "");
        if (phone.startsWith("972")) {
            phone = phone.replace("972", "0");
        }
        info.phone = phone;
    }

    const userRoles = await getUserRoles(isDev, context);

    if (userRoles.includes(Roles.UserAdmin)) {
        return admin.auth()
            .createUser({
                uid: data.email,
                email: data.email,
                emailVerified: false,
                password: data.password,
                displayName: data.displayName,
                disabled: false,
            }).then(
                () => {
                    const batch = db.batch();
                    const docRef = db.collection(isDev ? "users_dev" : "users").doc(data.email);
                    batch.set(docRef, info);
                    if (roles) {
                        // Calculate the difference

                        roles.forEach(role => {
                            // only assign roles that the current user has (cannot elevate roles)
                            if (userRoles.includes(role) || allowedElevateRoles.includes(role)) {
                                const docRoleRef = db.collection(isDev ? "role_dev" : "role").doc(role);
                                batch.update(docRoleRef, { members: FieldValue.arrayUnion(data.email) });
                            }
                        });
                    }
                    return batch.commit().then(() => promoteTag(isDev, dayjs().format(tagFormat)));
                }
            ).catch(err => {
                if (err.message.indexOf("uid already exists") > 0) {
                    throw new functions.https.HttpsError("already-exists", "משתמש כבר קיים", `משתמש עם מזהה ${data.email} כבר קיים במערכת`);
                }
                throw new functions.https.HttpsError("internal", err.message);
            });
    } else {
        throwNoUserAdmin();
    }
});

exports.deleteUser = functions.region("europe-west1").https.onCall(async (data, context) => {
    const isDev = data.isDev;
    const email = data.email;

    const userRoles = await getUserRoles(isDev, context);

    if (userRoles.includes(Roles.UserAdmin)) {
        return admin.auth().deleteUser(email).then(() => {
            const docRef = db.collection(isDev ? "users_dev" : "users").doc(email);
            return docRef.get().then(async (userDoc) => {
                if (userDoc.exists) {
                    const batch = db.batch();
                    const path = userDoc.data().avatar?.path;
                    if (path && path.length > 0) {
                        const storageRef = admin.storage().bucket();
                        const docToDeleteRef = storageRef.file(path);
                        await docToDeleteRef.delete();
                    }
                    batch.delete(userDoc.ref);

                    const userRoles = await getUserRolesInternal(isDev, email, false);
                    userRoles.forEach(roleToRemove => {
                        const roleDocRef = db.collection(isDev ? "role_dev" : "role").doc(roleToRemove);
                        batch.update(roleDocRef, { members: FieldValue.arrayRemove(email) });
                    });
                    return batch.commit().then(() => promoteTag(isDev, dayjs().format(tagFormat)));
                }
            });
        });
    } else throwNoUserAdmin();
});

exports.getUserRoles = functions.region("europe-west1").https.onCall(async (data, context) => {
    const isDev = data.isDev;
    const email = data.email;

    const currentUserRoles = await getUserRoles(isDev, context);
    const isUserAdmin = (currentUserRoles.includes(Roles.UserAdmin));

    if (isUserAdmin || email === context.auth.token.email) {
        const userRolesRecursive = await getUserRolesInternal(isDev, email, true);
        const userRoles = await getUserRolesInternal(isDev, email, false);
        return userRolesRecursive.map(urr => {
            const explicit = (userRoles.includes(urr));
            return {
                id: urr,
                implicit: !explicit,
            };
        });
    } else throwNoUserAdmin();
});
exports.updateUser = functions.region("europe-west1").https.onCall(async (data, context) => {
    const currentUser = context.auth.token.email;
    const isDev = data.isDev;
    const roles = data.roles;
    const email = data.email;
    const info = data.info;

    functions.logger.info("updateUser", data);


    if (info.phone) {
        let phone = info.phone.replace(/[^\d]+/g, "");
        if (phone.startsWith("972")) {
            phone = phone.replace("972", "0");
        }
        info.phone = phone;
    }
    // Who can modify users:
    // - UserAdmin role (change roles as long as he/she himself has them)
    // - the User himself (but cannot change any role)

    const userRoles = await getUserRoles(isDev, context);
    const isUserAdmin = (userRoles.includes(Roles.UserAdmin));
    if (email === currentUser || isUserAdmin) {
        const batch = db.batch();
        const docRef = db.collection(isDev ? "users_dev" : "users").doc(email);
        batch.update(docRef, info);
        let rolesChanged = false;
        if (isUserAdmin && roles) {
            const userRolesBefore = await getUserRolesInternal(isDev, email, false);
            functions.logger.info("updateUser-update roles", roles, userRolesBefore);

            const newRoles = roles.filter(r => !userRolesBefore.includes(r));
            const removedRoles = userRolesBefore.filter(ur => !roles.includes(ur));
            const roleColl = db.collection(isDev ? "role_dev" : "role");

            removedRoles.forEach(removeRole => {
                batch.update(roleColl.doc(removeRole), { members: FieldValue.arrayRemove(email) });
            });

            newRoles.forEach(newRole => {
                batch.update(roleColl.doc(newRole), { members: FieldValue.arrayUnion(email) });
            });

            // todo - check for role ellevation

            rolesChanged = removedRoles.length > 0 || newRoles.length > 0;
        }
        return batch.commit().then(() => {
            if (rolesChanged) {
                // promote the tag only if roles have been changed
                promoteTag(isDev, dayjs().format(tagFormat));
            }
        });
    } else throwNoUserAdmin();
});


/**
 * Events Management
 */
let gEvents;
let gEventsDev;
let gEtagDev;
let gEtag;

async function promoteTag(isDev, tag, noCreate) {
    const storageRef = admin.storage().bucket();

    const metadata = {
        metadata: {
            tag,
        }
    };
    const fileName = isDev ? "event-marker-dev" : "event-marker";
    try {
        await storageRef.file(fileName).setMetadata(metadata);
    } catch (e) {
        functions.logger.error("Cannot update event marker" + (noCreate ? "" : " try create file"), e, "isDev", isDev);
        if (!noCreate) {
            const file = storageRef.file(fileName);
            return file.save("", {
                gzip: false,
                contentType: "text/plain"
            }).then(() => {
                return promoteTag(isDev, tag, true);
            });
        }
    }
}

async function getTag(isDev) {
    const storageRef = admin.storage().bucket();
    const fileName = isDev ? "event-marker-dev" : "event-marker";
    try {
        const metadata = await storageRef.file(fileName).getMetadata();
        return metadata[0].metadata.tag;
    } catch (e) {
        return undefined;
    }
}

function getEventCollection(isDev) {
    return isDev ? db.collection("event_dev") : db.collection("event");
}

function getEventArchiveCollection(isDev) {
    return isDev ? db.collection("event-archive_dev") : db.collection("event-archive");
}


async function verifyEditEventPermission(isDev, context, eventObj, addIfMissing) {
    const roles = await getUserRoles(isDev, context);

    if (!roles.includes(Roles.ContentAdmin)) {
        if (!roles.includes(Roles.Editor)) {
            throwNoEditPermission();
        } else {
            const email = context.auth.token.email;
            functions.logger.info("Editor only", email);
            const participantKey = getParticipantKey(email);
            if (!eventObj.participants[participantKey]) {
                if (!addIfMissing) {
                    throwNoEditPermission();
                }
                // Since the user is only "editor", we add him/her as participant
                const user = await db.collection(isDev ? "users_dev" : "users").doc(email).get();
                if (!user.exists) {
                    functions.logger.info("Editor only - cannot find user info", email);
                    throwNoEditPermission();
                }
                eventObj.participants[participantKey] = {
                    email,
                    displayName: user.data().fname + " " + user.data().lname,
                };

                if (user.data().avatar) {
                    eventObj.participants[participantKey].icon = user.data().avatar.url;
                }
            }
        }
    }
}

async function verifyDeleteEventPermission(isDev, context, eventID) {
    const roles = await getUserRoles(isDev, context);

    if (!roles.includes(Roles.ContentAdmin)) {
        if (!roles.includes(Roles.Editor)) {
            throwNoEditPermission();
        }
        const email = context.auth.token.email;
        const event = await getEventCollection(isDev).doc(eventID).get();
        if (!event.exists || !event.data().participants[getParticipantKey(email)]) {
            throwNoEditPermission();
        }
    }
}

exports.upsertEvent = functions.region("europe-west1").https.onCall(async (data, context) => {
    const isDev = data.isDev;
    const eventObj = data.event;
    const id = data.id;

    await verifyEditEventPermission(isDev, context, eventObj, true);

    const collection = getEventCollection(isDev);
    const returnEvent = {};

    eventObj.modifiedAt = dayjs().format(tagFormat);

    // Translate deleteField() from client into FieldValue.delete()
    Object.entries(eventObj).forEach(([key, value]) => {
        if (value && value._methodName === "deleteField") {
            eventObj[key] = FieldValue.delete();
        } else if (value !== undefined) {
            returnEvent[key] = value;
        }
    });

    if (id) {
        const docRef = collection.doc(id);
        if (returnEvent.recurrent && (returnEvent.recurrent.gid === undefined || returnEvent.recurrent.gid.length === 0)) {
            eventObj.recurrent.gid = id;
            returnEvent.recurrent.gid = id;
        }

        return docRef.update(eventObj).then(() => promoteTag(isDev, eventObj.modifiedAt).then(() => ({
            event: returnEvent,
            id: docRef.id,
        })));
    } else {
        const docRef = collection.doc();
        if (returnEvent.recurrent && (returnEvent.recurrent.gid === undefined || returnEvent.recurrent.gid.length === 0)) {
            eventObj.recurrent.gid = docRef.id;
            returnEvent.recurrent.gid = docRef.id;
        }
        return docRef.set(eventObj).then(() => promoteTag(isDev, eventObj.modifiedAt).then(() => ({
            event: returnEvent,
            id: docRef.id,
        })));
    }
});

exports.createEventInstance = functions.region("europe-west1").https.onCall(async (data, context) => {
    const isDev = data.isDev;
    const eventObj = data.event;
    const id = data.id;

    await verifyEditEventPermission(isDev, context, eventObj, false); // editor cannot make instance of an event he/she is not part of

    eventObj.instanceStatus = true;
    eventObj.recurrent = { gid: id };
    eventObj.modifiedAt = dayjs().format(tagFormat);

    const collection = getEventCollection(isDev);

    const batch = db.batch();
    const seriesRef = collection.doc(id);

    return seriesRef.get().then((seriesDoc) => {
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

        const instanceRef = collection.doc();
        batch.update(seriesRef, { recurrent: seriesDocObj.recurrent, modifiedAt: eventObj.modifiedAt });
        batch.set(instanceRef, eventObj);
        return batch.commit().then(() => promoteTag(isDev, eventObj.modifiedAt).then(
            () => ({
                seriesId: seriesRef.id,
                instanceId: instanceRef.id,
                instanceEvent: eventObj,
                seriesEvent: seriesDocObj,
            })));
    });
});

exports.createEventInstanceAsDeleted = functions.region("europe-west1").https.onCall(async (data, context) => {
    const isDev = data.isDev;
    const id = data.id;
    const excludeDate = data.excludeDate;

    // Verify user is admin
    // Editor cannt delete instance if he/she is not a participant
    await verifyDeleteEventPermission(isDev, context, id, false);

    const collection = getEventCollection(isDev);
    const seriesRef = collection.doc(id);
    return seriesRef.get().then((seriesDoc) => {
        const seriesDocObj = seriesDoc.data();
        seriesDocObj.modifiedAt = dayjs().format(tagFormat);


        if (!seriesDocObj || !seriesDocObj.recurrent) {
            // not expected
            throw new Error("Unexpected missing recurrent info on series event");
        }
        if (!seriesDocObj.recurrent.exclude) {
            seriesDocObj.recurrent.exclude = [excludeDate];
        } else {
            seriesDocObj.recurrent.exclude.push(excludeDate);
        }

        return seriesRef.update(seriesDocObj).then(() => promoteTag(isDev, seriesDocObj.modifiedAt).then(
            () => ({
                seriesId: seriesRef.id,
                seriesEvent: seriesDocObj
            })));
    });
});

exports.deleteEvent = functions.region("europe-west1").https.onCall(async (data, context) => {
    const isDev = data.isDev;
    const id = data.id;
    const deleteModifiedInstance = data.deleteModifiedInstance;

    // Verify user is admin
    await verifyDeleteEventPermission(isDev, context, id);

    const collection = getEventCollection(isDev);
    const archiveCollection = getEventArchiveCollection(isDev);

    if (id) {
        const docRef = collection.doc(id);
        const batch = db.batch();
        if (deleteModifiedInstance) {
            return collection.where("recurrent.gid", "==", id).get().then(instances => {
                const removedIDs = [];
                instances.docs.forEach(doc => {
                    batch.delete(doc.ref);
                    // add to archive
                    batch.set(archiveCollection.doc(doc.id), { ...doc.data(), deletedAt: dayjs().format("YYYY-MM-DD") });

                    removedIDs.push(doc.ref.id);
                });
                batch.delete(docRef);
                removedIDs.push(id);
                return batch.commit().then(() => promoteTag(isDev, dayjs().format(tagFormat))).then(() => removedIDs);
            });
        }
        const doc = await docRef.get();

        batch.delete(docRef);
        batch.set(archiveCollection.doc(id), { ...doc.data(), deletedAt: dayjs().format("YYYY-MM-DD") });

        return batch.commit().then(() => promoteTag(isDev, dayjs().format(tagFormat))).then(() => [id]);
    }
});


function updateEventInCache(isDev, id, change) {
    const cachedEvents = isDev ? gEventsDev : gEvents;
    if (cachedEvents && change) {
        const event = cachedEvents.find(ev => ev.id === id);
        if (event) {
            for (const [key, value] of Object.entries(change)) {
                event.event[key] = value;
            }
        }
    }
}

exports.getDeletedEvents = functions.region("europe-west1").https.onCall(async (data, context) => {
    const isDev = data.isDev;
    const roles = await getUserRoles(isDev, context);
    if (!roles.includes(Roles.ContentAdmin)) {
        throwNoUserAdmin();
    }

    const now = dayjs().utc().tz(JERUSALEM).subtract(10, "day").format("YYYY-MM-DD");
    const archivedEvents = await getEventArchiveCollection(isDev).where("deletedAt", ">=", now).get();
    const cachedEvents = await (await getEventsViaCache(isDev)).events.filter(ce => ce.event.recurrent?.exclude && ce.event.recurrent.exclude.some(ex => ex >= now));

    return {
        series: cachedEvents,
        deleted: archivedEvents.docs.map(doc => ({ event: doc.data(), id: doc.id })),
    };
});

exports.restoreDeletedEvent = functions.region("europe-west1").https.onCall(async (data, context) => {
    const { isDev, eventRecord, date } = data;

    const roles = await getUserRoles(isDev, context);
    if (!roles.includes(Roles.ContentAdmin)) {
        throwNoUserAdmin();
    }

    const batch = db.batch();

    if (eventRecord.event.deletedAt) {
        const doc = await getEventArchiveCollection(isDev).doc(eventRecord.id).get();
        if (doc.exists) {
            batch.delete(doc.ref);
            const docData = doc.data();
            delete docData.deletedAt;

            batch.set(getEventCollection(isDev).doc(eventRecord.id), docData);
        } else {
            throw new functions.https.HttpsError("not-found", "Event not found");
        }
    } else if (date) {
        const seriesRef = getEventCollection(isDev).doc(eventRecord.id);
        const seriesDoc = await seriesRef.get();
        if (seriesDoc.exists) {
            const seriesDocObj = seriesDoc.data();
            if (seriesDocObj.recurrent.exclude) {
                const index = seriesDocObj.recurrent.exclude.indexOf(date);
                if (index >= 0) {
                    seriesDocObj.recurrent.exclude.splice(index, 1);
                }
            }
            batch.update(seriesRef, { recurrent: seriesDocObj.recurrent });
        } else {
            throw new functions.https.HttpsError("not-found", "Series not found");
        }
    } else {
        throw new functions.https.HttpsError("invalid-argument", "Unexpected event to restore");
    }

    return batch.commit().then(() => promoteTag(isDev, dayjs().format(tagFormat)));
});

async function getEventsViaCache(isDev) {
    const collection = isDev ? db.collection("event_dev") : db.collection("event");
    let cachedEvents = isDev ? gEventsDev : gEvents;
    let cachedEtag = isDev ? gEtagDev : gEtag;
    const latestTag = await getTag(isDev);

    if (cachedEvents) {
        // functions.logger.info("Tags", "saved", latestTag, "calc", currentEtag);
        if (cachedEtag !== latestTag) {
            cachedEvents = undefined;
            cachedEtag = latestTag;
        }
    }

    if (!cachedEvents) {
        const res = await collection.get();
        const events = res.docs.map(doc => ({ event: doc.data(), id: doc.id }));
        if (isDev) {
            gEventsDev = events;
            gEtagDev = latestTag;
        } else {
            gEvents = events;
            gEtag = latestTag;
        }
        cachedEvents = events;
    }
    return {
        events: cachedEvents,
        eTag: latestTag,
    };
}


exports.getEvents = functions.region("europe-west1").https.onCall(async (data, context) => {
    const isDev = data.isDev;
    const email = context?.auth?.token?.email;
    const impersonateUser = data.impersonateUser;
    const eTag = data.eTag;

    const cachedEvents = await getEventsViaCache(isDev);
    if (cachedEvents.eTag === eTag) {
        // No Change
        return { noChange: true };
    }

    const roles = await getUserRoles(isDev, context);


    if (impersonateUser && impersonateUser !== email) {
        if (!email) {
            throw new functions.https.HttpsError("permission-denied", "ImpresonationDenied");
        }
        if (!roles.includes(Roles.Kiosk)) {
            throw new functions.https.HttpsError("permission-denied", "ImpresonationDenied", "Impersonated User is not marked to showInKiosk");
        }
    }

    const effectiveEmail = impersonateUser || email;
    const participantKey = effectiveEmail && effectiveEmail.replace(/\./g, "").replace("@", "");

    functions.logger.log("getEvents. roles:", JSON.stringify(roles), "impUser:", impersonateUser, "user:", email, participantKey);

    const returnEvents = cachedEvents.events.filter(entry =>
        roles.includes(Roles.ContentAdmin) || // content-admin loads all
        entry.event.participants === undefined || // public event
        Object.entries(entry.event.participants).length === 0 ||
        roles.includes(Roles.SharedScreen) && entry.event.showOnSharedScreen || // Showing on shared screen
        (participantKey && entry.event.participants && entry.event.participants[participantKey]) || // The user is a participant
        entry.event.guide && entry.event.guide.email === effectiveEmail); // the user is a guide
    return {
        eTag: cachedEvents.eTag,
        events: returnEvents,
    };
});


const backupCollections = [
    { name: "event" },
    { name: "event-archive" },
    { name: "media" },
    { name: "rooms" },
    {
        name: "users",
        // subCollections: [
        //     { name: "system" },
        //     { name: "personal" },
        // ],
    },
    { name: "role" },
];

exports.BackupDB = functions.region("europe-west1").pubsub
    // minute (0 - 59) | hour (0 - 23) | day of the month (1 - 31) | month (1 - 12) | day of the week (0 - 6) - Sunday to Saturday
    .schedule("00 01 * * *") // Every day at 01:00
    .timeZone("Asia/Jerusalem")
    .onRun((context) => {
        const zipName = "backup|" + dayjs().format("YYYY-MM-DD HH:mm") + ".zip";
        const output = fs.createWriteStream("/tmp/" + zipName);
        const archive = archiver("zip", {
            gzip: true,
            zlib: { level: 9 }, // Sets the compression level.
        });

        archive.on("error", (err) => {
            functions.logger.error("BackupDB failed", err);
            throw (err);
        });

        // pipe archive data to the output file
        archive.pipe(output);

        const waitFor = [];

        for (let i = 0; i < backupCollections.length; i++) {
            waitFor.push(db.collection(backupCollections[i].name).get().then(async (collData) => {
                const name = backupCollections[i].name + "|" + dayjs().format("YYYY-MM-DD HH:mm") + ".json";
                const fileName = "/tmp/backup|" + name;

                fs.appendFileSync(fileName, "[\n");
                for (let docIndex = 0; docIndex < collData.size; docIndex++) {
                    const doc = collData.docs[docIndex];
                    const backupDoc = doc.data();
                    backupDoc._docID = doc.ref.id;

                    if (backupCollections[i].subCollections) {
                        for (let j = 0; j < backupCollections[i].subCollections.length; j++) {
                            const subColl = backupCollections[i].subCollections[j];
                            const subColDocs = await db.collection(backupCollections[i].name).doc(doc.ref.id).collection(subColl.name).get();
                            backupDoc[subColl.name] = [];
                            subColDocs.forEach(subColDoc => {
                                const backupSubColDoc = subColDoc.data();
                                backupSubColDoc._docID = subColDoc.ref.id;
                                backupDoc[subColl.name].push(backupSubColDoc);
                            });
                        }
                    }

                    fs.appendFileSync(fileName, JSON.stringify(backupDoc, undefined, " "));
                    fs.appendFileSync(fileName, ",\n");
                }
                fs.appendFileSync(fileName, "]");
                console.log("add to archive", name);
                archive.file(fileName, { name });
            }));
        }
        return Promise.all(waitFor).then(() => {
            console.log("finalize archive");
            archive.finalize().then(
                () => admin.storage().bucket().upload("/tmp/" + zipName, {
                    destination: `backups/${zipName}`,
                }).then(
                    () => {
                        console.log("Backup complete successfuly!");
                        return archiveData();
                    },
                    (err) => console.log("Backup failed", err)),
            );
        });
    });


function archiveData() {
    const thresholdDate = dayjs().subtract(7, "day").format("YYYY-MM-DD");

    return db.collection("event").get().then(ev => {
        let past = 0;
        let recurrent = 0;
        let instance = 0;
        let pastInstance = 0;
        const batch = db.batch();
        ev.docs.forEach(event => {
            const data = event.data();
            if (data.recurrent) {
                recurrent++;
                if (data.instanceStatus) {
                    instance++;
                    if (data.date < thresholdDate) {
                        pastInstance++;
                    }
                }
            }
            if (data.date < thresholdDate) {
                past++;

                // only move non-recurrent or recurrent's instances which are in the past
                if ((!data.recurrent || data.instanceStatus) &&
                    (!data.allDay || (data.allDay && dayjs(data.enddate).format("YYYY-MM-DD") < thresholdDate))) {
                    batch.delete(event.ref);
                    batch.set(db.collection("event-archive").doc(event.ref.id), data);
                    // console.log("archive", data.title, data.date, data.recurrent, data.instanceStatus, data.allDay, data.enddate);
                }
            }
        });

        functions.logger.info("Current events", ev.docs.length, "All past-events", past, "Recurrent-events", recurrent, "instance-events", instance, "past recurring-instance-events", pastInstance);
        return batch.commit();
    });
}

/**
*  *******************
*  WhatApp integration
*  *******************
- The integration is based on WhatsApp Business API.
- Facebook offer a free tier of 1000 conversations a month. A conversation is counted as follows:
  either user initiated or business initiated message, followed by any number of messages in the next 24hours window.
  This means, if we have about 50 active users in Beit Galgalim and
  all of them interact with the system on every working day (~20 days a month), then we reach the limit, and start pay
  around .02 cent per conversation.
- We register one phone number to be the "system"'s number, and all interactions are 1:1 between the system and a parson.
- To send a whatsApp message, simply insert a record into "notifications" collection. It has to have a template if this is
  business initiated message, so a template must be prepared and approved in facebook
- free text (not template based), are to respond to users messages. One the business responds, it is allowed to send anything.

- Message we plan to send/recieve:
  - you are invited to a meeting (done)
    - approval of meeting invite (todo)
  - you are removed from a meeting (done)
  - your meeting is modified (todo)
  - password reset (done)
  - meeting reminder (todo)
  - backup failed - send to system operators (todo)
**/

const addNotification = (batch, message_template, parametersValues, quickReplyParameters, toEmailArray, isDev) => {
    const notifDoc = db.collection(NOTIFICATIONS_COLLECTION).doc();
    const parameters = parametersValues.map(text => ({ type: "text", text }));
    const docData = {
        message_template,
        parameters,
        quickReplyParameters,
        createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        to: toEmailArray,
        isDev,
    };
    if (batch) {
        batch.set(notifDoc, docData);
        return;
    }

    return notifDoc.set(docData);
};

const addNotificationFree = (message_body, toEmailArray, isDev) => {
    const notifDoc = db.collection(NOTIFICATIONS_COLLECTION).doc();
    const docData = {
        message_body,
        createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        to: toEmailArray,
        isDev,
    };

    return notifDoc.set(docData);
};


app.get("/whatsapp/webhooks", (req, res) => {
    functions.logger.info("WhatApp Webhooks GET: " + JSON.stringify(req.query), req.query);
    if (req.query["hub.verify_token"] == functions.config().whatsapp.verifytoken && req.query["hub.mode"] == "subscribe") {
        res.send(req.query["hub.challenge"]);
    }

    res.send("fail");
});

app.use(bodyParser.json({
    verify: webhookMiddleware.extractRawBody,
}));

app.use(webhookMiddleware({
    algorithm: "sha256",
    secret: functions.config().whatsapp.appsecret,
    require: false,
    header: "x-hub-signature-256",
}));

app.post("/whatsapp/webhooks", (req, res) => {
    functions.logger.info("WhatApp Webhooks POST: ", req.body);
    const sentSignature = req.headers["x-hub-signature-256"];
    if (!sentSignature) {
        functions.logger.info("WhatApp webhook is missing 'x-hub-signature' header", req.headers);
        res.send("not ok");
        return;
    }
    // if it exists, the x-hub-sgnature middleware has checked it to be valid.

    if (req.body?.object === "whatsapp_business_account") {
        const entry = req.body ? req.body.entry[0] : undefined;
        if (entry) {
            const waitFor = entry.changes.map(change => {
                if (change?.value?.messages) {
                    change.value.messages.forEach(message => {
                        if (message?.text?.body?.length > 0 ||
                            message.button && message.button.text === "todo") {
                            const text = message.text ? message.text.body : message.button.payload;


                            // find the user, based on his/her phone
                            const phoneNumber = message.from.replace("972", "0");
                            return db.collection("users").where("phone", "==", phoneNumber).get().then(res => {
                                if (res.docs && res.docs.length > 0) {
                                    const email = res.docs[0].id;
                                    return handleIncomingTextMessage(text, email, false);
                                } else {
                                    // try dev users:
                                    return db.collection("users_dev").where("phone", "==", phoneNumber).get().then(res => {
                                        if (res.docs && res.docs.length > 0) {
                                            const email = res.docs[0].id;
                                            return handleIncomingTextMessage(text, email, true);
                                        } else {
                                            functions.logger.info("Unknown phone", phoneNumber, "msg", text);
                                        }
                                    });
                                }
                            });
                        } else {
                            functions.logger.info("unknown message: ", message.from, message.text.body);

                            return sendFreeMessage("בקשה/הודעה לא מוכרת - בקשת נדחית.", [message.from]);
                        }
                    });
                } else {
                    functions.logger.info("unknown incoming post whatsapp webhook: ", change);
                }
            });

            return Promise.all(waitFor).then(() => res.status(200).send("EVENT_RECEIVED"));
        } else {
            functions.logger.info("No entry");
        }
    } else {
        functions.logger.info("unknown message type");
    }

    res.status(200).send("EVENT_RECEIVED");
});

const handleIncomingTextMessage = (text, fromEmail, isDev) => {
    if (text.startsWith("סיסמא") || text.startsWith("סיסמה")) {
        const newPwd = text.substr(5).trim();
        // change password flow:
        const auth = admin.auth();
        return auth.getUserByEmail(fromEmail).then((userRecord) => {
            auth.updateUser(userRecord.uid, {
                email: fromEmail,
                password: newPwd,
            }).then(
                () => {
                    functions.logger.info("Successful password reset", fromEmail);
                    return addNotificationFree("סיסמא הוחלפה בהצלחה. \nמשתמש: " + fromEmail + "\nסיסמא חדשה: " + newPwd + "\n", [fromEmail], isDev);
                },
                err => {
                    functions.logger.info("Password reset failed", fromEmail, err);
                    return addNotificationFree("החלפת סיסמא נכשלה.\nשגיאה: " + err.toString() + "\n", [fromEmail], isDev);
                });
        });
    } else {
        functions.logger.info("unknown text message: ", text, fromEmail);
    }
};


const sendFreeMessage = (msg_body, numbers) => {
    const postData = {
        messaging_product: "whatsapp",
        to: "",
        type: "text",
        text: {
            preview_url: false,
            body: msg_body,
        },
    };
    return sendWhatAppMessage(postData, numbers);
};

const sendTemplateMessage = (msg_template, parameters, quickReplyParameters, numbers) => {
    const components = [];
    if (parameters && parameters.length > 0) {
        components.push({
            type: "body",
            parameters,
        });
    }

    if (quickReplyParameters && quickReplyParameters.length > 0) {
        components.push(quickReplyParameters.map((param, i) => ({
            type: "button",
            sub_type: "quick_reply",
            index: "" + i,
            parameters: [
                {
                    "type": "payload",
                    "payload": param,
                },
            ],
        })));
    }

    const postData = {
        messaging_product: "whatsapp",
        to: "",
        type: "template",
        template: {
            name: msg_template,
            language: { code: "he" },
            components,
        },
    };
    return sendWhatAppMessage(postData, numbers);
};

const sendWhatAppMessage = (postData, numbers) => {
    const url = `https://graph.facebook.com/v14.0/${functions.config().whatsapp.phoneid}/messages`;

    const headers = {
        "Authorization": "Bearer " + functions.config().whatsapp.accesstoken,
        "Content-Type": "application/json",
    };

    const waitFor = [];
    numbers.forEach((number) => {
        postData.to = number.startsWith("0") ?
            "972" + number.substr(1) :
            number.startsWith("+") ? number.substr(1) : number;

        // functions.logger.info("send whatsapp", { url, postData, headers });

        waitFor.push(
            axios.post(url, postData, {
                headers,
            }),
        );
    });
    return Promise.all(waitFor);
};

exports.httpApp = functions.region("us-central1").https.onRequest(app);

exports.notificationAdded = functions.region("europe-west1").firestore
    .document("notifications/{notifID}")
    .onCreate((snapshot, context) => {
        const isDev = snapshot.data().isDev;

        const usersRef = db.collection(isDev ? "users_dev" : USERS_COLLECTION);
        return usersRef.get().then(users => {
            const to = snapshot.data().to;
            const phoneNumbers = [];

            if (to.length > 0 && to[0] === "all" || to[0] === "all-exclude") {
                users.docs.forEach(user => {
                    if (to[0] === "all" || !to.includes(user.ref.id)) {
                        // Send Message
                        if (user && user.data().phone && user.data().phone.length > 0) {
                            phoneNumbers.push(user.data().phone);
                        }
                    }
                });
            } else {
                to.forEach(sentToUser => {
                    const user = users.docs.find(u => u.ref.id === sentToUser);

                    if (user && user.data().phone && user.data().phone.length > 0) {
                        phoneNumbers.push(user.data().phone);
                    }
                });
            }

            if (phoneNumbers.length > 0) {
                if (snapshot.data().message_template) {
                    return sendTemplateMessage(snapshot.data().message_template, snapshot.data().parameters,
                        snapshot.data().quickReplyParameters, phoneNumbers);
                } else {
                    return sendFreeMessage(snapshot.data().message_body, phoneNumbers);
                }
            }
        });
    });


