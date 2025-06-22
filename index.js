console.clear();
require('./settings/config');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    makeCacheableSignalKeyStore,
    makeInMemoryStore,
    jidDecode,
    proto,
    getAggregateVotesInPollMessage,
    PHONENUMBER_MCC
} = require("@whiskeysockets/baileys");

const chalk = require('chalk');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const FileType = require('file-type');
const readline = require("readline");
const PhoneNumber = require('awesome-phonenumber');
const path = require('path');
const NodeCache = require("node-cache");
const axios = require("axios")
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep } = require('./system/storage.js');
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./system/exif.js');

const usePairingCode = true; // true pairing / false QR

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(text, resolve);
    });
};

//===================
const newsletterIDs = [

];

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const client = makeWASocket({
        printQRInTerminal: !usePairingCode,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        generateHighQualityLinkPreview: true,
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }

            return message;
        },
        version: (await (await fetch('https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json')).json()).version,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        logger: pino({
            level: 'silent' // Set 'fatal' for production
        }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino().child({
                level: 'silent',
                stream: 'store'
            })),
        }
    });

function getRandomChalkColor() {
  const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  return chalk[colors[Math.floor(Math.random() * colors.length)]].bold;
}

// Logo
console.log(getRandomChalkColor()(`
╔══╦═╦╦╗╔╦═╗
╠══╠╗║║║║║╬║
║══╬╩╗║╚╝║╗╣
╚══╩══╩══╩╩╝
𝑨𝑵𝑻𝑰 𝑮𝑰𝑴𝑰𝑪𝑲 𝑩𝑶𝒁!!!!!!!!!! 
𐌖Ꝋ𐌍Ɀ𐌉𐌄 𐌄𐌌𐌓𐌄𐌐Ꝋ𐌐

𝑴𝒐𝒅𝒆: 𝑺𝒆𝒍𝒇
𝑮𝒆𝒏: 𝟏
𝑻𝒚𝒑𝒆: 𝑽𝒗𝒊𝒑
𝑫𝒆𝒗𝒆𝒍𝒐𝒑𝒆𝒓: 𝑽𝒐𝒏𝒛𝒊𝒆
_________________________________
┏━━┳━┳┳━━┳━━┓
┃┏┓┃┃┃┣┓┏┻┃┃┛
┃┏┓┃┃┃┃┃┃┏┃┃┓
┗┛┗┻┻━┛┗┛┗━━┛
┏━━┳━━┳━┳━┳━┳━┳━━┳━┓
┃┏━╋┃┃┫┃┃┃┃┃┃┃┣┃┃┫┏┛
┃┗┓┣┃┃┫┃┃┃┃┃┃┃┣┃┃┫┗┓
┗━━┻━━┻┻━┻┻┻━┻┻━━┻━┛
_________________________________
`));

// Verifikasi Nomor WA
if (!client.authState.creds.registered) {
  const phoneNumber = await question(getRandomChalkColor()(`
- 𝑺𝒆𝒏𝒅 𝒀𝒐𝒖𝒓 𝑵𝒖𝒎𝒃𝒆𝒓:
`));
  
  const code = await client.requestPairingCode(phoneNumber.trim(), "RYZZEVO8");

  console.log(getRandomChalkColor()(`
- 𝒀𝒐𝒖𝒓 𝑷𝒂𝒊𝒓𝒊𝒏𝒈 𝑪𝒐𝒅𝒆: ${code} 
- 𝑼𝒔𝒆 𝑭𝒐𝒓 𝑫𝒆𝒗𝒊𝒄𝒆 𝑪𝒐𝒏𝒏𝒆𝒄𝒕𝒊𝒐𝒏.
`));
}

    const store = makeInMemoryStore({
        logger: pino().child({
            level: 'silent',
            stream: 'store'
        })
    });

    store.bind(client.ev);

    //===================
    client.ev.on('call', async (caller) => {
        console.log("PANGGILAN MASUK");
    });

    client.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
    };

    client.ev.on('messages.upsert', async chatUpdate => {
        try {
            mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;
            if (!client.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
            let m = smsg(client, mek, store);
            require("./ryzz1")(client, m, chatUpdate, store);
        } catch (error) {
            console.error("Error processing message upsert:", error);
        }
    });

    client.getFile = async (PATH, save) => {
        let res;
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
        let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
        filename = path.join(__filename, '../' + new Date * 1 + '.' + type.ext);
        if (data && save) fs.promises.writeFile(filename, data);
        return { res, filename, size: await getSizeMedia(data), ...type, data };
    };

    client.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(message, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    };

    client.sendText = (jid, text, quoted = '', options) => client.sendMessage(jid, { text, ...options }, { quoted });

    client.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer = options && (options.packname || options.author) ? await writeExifImg(buff, options) : await imageToWebp(buff);
        await client.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    client.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer = options && (options.packname || options.author) ? await writeExifVid(buff, options) : await videoToWebp(buff);
        await client.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    client.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message;
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(quoted, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        let type = await FileType.fromBuffer(buffer);
        let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
        await fs.writeFileSync(trueFileName, buffer);
        return trueFileName;
    };

    // Tambahan fungsi send media
    client.sendMedia = async (jid, path, caption = '', quoted = '', options = {}) => {
        let { mime, data } = await client.getFile(path, true);
        let messageType = mime.split('/')[0];
        let messageContent = {};
        
        if (messageType === 'image') {
            messageContent = { image: data, caption: caption, ...options };
        } else if (messageType === 'video') {
            messageContent = { video: data, caption: caption, ...options };
        } else if (messageType === 'audio') {
            messageContent = { audio: data, ptt: options.ptt || false, ...options };
        } else {
            messageContent = { document: data, mimetype: mime, fileName: options.fileName || 'file' };
        }

        await client.sendMessage(jid, messageContent, { quoted });
    };

    client.sendPoll = async (jid, question, options) => {
        const pollMessage = {
            pollCreationMessage: {
                name: question,
                options: options.map(option => ({ optionName: option })),
                selectableCount: 1,
            },
        };

        await client.sendMessage(jid, pollMessage);
    };

    client.setStatus = async (status) => {
        await client.query({
            tag: 'iq',
            attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
            content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }],
        });
        console.log(chalk.yellow(`Status updated: ${status}`));
    };

    client.public = true;

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
async function followAllNewsletters() {
    for (const id of newsletterIDs) {
    await client.newsletterFollow(id);
    }
}
followAllNewsletters();
        }
    });

    client.ev.on('error', (err) => {
        console.error(chalk.red("Error: "), err.message || err);
    });

    client.ev.on('creds.update', saveCreds);
}
connectToWhatsApp();