/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const { onRequest } = require("firebase-functions/v2/https");
// const { onObjectFinalized } = require("firebase-functions/v2/storage");

const {
  log,
  info,
  debug,
  warn,
  error,
  write,
} = require("firebase-functions/logger");

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getStorage } = require("firebase-admin/storage");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const {
  onDocumentUpdated,
  onDocumentCreated,
  Change,
  FirestoreEvent,
} = require("firebase-functions/v2/firestore");

initializeApp();
//const db = admin.firestore();

exports.test1 = onDocumentCreated(
  {
    //  region: "us-east4",
    document: "test&/{testDocID}",
  },
  async (event) => {
    const l = await getAuth().listUsers(1000);
    console.log(JSON.stringify(l));
    return null;
  }
);

exports.test = onDocumentUpdated(
  {
    //  region: "us-east4",
    document: "test/{testDocID}",
  },
  (event) => {
    return getFirestore().runTransaction(async (transaction) => {
      const userId = "1";
      const userDocRef = getFirestore().collection("users").doc(userId);
      const queryRef = getFirestore()
        .collection("docs")
        .where("userId", "==", userId);
      const userDocsSnapshots = await transaction.get(queryRef);

      transaction.delete(userDocRef);
      userDocsSnapshots.forEach((userDocSnap) => {
        transaction.delete(userDocSnap.ref);
      });
      return Promise.resolve();
    });
  }
);

exports.deleteUserDocs = onCall(async (request) => {
  const userId = request.data.userId;

  await getFirestore().runTransaction(async (transaction) => {
    const userDocRef = getFirestore().collection("users").doc(userId);
    const queryRef = getFirestore()
      .collection("docs")
      .where("userId", "==", userId);
    const userDocsSnapshots = await transaction.get(queryRef);

    transaction.delete(userDocRef);
    userDocsSnapshots.forEach((userDocSnap) => {
      transaction.delete(userDocSnap.ref);
    });
    return Promise.resolve();
  });
});

exports.updateUserContactDetails = onDocumentUpdated(
  {
    //  region: "us-east4",
    document: "users/{userId}",
  },
  async (event) => {
    const userId = event.params.userId;

    const newDocValues = event.data.after.data();
    const previousDocValues = event.data.before.data();

    log(JSON.stringify(newDocValues));
    //return true;
    // userName and userPhoneNumber

    if (
      newDocValues.userName !== previousDocValues.userName ||
      newDocValues.userPhoneNumber !== previousDocValues.userPhoneNumber
    ) {
      const booksDocsToAdaptQuery = getFirestore()
        .collection("books")
        .where("borrowerUserId", "==", userId);

      const booksDocsToAdaptQuerySnapshot = await booksDocsToAdaptQuery.get();

      if (booksDocsToAdaptQuerySnapshot.size > 0) {
        const batch = getFirestore().batch();
        booksDocsToAdaptQuerySnapshot.docs.forEach((docSnapshot) => {
          batch.update(docSnapshot.ref, {
            borrowerName: newDocValues.userName,
            borrowerPhoneNumber: newDocValues.userPhoneNumber,
          });
        });
        // Commit the batch
        await batch.commit();
      }
    }

    return null;
  }
);

/* exports.writeBucketOnUpload = onObjectFinalized(
  { bucket: "cloud-functions-gen2-nodejs-b2" },
  (event) => {
    const fileBucket = event.data.bucket; // Storage bucket containing the file.
    log(fileBucket);
    return true;
  }
); */
/*
exports.getDefaultBucketName = onRequest(async (req, res) => {
  const fileBucket = getStorage().bucket();
  const [files] = await fileBucket.getFiles();

  const filesArray = [];
  files.forEach((file) => {
    log(file.name);
    filesArray.push(file.name);
  });

  res.send({ bucketName: filesArray });
}); */

/*   const BATCH_SIZE = 5;

let batch = db.batch();
let j = 0;

for (let i = 0; i < products.length; i++) {
  // Do here the stuff you need

  // Add the stuff you have done to the batch
  const ref = db.collection(collection).doc(document);
  batch.set(ref, data);

  // Push the data
  if (j === BATCH_SIZE) {
    await batch.commit();
    batch = db.batch();
    j = 0; // Reset
  } else j++;

}

// Push the remaining data into Firestore
await batch.commit(); */

//code to source file.metadata.mediaLink
