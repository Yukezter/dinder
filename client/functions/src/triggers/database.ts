import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as refs from '../refs'

/* ---------- DATABASE EVENT TRIGGERS ---------- */

/* ON UPDATE USER LAST ONLINE */

export const onUpdateLastOnline = functions.database
  .instance('dinder-33ca6-default-rtdb')
  .ref('/users/{uid}/lastOnline')
  .onWrite(async (change, context) => {
    try {
      if (change.after.exists()) {
        await admin
          .firestore()
          .doc(`/status/${context.params.uid}`)
          .set(
            {
              lastOnline: new Date(change.after.val()),
            },
            { merge: true }
          )
      }
    } catch (error) {
      functions.logger.log(error)
      console.log(error)
    }
  })

/* ON DELETE USER CONNECTIONS */

export const onDeleteUserStatus = functions.database
  .instance('dinder-33ca6-default-rtdb')
  .ref('/users/{uid}/connections')
  .onDelete(async (change, context) => {
    try {
      await admin.firestore().doc(`status/${context.params.uid}`).set(
        {
          state: 'offline',
        },
        { merge: true }
      )
    } catch (error) {
      functions.logger.error(error)
    }
  })

/* ON CREATE PARTY CONNECTIONS */

export const onCreatePartyConnections = functions.database
  .instance('dinder-33ca6-default-rtdb')
  .ref('/parties/{id}/connections')
  .onCreate(async (change, context) => {
    try {
      await refs.firestore.parties
        .doc(context.params.id)
        .set({ active: true }, { merge: true })
    } catch (error) {
      functions.logger.error(error)
    }
  })

/* ON DELETE PARTY CONNECTIONS */

export const onDeletePartyConnections = functions.database
  .instance('dinder-33ca6-default-rtdb')
  .ref('/parties/{id}/connections')
  .onDelete(async (change, context) => {
    try {
      await refs.firestore.parties.doc(context.params.id).set(
        {
          active: false,
          lastActive: admin.firestore.Timestamp.now(),
        },
        { merge: true }
      )
    } catch (error) {
      functions.logger.error(error)
    }
  })

process.on('warning', e => console.warn(e.stack))
