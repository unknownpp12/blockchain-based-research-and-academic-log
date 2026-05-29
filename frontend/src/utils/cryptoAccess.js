// src/utils/cryptoAccess.js
import nacl from "tweetnacl";
import * as util from "tweetnacl-util";
import CryptoJS from "crypto-js";

export function makeUserKeyPair(signature) {
  const seedHex = CryptoJS.SHA256(signature).toString();
  const seed = new Uint8Array(
    seedHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );

  return nacl.box.keyPair.fromSecretKey(seed);
}

export function makeFileKey() {
  return CryptoJS.lib.WordArray.random(32).toString();
}

export function publicKeyToBase64(publicKey) {
  return util.encodeBase64(publicKey);
}

export function publicKeyFromBase64(publicKey) {
  return util.decodeBase64(publicKey);
}

export function encryptFileKeyForUser(fileKey, recipientPublicKey, senderSecretKey) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encrypted = nacl.box(
    util.decodeUTF8(fileKey),
    nonce,
    recipientPublicKey,
    senderSecretKey
  );

  return {
    nonce: util.encodeBase64(nonce),
    data: util.encodeBase64(encrypted),
  };
}

export function decryptFileKey(encryptedKey, senderPublicKey, recipientSecretKey) {
  const decrypted = nacl.box.open(
    util.decodeBase64(encryptedKey.data),
    util.decodeBase64(encryptedKey.nonce),
    senderPublicKey,
    recipientSecretKey
  );

  if (!decrypted) throw new Error("Could not decrypt shared file key");

  return util.encodeUTF8(decrypted);
}
